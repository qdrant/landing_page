---
title: Multi-Source AI Agent with BQ, ColBERT Reranking, and Live Web Search
weight: 8
social_preview_image: /articles_data/binary-quantization-openai/preview/social_preview.jpg
aliases:
  - /documentation/bq-colbert-wikipedia-search/
  - /articles/bq-colbert-wikipedia-search/
---

Most RAG tutorials stop at "retrieve documents, stuff them into a prompt." Real applications need more: multiple knowledge sources, intelligent routing, user personalization, caching, and graceful fallbacks when your primary source doesn't have the answer.

In this tutorial, you'll build **Wiki Connect**, an AI agent that takes any two topics (say "Black Holes" and "Jazz Music"), searches across 35 million Wikipedia vectors, optionally falls back to live web search, and generates a grounded article explaining the connection. The agent streams its reasoning to the frontend in real time, so users can see every decision it makes.

Here's what you'll wire together:

- **Qdrant**: 4 collections for knowledge, articles, preferences, and web cache
- **Binary Quantization + ColBERT**: two-stage retrieval for speed and precision
- **Linkup API**: live web search fallback when Wikipedia is stale
- **Gemini 2.0 Flash**: grounded article generation with streaming
- **User feedback loop**: personalization stored as vectors in Qdrant

<aside role="status">If you're new to Binary Quantization, check out our <a href="/articles/binary-quantization/">introduction to BQ in Qdrant</a> first. For background on late interaction models, see <a href="/articles/late-interaction-models/">our guide to ColBERT and late interaction</a>.</aside>

