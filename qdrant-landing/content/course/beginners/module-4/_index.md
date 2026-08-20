---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: how to design a vector search system, covering layers, filtering, RAG, and deployment."
description: "Design a vector search system: the layers of the stack, five design questions, filtering, a production RAG pipeline, and deployment options."
isLesson: true
weight: 50
draft: false
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
  <iframe src="https://www.youtube.com/embed/0qQ3B9uirz0?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

#### TL;DR

> Module 3 gave you hybrid retrieval. In this module, you'll learn how to turn the building blocks into a system. You'll explore the five layers of a vector search stack and the five questions that turn a brief into a design, then see how Qdrant plans a filtered query instead of discarding results afterward. You'll also learn what a production RAG pipeline looks like and how to pick a deployment mode. By the end, you'll have designed a news search system end to end.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

## Today's Path

1. The Layers of the Stack
2. Worked Example: Designing a News Search System
3. How Qdrant Plans a Filtered Query
4. The Production RAG Pipeline
5. Deployment Options
6. Knowledge Check
7. References and Further Reading

## 1. The Layers of the Stack

Every vector search system is built from the same five layers. When something is slow, wrong, or expensive, the first diagnostic question is always the same: **which layer is the problem in?**

- **Query layer**: embedding the query, choosing dense, sparse, or hybrid, fusing results, setting limits. Module 3's territory.
- **Indexing layer**: the HNSW graph for vectors and payload indexes for filter fields. Mistakes here make things slow rather than wrong.
- **Storage layer**: vectors, payloads, and IDs on disk and in memory.
- **Knowledge layer**: the data and how it's prepared: chunking, embedding model, payload schema. Garbage in, garbage retrieved.
- **Distribution layer**: sharding, replication, and multi-node clusters. Not a day-one concern.

Every design decision belongs to one of them: "add a payload index" is indexing, "chunk long articles" is knowledge, "move to three nodes" is distribution.

![The five layers of a vector search stack, from the query layer at the top down through indexing, storage, and knowledge to the distribution layer at the base.](/courses/beginners/module-4/layers.png)

### Diagnose It

Three reports from a running system. Name the layer responsible for each before opening the answers.

1. Searches scoped to one country take four seconds. The same search without the country filter returns in milliseconds.
2. Analysts searching a company ticker get the right company about half the time. The system uses dense vectors only.
3. The memory bill doubled after the team added a second language, though the number of articles did not change.

<details>
<summary>Show the answers</summary>