The full source code is available on [GitHub](https://github.com/thierrypdamiba/bq-colbert-wiki-agent).

## What you'll need

- A [Qdrant Cloud](https://cloud.qdrant.io/) cluster (or a local instance)
- An [OpenAI API key](https://platform.openai.com/api-keys) for dense embeddings
- A [Google AI API key](https://aistudio.google.com/apikey) for Gemini
- A [Linkup API key](https://linkup.so) for web search (optional)
- A [Modal](https://modal.com) account for GPU-accelerated ingestion
- Python 3.11+ and Node.js 18+

```bash
pip install qdrant-client openai fastembed datasets pyarrow modal google-genai linkup-sdk
```

## The architecture

Before diving into code, let's look at how the agent makes decisions. When a user asks to connect two topics, the agent runs through this pipeline:

| Step | Action | Target |
|---|---|---|
| 1 | **Cache check** | `user_articles`, exact match on topic pair |
| 2 | **Wikipedia** | `wikipedia_multimodal`, BQ + ColBERT |
| 3 | **Web fallback** | Linkup API → `linkup_cache` (24h TTL) |
| 4 | **Preferences** | `user_feedback`, style prefs by user |
| 5 | **Generation** | Gemini 2.0 Flash, streaming |
| 6 | **Storage** | `user_articles`, cache for reuse |

Each step is an explicit decision the agent logs and streams to the frontend. Let's build each piece.

## Step 1: Set up the four Qdrant collections

The agent uses four collections, each optimized for a different access pattern:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    HnswConfigDiff, MultiVectorConfig, MultiVectorComparator,
    BinaryQuantization, BinaryQuantizationConfig,
    PayloadSchemaType,
)

client = QdrantClient(url="your-qdrant-url", api_key="your-api-key")

# 1. Wikipedia knowledge base: 35M vectors with BQ + ColBERT
client.create_collection(
    collection_name="wikipedia_multimodal",
    vectors_config={
        "dense": VectorParams(
            size=256,
            distance=Distance.COSINE,
            on_disk=True,
        ),
        "colbert": VectorParams(
            size=128,
            distance=Distance.COSINE,
            on_disk=True,
            multivector_config=MultiVectorConfig(
                comparator=MultiVectorComparator.MAX_SIM,
            ),
        ),
    },
    quantization_config=BinaryQuantization(
        binary=BinaryQuantizationConfig(always_ram=True),
    ),
    hnsw_config=HnswConfigDiff(m=0),  # Disable during bulk insert
    shard_number=2,
)

# 2. Generated articles cache: exact-match topic lookups
client.create_collection(
    collection_name="user_articles",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

# 3. User feedback: personalization
client.create_collection(
    collection_name="user_feedback",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

# 4. Web search cache: Linkup results with TTL
client.create_collection(
    collection_name="linkup_cache",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)
```

Why four collections instead of one? Each has a fundamentally different access pattern:

- **`wikipedia_multimodal`** uses BQ + ColBERT prefetch for semantic search at scale
- **`user_articles`** uses scroll + keyword filters for exact-match cache lookups (no vector similarity needed)
- **`user_feedback`** uses semantic search + user ID filtering for preference retrieval
- **`linkup_cache`** uses semantic search + client-side TTL expiration

## Step 2: Ingest Wikipedia with dual embeddings

Each Wikipedia article gets two vectors: a dense embedding for fast BQ retrieval and a ColBERT multi-vector for precision reranking. The ingestion runs on [Modal](https://modal.com) with T4 GPUs:

```python
from datasets import load_dataset
from fastembed import LateInteractionTextEmbedding
import openai

# Load Wikipedia from HuggingFace
ds = load_dataset("wikimedia/wikipedia", "20231101.simple", split="train[:5000]")

# Initialize embedding models
openai_client = openai.OpenAI(api_key="your-key")
colbert = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")

batch_size = 100
for i in range(0, len(ds), batch_size):
    batch = ds[i:i + batch_size]
    texts = [str(t)[:4000] for t in batch["text"] if t]

    # Dense embeddings (OpenAI, 256d MRL), runs on CPU
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
        dimensions=256,
    )
    dense_vectors = [d.embedding for d in response.data]

    # ColBERT multi-vectors, runs on GPU
    colbert_vectors = list(colbert.embed(texts))

    # Build points with both vectors + rich metadata
    points = []
    for j, (dense_vec, colbert_vec) in enumerate(
        zip(dense_vectors, colbert_vectors)
    ):
        payload = extract_rich_metadata(
            title=batch["title"][j],
            text=texts[j],
        )
        points.append(PointStruct(
            id=uuid.uuid4().hex,
            vector={
                "dense": dense_vec,
                "colbert": colbert_vec.tolist(),
            },
            payload=payload,
        ))

    client.upsert(
        collection_name="wikipedia_multimodal",
        points=points,
        wait=True,
    )
```

Each article also gets 50+ metadata fields extracted with fast regex heuristics: topic classification, quality scores, temporal data, reading level. These power in-graph filtered search at query time. The full `extract_rich_metadata` function is in the [source repo](https://github.com/thierrypdamiba/bq-colbert-wiki-agent/blob/main/modal_wiki_ingest.py).

After all data is loaded, rebuild the HNSW index:

```python
client.update_collection(
    collection_name="wikipedia_multimodal",
    hnsw_config=HnswConfigDiff(m=16),
)
# Wait for green status
while client.get_collection("wikipedia_multimodal").status.value != "green":
    time.sleep(1)
```

<aside role="status">We're using Simple English Wikipedia here for testing. The full English Wikipedia has 6M+ articles and 35M+ sections. The same pipeline handles both. Just change the dataset config. The ingestion script supports 8 embedding configurations you can benchmark against each other.</aside>

## Step 3: Build the two-stage search function

This is the core of the retrieval layer. The agent queries Qdrant with BQ-accelerated dense retrieval, then reranks with ColBERT, all in a single request:

```python
def search_world(query: str, top_k: int = 5):
    """Search Wikipedia with BQ retrieval + ColBERT reranking."""

    # Embed the query with both models
    dense_response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[query],
        dimensions=256,
    )
    dense_query = dense_response.data[0].embedding

    colbert_query = list(colbert.query_embed([query]))[0]

    # Two-stage search: BQ prefetch → ColBERT rerank
    results = client.query_points(
        collection_name="wikipedia_multimodal",
        prefetch={
            "query": dense_query,
            "using": "dense",
            "limit": 50,  # Oversample with BQ
        },
        query=colbert_query.tolist(),
        using="colbert",
        limit=top_k,
    )

    return [
        {
            "page_title": p.payload["title"],
            "section_text": p.payload["text_preview"],
            "url": p.payload["url"],
            "page_id": p.payload["wiki_id"],
            "score": p.score,
        }
        for p in results.points
    ]
```

Here's what happens inside Qdrant:

1. The `prefetch` stage searches BQ-compressed dense vectors using Hamming distance over HNSW. Extremely fast binary comparisons on 256 bits
2. Qdrant retrieves the top 50 candidates
3. The `query` stage rescores those 50 with ColBERT's MaxSim, computing token-level similarity between query and document
4. The top results are returned, ranked by ColBERT score

No external reranking API. One request, two stages.

## Step 4: Add the Linkup web search fallback

Wikipedia is comprehensive, but it doesn't cover everything. Recent events and niche connections are often missing. When the agent's Wikipedia scores are below a threshold, it falls back to live web search via [Linkup](https://linkup.so):

```python
from linkup import LinkupClient

linkup = LinkupClient(api_key="your-linkup-key")

def search_and_cache(query: str, deep: bool = False) -> list[dict]:
    """Search the web and cache results in Qdrant."""
    from extended_memory import cache_linkup_result, search_linkup_cache

    # Check Qdrant cache first (24h TTL)
    cached = search_linkup_cache(query, top_k=3)
    if cached and len(cached) >= 2:
        return cached

    # Fetch fresh results from Linkup
    response = linkup.search(
        query=query,
        depth="deep" if deep else "standard",
        output_type="searchResults",
    )

    results = [
        {
            "url": r.url,
            "title": r.name,
            "snippet": r.content[:500] if r.content else "",
            "content": r.content or "",
        }
        for r in response.results
    ]

    # Cache in Qdrant with TTL
    for r in results[:5]:
        cache_linkup_result(
            query=query,
            url=r["url"],
            title=r["title"],
            snippet=r["snippet"],
            content=r["content"],
            ttl_hours=24,
        )

    return results
```

The agent stores web results in the `linkup_cache` collection with a `fetched_at` and `expires_at` timestamp. On subsequent searches, it checks the cache first and filters out expired entries, reducing API calls while keeping content fresh.

## Step 5: Wire up the agent routing logic

Here's where the pieces come together. The agent makes explicit decisions at each step and streams them to the frontend via Server-Sent Events:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/connect/stream")
async def connect_topics_stream(request: ConnectRequest):

    async def generate_events():
        topic_a = request.topic_a
        topic_b = request.topic_b
        user_id = request.user_id or "default"

        # DECISION 1: Check article cache
        yield send_decision(
            "Query Routing",
            f"Input topics: '{topic_a}' and '{topic_b}'.",
            "Route to multi-collection search: cache → Wikipedia → web fallback"
        )

        cached = find_cached_article(topic_a, topic_b, user_id)
        if cached:
            yield send_event("article", cached)
            return

        # DECISION 2: Parallel Wikipedia search
        results_a = search_world(topic_a, top_k=4)
        results_b = search_world(topic_b, top_k=4)
        connection_results = search_world(
            f"{topic_a} {topic_b} relationship", top_k=3
        )

        # DECISION 3: Web fallback routing
        avg_score = sum(r["score"] for r in results_a[:2] + results_b[:2]) / 4
        if avg_score < 0.85 and linkup_available():
            yield send_decision(
                "Linkup Routing",
                f"Wikipedia avg score {avg_score:.3f} < 0.85 threshold.",
                "Query Linkup API for supplementary web content"
            )
            linkup_results = search_and_cache(
                f"{topic_a} {topic_b} connection"
            )
            linkup_context = format_for_grounding(linkup_results)
        else:
            linkup_context = ""

        # DECISION 4: Load user preferences
        preferences = get_user_preferences(user_id, top_k=10)
        pref_instructions = build_preference_prompt(preferences)

        yield send_decision(
            "Preference Application",
            f"Found {len(preferences)} stored preferences.",
            f"Injecting into prompt: {pref_instructions[:50]}..."
        )

        # STEP: Generate with Gemini (streaming)
        prompt = build_article_prompt(
            topic_a, topic_b,
            context_a, context_b, context_conn,
            linkup_context, pref_instructions,
        )

        article_content = ""
        for chunk in generate_content_stream(prompt):
            article_content += chunk
            yield send_event("content", {"chunk": chunk})

        # STEP: Store in Qdrant for caching
        store_article(user_id, title, article_content,
                      topic_a, topic_b, source_page_ids, source_urls)

        yield send_event("complete", {"cached": False})

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
    )
```

The key design decisions in this routing logic:

1. **Cache-first**: The agent checks `user_articles` with exact keyword matching (scroll + filter, no vector similarity) before doing any expensive work.

2. **Score-based fallback**: If Wikipedia's similarity scores are below 0.85, the agent routes to Linkup for supplementary web content. This handles recent topics that Wikipedia hasn't covered yet.

3. **Preference injection**: User feedback from the `user_feedback` collection is grouped by type (text style, format, content depth) and injected into the generation prompt.

4. **Streaming everything**: Every decision, every search result, every generated chunk is streamed to the frontend via SSE. The user sees the agent's reasoning in real time.

## Step 6: Add the exact-match article cache

The caching layer uses Qdrant's scroll API with keyword filters, not vector similarity. For cache lookups, you want exact matches on the topic pair, not "similar" articles.

```python
def find_cached_article(topic_a: str, topic_b: str, user_id: str) -> dict | None:
    """Check if we already have an article for this topic combination."""
    topic_a_norm = topic_a.replace(" ", "_")
    topic_b_norm = topic_b.replace(" ", "_")

    # Try forward order
    results = client.scroll(
        collection_name="user_articles",
        scroll_filter=Filter(must=[
            FieldCondition(key="topic_a", match=MatchValue(value=topic_a_norm)),
            FieldCondition(key="topic_b", match=MatchValue(value=topic_b_norm)),
        ]),
        limit=1,
    )

    if results[0]:
        return results[0][0].payload

    # Try reverse order (A↔B is the same as B↔A)
    results = client.scroll(
        collection_name="user_articles",
        scroll_filter=Filter(must=[
            FieldCondition(key="topic_a", match=MatchValue(value=topic_b_norm)),
            FieldCondition(key="topic_b", match=MatchValue(value=topic_a_norm)),
        ]),
        limit=1,
    )

    return results[0][0].payload if results[0] else None
```

This is a good pattern to remember: **not everything in a vector database needs vector similarity**. Qdrant's scroll with keyword filters is faster and more predictable for exact lookups.

## Step 7: Add the personalization loop

Users can rate articles and provide feedback on writing style, format, and content depth. This feedback is stored as vectors in Qdrant and retrieved for future generations:

```python
def store_feedback(user_id, article_id, feedback_type, feedback_text, rating):
    """Store user feedback as a vector for future preference retrieval."""
    embedding = embed(feedback_text)  # Cohere 768d

    client.upsert(
        collection_name="user_feedback",
        points=[PointStruct(
            id=uuid.uuid4().hex,
            vector=embedding,
            payload={
                "user_id": user_id,
                "article_id": article_id,
                "feedback_type": feedback_type,  # text_style, format, content
                "feedback_text": feedback_text,
                "rating": rating,  # 1-5 stars
            },
        )],
    )

def get_user_preferences(user_id, top_k=10):
    """Retrieve top-rated preferences for a user."""
    results = client.scroll(
        collection_name="user_feedback",
        scroll_filter=Filter(must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
        ]),
        limit=top_k,
        with_payload=True,
    )

    # Sort by rating, group by type
    preferences = sorted(
        [p.payload for p in results[0]],
        key=lambda x: x.get("rating", 0),
        reverse=True,
    )
    return preferences
```

The agent groups preferences by type and injects them into the Gemini prompt:

```
**USER PREFERENCES (apply these to your writing):**
Writing style: Use concise explanations; Prefer bullet points for lists
Format: Include a summary section at the top
Content: Go deeper on technical details
```

The more a user interacts, the better the articles match their preferences, all driven by vector retrieval from Qdrant.

## Step 8: Stream agent decisions to the frontend

The frontend receives Server-Sent Events showing every step the agent takes. This is what makes the agent feel transparent rather than like a black box:

```typescript
// Frontend: /api/connect/stream/route.ts
const stream = new ReadableStream({
  async start(controller) {
    // Each decision and step is streamed as an SSE event
    send(sendDecision(
      "Query Routing",
      `Input topics: '${topicA}' and '${topicB}'.`,
      "Route to multi-collection search"
    ));

    send(sendEvent("step", {
      step: "search_a",
      status: "running",
      message: "Searching Qdrant wikipedia_multimodal collection...",
      detail: `Query: "${topicA}" | Collection: 35M+ vectors`,
    }));

    // ... search, generate, store ...

    // Stream article content chunk by chunk
    for await (const chunk of generateContentStream(prompt)) {
      send(sendEvent("content", { chunk }));
    }
  }
});
```

The frontend renders these events in a sidebar panel, showing:
- **Agent decisions**: why it chose Wikipedia over web search, what preferences it applied
- **Search results**: similarity scores, matched sections, source URLs
- **Generation progress**: article streaming in real time
- **Storage confirmation**: article ID, cache status

## Step 9: Query with filtered BQ + ColBERT reranking

You can combine the two-stage BQ + ColBERT retrieval with payload filters. The filters are applied during the HNSW walk in the prefetch stage:

```python
results = client.query_points(
    collection_name="wikipedia_multimodal",
    prefetch={
        "query": dense_query,
        "using": "dense",
        "limit": 50,
        "filter": Filter(must=[
            FieldCondition(
                key="quality_score",
                range=Range(gte=70),
            ),
            FieldCondition(
                key="primary_topic",
                match=MatchValue(value="science"),
            ),
        ]),
    },
    query=colbert_query.tolist(),
    using="colbert",
    limit=5,
)
```

This gives you "high-quality science articles about quantum computing, ranked by ColBERT precision," and it runs in under 30ms.

## What you should expect

Here's the performance profile of the full agent:

| Component | Latency | Notes |
|---|---|---|
| Cache check (scroll + filter) | ~5ms | Exact-match keyword lookup |
| Wikipedia search (BQ + ColBERT) | ~25ms | Per query, 3 queries total |
| Linkup web search | ~200ms | Only when Wikipedia scores < 0.85 |
| Preference loading | ~5ms | Scroll with user_id filter |
| Gemini generation (streaming) | 2-5s | First chunk in ~500ms |
| Article storage | ~50ms | Embed + upsert |

And the memory savings from BQ + ColBERT on the Wikipedia collection:

| Metric | Dense Only | BQ + ColBERT Rerank |
|---|---|---|
| Dense vector RAM | ~33 GB | ~1.1 GB |
| ColBERT storage (on disk) | N/A | ~25 GB |
| Total RAM required | ~33 GB | ~1.1 GB |
| Effective recall@5 | ~95% | ~97-99% |

You're trading 10ms of extra latency for a 30x reduction in memory cost.

## Recap

Let's review what you built:

1. **Four-collection architecture**: knowledge base, article cache, user preferences, and web cache. Each collection optimized for its access pattern.

2. **BQ + ColBERT two-stage retrieval**: Binary Quantization for fast candidate retrieval over 35M vectors, ColBERT MaxSim for precision reranking. One Qdrant request, two stages.

3. **Smart routing with web fallback**: the agent checks Wikipedia similarity scores and routes to Linkup for fresh web content when coverage is thin. Results are cached in Qdrant with a 24-hour TTL.

4. **Personalization via feedback vectors**: user preferences stored in Qdrant, grouped by type, and injected into the generation prompt. The system improves with every interaction.

5. **Streaming agent transparency**: every decision, search result, and generated chunk is streamed to the frontend via SSE. Users see the reasoning, not just the result.

6. **Exact-match caching**: generated articles cached with keyword filters on topic pairs. No vector similarity needed for cache lookups. Qdrant's scroll API handles it.

The full source code is on [GitHub](https://github.com/thierrypdamiba/bq-colbert-wiki-agent), including the Modal GPU ingestion pipeline with 8 embedding configurations. Join the [Qdrant Discord](https://qdrant.to/discord) if you have questions.