1. Indexing layer. No payload index on country, so the planner cannot estimate how many points match and falls back to scanning. Adding the index fixes filtering and the estimate immediately; the filter-aware graph edges need an HNSW rebuild (see Question 2).
2. Query layer. A ticker is an exact token and dense retrieval blurs it into neighboring tickers. The fix is hybrid retrieval, not a better dense model.
3. Storage layer. A second language means a second [named vector](/documentation/manage-data/vectors/#named-vectors) per point, roughly doubling the vector bytes in memory. Fix it with [quantization](/documentation/manage-data/quantization/) or [on-disk vectors](/documentation/manage-data/storage/#vector-storage), not with a different search.

</details>

## 2. Worked Example: Designing a News Search System

Here's the brief, the kind you'd get on a real project:

> Analysts at a research firm need to search global news that arrives continuously. They ask in plain language ("port congestion in Southeast Asia") and they scope every search by country, topic, date range, and source. Perhaps a fifth of queries name one specific thing, a company ticker or a ship name.

Five questions turn that into a design.

### Question 1: What Do the Queries Look Like?

*Natural language, exact tokens, or both?*

Both, and this is the most consequential observation in the design. "Port congestion in Southeast Asia" describes an intent, which is dense territory. "MAERSK-B.CO" carries no meaning a dense model can use, so dense search blurs it into neighboring tickers, the failure from Module 3.

**Decision**: hybrid search, with [named dense and sparse vectors](/documentation/manage-data/vectors/#named-vectors) on every point, fused at query time. *(Query layer.)*

```bash
pip install "qdrant-client[fastembed]"
```

Name both models once and reuse them at ingestion and at query time. `models.Document` embeds locally through [FastEmbed](/documentation/fastembed/), which keeps this example self-contained; [Cloud Inference](/documentation/inference/cloud-inference/) does the same work server-side and is the production path.

```python
from qdrant_client import QdrantClient, models

DENSE_MODEL  = "BAAI/bge-small-en-v1.5"   # FastEmbed's default, 384 dimensions
SPARSE_MODEL = "Qdrant/bm25"

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="news",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            # Required for correct BM25 scoring, as covered in Module 3
            modifier=models.Modifier.IDF,
        ),
    },
)
```

### Question 2: What Must the System Filter On?

*Which constraints must hold on every result?*

Country, topic, date range, and source. An analyst scoping to "Vietnam, last seven days" expects those articles and no others, so these are constraints, not ranking signals.

**Decision**: the payload schema, designed before ingestion. Build it by asking what you will need to filter on: country, topic, source, and date here, plus tenant ID and access-control fields wherever the data is [multi-tenant](/documentation/manage-data/multitenancy/). A field you never stored costs a full re-ingestion.

```yaml
payload:
  country: string         # indexed
  topic: string           # indexed
  source: string          # indexed
  published_at: datetime  # indexed
  headline: string        # returned, never filtered
  lead: string            # returned, never filtered
  body: string            # returned, never filtered
```

Create the indexes before a single point is uploaded. Qdrant adds filter-aware edges to the HNSW graph for indexed payload values, and only for indexes that exist when the graph is built. A later index still filters and still feeds the planner's estimate, but earning those edges means an [HNSW rebuild](/documentation/manage-data/indexing/). Build order: collection, every payload index, then ingest. *(Knowledge and indexing layers.)*

```python
for field in ["country", "topic", "source"]:
    client.create_payload_index(
        collection_name="news",
        field_name=field,
        field_schema=models.PayloadSchemaType.KEYWORD,
    )

client.create_payload_index(
    collection_name="news",
    field_name="published_at",
    field_schema=models.PayloadSchemaType.DATETIME,
)
```

With the indexes in place, load a few articles. An [upsert](/documentation/manage-data/points/#upload-points) inserts a point if the ID is new and replaces it if the ID exists. Three articles here keep the page runnable; the notebook uses nine:

```python
ARTICLES = [
    ("VN", "shipping", "reuters", "2026-07-15T08:00:00Z",
     "Port congestion worsens at Ho Chi Minh City terminals"),
    ("VN", "shipping", "nikkei", "2026-07-18T08:00:00Z",
     "MAERSK-B.CO delisting rumour denied by carrier"),
    ("SG", "shipping", "caixin", "2026-07-20T08:00:00Z",
     "Singapore berth waiting times fall for a third week"),
]

client.upsert(
    collection_name="news",
    points=[
        models.PointStruct(
            id=i,
            # both named vectors come from the same headline text
            vector={
                "dense": models.Document(text=headline, model=DENSE_MODEL),
                "sparse": models.Document(text=headline, model=SPARSE_MODEL),
            },
            payload={
                "country": country, "topic": topic, "source": source,
                "published_at": published_at, "headline": headline,
            },
        )
        for i, (country, topic, source, published_at, headline) in enumerate(ARTICLES)
    ],
)
```

### Question 3: What's the Workload Shape?

*How much data, in what modalities, arriving how fast?*

Millions of articles, text-only, arriving continuously, and analysts expect this morning's news this morning.

**Decision**: one collection, and continuous upserts, not periodic rebuilds. One call handles new articles and corrections alike.

The one-off backfill is different: batch it, and consider [disabling indexing until it finishes](/documentation/manage-data/bulk-upload/). After that Qdrant indexes as it ingests, but not instantly, so watch the unindexed point count. If it climbs, ingestion is outpacing indexing. *(Storage and knowledge layers.)*

### Question 4: What Does the Retrieval Pipeline Look Like?

*Dense-only, hybrid, or reranked?*

The simplest pipeline that fits the query analysis: hybrid from Question 1, plus filters, fused with [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). No reranker yet.

One knowledge-layer decision hides in here: **what you embed matters as much as how you search.** A news article runs 800 words and the ticker is one token inside it, so embedding the whole body averages it into a vector about shipping in general. Embed the headline and lead, keep the full text in the payload, and the dense vector stays about one story.

The [filter](/documentation/search/filtering/) goes inside each `Prefetch`, so both retrievers search only the valid subset.

```python
QUERY = "port congestion in Southeast Asia"

news_filter = models.Filter(
    must=[
        models.FieldCondition(key="country", match=models.MatchValue(value="VN")),
        models.FieldCondition(
            key="published_at",
            # a fixed date keeps the example reproducible;
            # in production this is now() minus seven days
            range=models.DatetimeRange(gte="2026-07-01T00:00:00Z"),
        ),
    ]
)

results = client.query_points(
    collection_name="news",
    prefetch=[
        # Both prefetches reuse the constants from Question 1, so the query is
        # always embedded by the same model that produced the stored vectors
        models.Prefetch(
            query=models.Document(text=QUERY, model=DENSE_MODEL),
            using="dense", filter=news_filter, limit=50,
        ),
        models.Prefetch(
            query=models.Document(text=QUERY, model=SPARSE_MODEL),
            using="sparse", filter=news_filter, limit=50,
        ),
    ],
    query=models.RrfQuery(rrf=models.Rrf()),
    limit=10,
)
```

### Question 5: What Are the Deployment Constraints?

*Latency budget, data residency, cost, and who operates this?*

A small engineering team, no residency restrictions, and a "please don't page us at night" constraint, which points at managed deployment. The same design runs self-hosted if the constraints differ, so treat design and deployment mode as independent decisions. *(Distribution layer.)*

### Try It: Why Hybrid, Not Dense Alone

The notebook runs `MAERSK-B.CO delisting` against nine articles, two of them differing only in the ticker. Dense puts the right one first but scores it 0.7998 against the decoy's 0.6485, a gap of 0.151. BM25 scores the same pair 11.7550 and 2.3025, a gap of 9.45, and it returns only those two articles because nothing else in the collection shares a term with the query. On nine articles that thin dense margin still lands the right answer; on nine million it is noise.

Then run `vessels queuing outside harbours in Vietnam`, which shares no word with the article it should find. Dense ranks that article first at 0.7093. BM25 returns a single result and it is the wrong one, matching "Vietnam" in an unrelated export story. The ticker query is where sparse rescues dense. This one runs the other way.

### The Design on One Page

| Question | Answer for this system | Layer |
|----------|------------------------|-------|
| Query type | Mixed semantic and exact, so hybrid with Reciprocal Rank Fusion | Query |
| Filter scope | country, topic, source, date, indexed before ingestion | Knowledge, indexing |
| Workload shape | Millions of articles: bulk backfill, then continuous ingestion | Storage |
| Pipeline | Hybrid with per-prefetch filters; headline and lead embedded; no reranker yet | Query, knowledge |
| Deployment | Managed; design independent of the choice | Distribution |

## 3. How Qdrant Plans a Filtered Query

Module 3 covered how to write a filter and where to put it in a hybrid query. What's new is what Qdrant does with one.

Post-filtering retrieves a fixed number of nearest results, the top K, then discards whatever fails the filter. With a selective filter, one country out of 200, even a large K can come back empty.

Qdrant runs a [query planner](/documentation/search/search/#query-planning) instead. It begins by estimating **cardinality**: how many points the filter will actually match. Then it picks a strategy for each **[segment](/documentation/manage-data/storage/#vector-storage)**, the independent pieces a collection is stored in. A segment holding few points gets scanned outright. A low-cardinality filter goes through the payload index. A high-cardinality one uses the filterable vector index, which is the HNSW graph carrying the filter-aware edges from Question 2.

One more strategy covers the awkward middle. When a filter matches a small fraction of the collection but still a large number of points, Qdrant uses [ACORN](/documentation/search/search/#acorn-search-algorithm), a graph traversal built for that case. Every threshold in these decisions is configurable per collection.

That estimate comes from the payload index, so an unindexed field leaves the planner guessing and the query slow rather than wrong. That is how a missing index sits in production unnoticed for months.

![Filtered query](/courses/beginners/module-4/query.png)

## 4. The Production RAG Pipeline

**Retrieval-Augmented Generation (RAG)** answers a question from your own data: retrieve the relevant chunks, hand them to a large language model as context, and it answers from what you gave it, not from training. [What is RAG](/articles/what-is-rag-in-ai/) covers the pattern in depth.

Give the news system that feature and the pipeline has four steps:

1. **Query understanding**: pull hard constraints (dates, country, topic) into a filter, and embed the query as a dense and a sparse vector. The unit changes here: search returned whole articles, but generation needs passages short enough to fit a prompt, so bodies are split into chunks and each chunk becomes its own point.
2. **Hybrid retrieval**: one `query_points` call, filtered on each prefetch, fused with `RrfQuery`, keeping the top 20 chunks.
3. **Optional reranking**: a second scoring pass over that short list. A cross-encoder reads query and chunk together, which is more accurate than comparing two separate embeddings and far too slow to run over a whole collection, so it reorders the 20 and keeps five. Add it when the right chunk keeps landing at position 8 when it should be at 2. [Reranking in Semantic Search](/documentation/search-precision/reranking-semantic-search/) compares the types and their cost.
4. **Generation**: the top chunks go in as context and the model writes the answer.

### Rule of Thumb

When RAG quality disappoints, improve step 2 before reaching for a bigger model in step 4. Retrieval sets the ceiling: the model cannot cite a chunk it never received.

## 5. Deployment Options

Question 5 picked managed deployment for the news system. Here is the full set, and the design runs unchanged on any of them.

| Deployment Mode | Use When | Avoid When |
|-----------------|----------|------------|
| [Local Mode](/documentation/quickstart/) | Prototyping, notebooks, CI tests, teaching | Production or benchmarking |
| [Docker (self-hosted)](/documentation/installation/#docker) | Full infrastructure control, air-gapped or regulated environments | You don't yet have monitoring and backups |
| [Managed Cloud](/documentation/cloud/) | Small ops team, with upgrades, backups, and high availability handled for you | Everything must run inside your own infrastructure |
| [Edge](/documentation/edge/) | On-device search, offline, ultra-low latency | You need distributed search across nodes |

Two further modes cover stricter requirements. [Hybrid Cloud](/documentation/hybrid-cloud/) runs Qdrant in your own environment with the control plane managed for you, and [Private Cloud](/documentation/private-cloud/) runs it in any Kubernetes cluster. Both exist for regulated industries, finance and healthcare especially. [Deploy Qdrant](/documentation/deploy-intro/) covers those alongside Managed Cloud and self-hosted installation.

One caveat about Local Mode, since it's where you'll run the course notebooks. It reimplements the API in Python with none of the engine behind it: search is exact instead of approximate, payload indexes have no effect, and a filter on the outer query is ignored. Verify against a real server before trusting notebook numbers.

## 6. Knowledge Check

A new brief, not the one you just designed:

> A SaaS company wants to search its own support tickets. Agents describe a problem in their own words ("customer can't log in after SSO change") and often paste an error code such as `AUTH-5521`. Every search must be scoped to the agent's own product line, and to tickets from the last two years. There are four million tickets, arriving a few thousand a day.

Work through the five questions before opening the answers.

<details>
<summary>Question 1: What do the queries look like?</summary>

Both kinds, as in the news system. The description is semantic; the error code is an exact token a dense model will blur into neighboring codes. So: hybrid, fused with Reciprocal Rank Fusion. (Query layer.)

</details>

<details>
<summary>Question 2: What must the system filter on?</summary>

Product line as a keyword index and ticket date as a datetime index, both created before ingestion. Anything an agent must never see across product lines is a filter, not a ranking signal.

</details>

<details>
<summary>Question 3: What's the workload shape?</summary>

A bulk backfill of four million text tickets, then light continuous ingestion. One collection, upserts, no distribution-layer work on day one.

</details>

<details>
<summary>Question 4: What does the retrieval pipeline look like?</summary>

Hybrid retrieval with the filter inside each prefetch. The knowledge-layer decision is what to embed: a ticket thread runs long, so embed the subject and the first message and keep the full thread in the payload. Add a reranker only if evaluation shows the right ticket landing below the fold.

</details>

<details>
<summary>Question 5: What are the deployment constraints?</summary>

Not stated in the brief, which is the point. Ask before you choose. Support tickets carry customer data, so the answer usually turns on where that data is allowed to live, not on latency or cost.

</details>

## 7. References and Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, both fusion strategies, and their parameters.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/): payload index types, filter-aware edges, and rebuilding an index.
- [Qdrant Cloud](https://cloud.qdrant.io/): create a free cluster before Module 5, so the capstone runs against a real server.

## What's Next: Module 5

The capstone runs the same five questions against bigger answers. Three modalities replace one: news, audio, and satellite imagery, each embedded into named vectors on shared points. Those signals get clustered into risk themes, and the queries cross languages, so an English question retrieves Japanese and Chinese sources.
