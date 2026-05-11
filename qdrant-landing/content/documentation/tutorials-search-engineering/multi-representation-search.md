---
title: Multi-Representation Search
weight: 11
aliases:
  - /documentation/tutorials/multi-representation-search/
---

# Multi-Representation Search Across Titles, Abstracts, and Chunks

| Time: 45 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb) |
| --- | ----------- | ----------- | ----------- |

A document is rarely well-represented by a single embedding. A paper has a title, an abstract, body chunks, and category tags, each carrying a different signal. Treat all four as one dense vector and the title gets averaged out, and chunk-level grounding for downstream reasoning is gone.

This tutorial builds retrieval that uses each representation deliberately: named vectors per representation, fused via the Query API, grouped back to the document level for presentation, with score boosting for ranking preferences. Each step targets a specific retrieval failure mode you'd hit in production.

This tutorial assumes you've built hybrid (dense plus sparse) search before, that you're comfortable with [named vectors](/documentation/manage-data/vectors/#named-vectors), the [Query API](/documentation/search/hybrid-queries/), Reciprocal Rank Fusion (RRF), and Best Matching 25 (BM25). If hybrid search is new, start with the [hybrid search section of the Text Search guide](/documentation/search/text-search/#combining-semantic-and-lexical-search-with-hybrid-search) first.

## Setup

Install the Python packages used throughout the tutorial:

```bash
pip install qdrant-client datasets
```

<aside role="status">
This tutorial uses <a href="/documentation/inference/#qdrant-cloud-inference">Qdrant Cloud Inference</a> to generate embeddings server-side. The free tier covers this tutorial's footprint. Core BM25 runs on any Qdrant instance, but dense Cloud Inference is Cloud-only. To self-host, generate dense vectors on the client with a library like <a href="/documentation/fastembed/">FastEmbed</a> and pass them as raw vectors instead of <code>models.Document</code>.
</aside>

## Dataset

You'll work with 20 000 arXiv papers from the [`gfissore/arxiv-abstracts-2021`](https://huggingface.co/datasets/gfissore/arxiv-abstracts-2021) Hugging Face dataset, filtered to ML/CS categories and to papers from 2018 onward, since earlier ML papers predate most of the topics queries care about. Each paper has a title, an abstract, and category tags, which gives you three natural text representations once the abstract is split into chunks (title, full abstract, abstract sentences as chunks), plus categories as filterable metadata.

arXiv abstracts are short enough to fit any dense embedding model's context window, so chunking isn't strictly required for this dataset. We chunk here because the same pipeline shape (chunk-level retrieval, document-level grouping) is what you'd use on full paper bodies in production, where context limits force the issue. The abstract stands in for what would be a longer body field in your own corpus. We use a fixed-length sentence chunker for simplicity; the right chunking strategy depends on your document structure.

```python
from datasets import load_dataset

ML_CATEGORIES = {"cs.LG", "cs.CV", "cs.CL", "cs.AI", "stat.ML"}

# Non-streaming so HF caches the parquet locally; first run downloads ~2.5 GB, re-runs are instant.
dataset = load_dataset("gfissore/arxiv-abstracts-2021", split="train")

papers = []
# IDs are roughly chronological; iterate from the end to land on 2021/2020/2019 papers first.
for i in range(len(dataset) - 1, -1, -1):
    if len(papers) >= 20000:
        break
    row = dataset[i]
    if not row["abstract"] or not row["title"]:
        continue
    # categories arrive as space-joined strings (e.g. ["cs.LG cs.CV"]); split each entry.
    cats = [tok for entry in row["categories"] for tok in entry.split()]
    if not any(c in ML_CATEGORIES for c in cats):
        continue
    # Year lives in the YYMM prefix of new-format arXiv IDs ("2104.01234" -> 2021).
    arxiv_id = row["id"]
    if "/" in arxiv_id or "." not in arxiv_id:
        continue  # skip pre-2007 IDs like "math/0506001"
    if 2000 + int(arxiv_id[:2]) < 2018:
        continue
    papers.append({
        "arxiv_id": arxiv_id,
        "title": row["title"].strip(),
        "abstract": row["abstract"].strip(),
        "categories": cats,
    })
```

## Collection Schema

Design the collection before writing any queries. The point granularity is the chunk: every chunk of every paper becomes one point. Title and abstract embeddings are stored on every chunk so the Query API can fuse across them in a single request without an extra lookup.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

# 384 is the output dimension of sentence-transformers/all-minilm-l6-v2, used below for every dense vector.
client.create_collection(
    collection_name="arxiv_multi_repr",
    vectors_config={
        "dense_chunk":   models.VectorParams(size=384, distance=models.Distance.COSINE),
        "dense_title":   models.VectorParams(size=384, distance=models.Distance.COSINE),
        "dense_abstract": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse_title": models.SparseVectorParams(
            modifier=models.Modifier.IDF,
        ),
    },
)

# Index the 'tags' payload as keyword so we can filter on category at query time.
client.create_payload_index(
    collection_name="arxiv_multi_repr",
    field_name="tags",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

Each vector covers a different signal:

- `dense_chunk`: the content workhorse. Chunks are short enough that a single embedding represents them faithfully.
- `dense_title`: a few tokens that name the topic. A title hit is a strong signal even when no chunk matches.
- `dense_abstract`: between title and chunk in length and specificity. Catches queries about the contribution rather than a single passage.
- `sparse_title`: BM25 over the title. Catches exact lexical matches (rare entity names, jargon) that the dense embedding averages out.

Categories live in the `tags` payload with a keyword index, so queries can pre-filter by category.

Title and abstract vectors are duplicated across every chunk of the same document. That trades storage for query simplicity: one collection, one Query API call, every representation reachable from any point. For the typical case (a few dozen chunks per document, embeddings under a kilobyte each), inline storage is the simpler choice. To split heavy document-level payload into a separate collection and pull it back at grouping time, see [Lookup in groups](/documentation/search/search/#lookup-in-groups).

Ingestion produces one point per chunk and reuses the title and abstract embeddings.

```python
DENSE_MODEL = "sentence-transformers/all-minilm-l6-v2"
BM25_MODEL = "qdrant/bm25"

def chunk_sentences(text, target_len=2):
    """Split text into ~2-sentence chunks; fall back to the full text if it doesn't split cleanly."""
    sentences = [s.strip() for s in text.split(". ") if s.strip()]
    return [". ".join(sentences[i:i + target_len])
            for i in range(0, len(sentences), target_len)] or [text]

points = []
for paper in papers:
    chunks = chunk_sentences(paper["abstract"])

    # Title, abstract, and sparse docs are reused across every chunk of this paper; only the chunk text varies.
    # Cloud Inference embeds each Document on the server, so you don't need a client-side embedding library.
    title_doc   = models.Document(text=paper["title"],    model=DENSE_MODEL)
    abstract_doc = models.Document(text=paper["abstract"], model=DENSE_MODEL)
    # avg_len is the average word count of the indexed text.
    # Default is 256 (document-length); setting it to the actual field length (~10 here) improves BM25 scoring accuracy.
    sparse_doc  = models.Document(
        text=paper["title"],
        model=BM25_MODEL,
        options={"avg_len": 10.0},
    )

    for i, chunk in enumerate(chunks):
        points.append(models.PointStruct(
            id=len(points),
            vector={
                "dense_chunk":     models.Document(text=chunk, model=DENSE_MODEL),
                "dense_title":     title_doc,
                "dense_abstract":   abstract_doc,
                "sparse_title": sparse_doc,
            },
            payload={
                "document_id": paper["arxiv_id"],
                "title":       paper["title"],
                "tags":        paper["categories"],
                "chunk_index": i,
                "chunk_text":  chunk,
            },
        ))

client.upload_points(collection_name="arxiv_multi_repr", points=points, batch_size=64)
```

After the upload completes, opening any point in the Qdrant Cloud UI shows all four named vectors attached to one chunk. `dense_chunk` carries the chunk's own embedding, while `dense_title`, `dense_abstract`, and `sparse_title` are the same across every chunk of this paper.

![A point in the arxiv_multi_repr collection showing all four named vectors](/documentation/tutorials/multi-representation-search/point.png)

## Retrieval

The recommended pipeline fuses three prefetches with Reciprocal Rank Fusion and groups the results by document. One Query API call covers retrieval, fusion, and grouping:

```python
def retrieve(query, limit=10, group_size=3, tags=None):
    dense_query  = models.Document(text=query, model=DENSE_MODEL)
    sparse_query = models.Document(text=query, model=BM25_MODEL)
    # Optional category filter. When tags is provided, Qdrant pre-filters candidates
    # to points whose 'tags' payload includes any of the given values.
    query_filter = (
        models.Filter(must=[models.FieldCondition(key="tags", match=models.MatchAny(any=tags))])
        if tags else None
    )
    return client.query_points_groups(
        collection_name="arxiv_multi_repr",
        prefetch=[
            models.Prefetch(query=dense_query,  using="dense_chunk", limit=100),
            models.Prefetch(query=dense_query,  using="dense_title", limit=100),
            models.Prefetch(query=sparse_query, using="sparse_title", limit=100),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        query_filter=query_filter,
        group_by="document_id",
        group_size=group_size,
        limit=limit,
    ).groups
```

The pipeline makes four design decisions. Each is worth understanding so you can defend or adjust it.

### What to Prefetch

A representation only earns its own prefetch if it carries signal independent of the others. The three above are deliberately complementary:

- `dense_chunk` carries the body content.
- `dense_title` carries the topical naming. For a query like "diffusion models for high-resolution image synthesis", a paper titled "High-Resolution Image Synthesis with Latent Diffusion Models" surfaces from the title prefetch even when its abstract phrases the contribution differently. The chunk prefetch alone misses it.
- `sparse_title` carries lexical hits on the title that the dense embedding averages out: rare entity names, jargon, specific model or paper names.

Adding `dense_abstract` as a fourth prefetch is worth it only if the abstract surfaces what chunks don't. If the abstract paraphrases the chunks, the extra prefetch adds latency without lift.

### Which Fusion to Use

[Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) combines prefetches using document rank rather than raw scores, avoiding issues caused by dense and sparse scores operating on different scales. It’s the default configuration for this tutorial and a reasonable place to begin. In some scenarios, the variants below may produce stronger results.

For when RRF isn't enough:

- **[Weighted RRF](/documentation/search/hybrid-queries/#weighted-rrf).** Per-prefetch weights in the rank-fusion formula. Use when one path is reliably stronger on your data; tune weights against a validation set, since a weight that helps one query class often hurts another.
- **[Distribution-Based Score Fusion (DBSF)](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf).** Normalizes each prefetch's scores into a common range before summing. Preserves score magnitude (which RRF discards) when prefetches share a model family and score distributions are stable.
- **Custom formula via `FormulaQuery`.** Full control over how scores combine:

```python
query=models.FormulaQuery(
    formula=models.SumExpression(sum=[
        "$score[0]",
        models.MultExpression(mult=[0.5, "$score[1]"]),
        models.MultExpression(mult=[0.3, "$score[2]"]),
    ]),
    defaults={"$score[1]": 0.0, "$score[2]": 0.0},
),
```

In this formula, `$score[i]` is the score from prefetch `i`, so the order of your `prefetch=` list matters. The `defaults` map provides fallback values (here `0.0`) for candidates that didn't appear in every prefetch, so the formula still evaluates.

This is a linear combination of raw scores, which breaks down when prefetches use different scoring scales (for example, dense scores in [0, 1] alongside unbounded BM25 scores). The other two fusion strategies handle this for you: RRF discards scores entirely, and DBSF normalizes each prefetch before summing. With a custom formula, you have to normalize the scores yourself, typically using [decay functions](/documentation/search/search-relevance/#decay-functions). The full FormulaQuery syntax lives in the [Score Boosting](/documentation/search/search-relevance/#score-boosting) reference.

For RRF vs. DBSF guidance, see the [hybrid-search FAQ](/documentation/faq/qdrant-fundamentals/#when-should-i-use-reciprocal-rank-fusion-rrf-vs-distribution-based-score-fusion-dbsf-for-hybrid-search).

### When to Boost, When to Rerank

Score boosting expresses ranking preferences that aren't captured by retrieval scores alone: recency, source authority, geographic proximity, content type. Use a FormulaQuery whose terms reference payload fields. For time-based decay on a `published_at` field, use an `exp_decay` expression from the [decay functions](/documentation/search/search-relevance/#decay-functions) reference.

Use a reranker when the preference is "this is more relevant than that" but you can't easily express why in a closed form. Formulas are cheap and deterministic; rerankers are expensive but learn what you can't articulate.

### When to Group, When Not To

`query_points_groups` collapses chunks back to documents while keeping the top chunks per document attached. Each group's `hits` field carries the top-`group_size` chunks for that paper, ranked by their fused score.

Grouping helps when the consumer wants documents: a results UI, a citation list, an LLM that wants document-level attribution. It hurts when an LLM benefits from seeing several independently ranked chunks across multiple documents in its context window. Collapsing those chunks into one group per document throws away ordering information the LLM could have used.

Grouping is a presentation choice, not a relevance technique. The candidates and their fused scores don't change; only the result shape does.

Two operational notes:

- Increase prefetch `limit` when grouping. If a paper has three chunks worth retrieving but the prefetch only returned two, grouping doesn't have the third to consider.
- Use the `with_lookup` parameter when document-level metadata (full title, authors, publication date) lives in a separate collection. It fetches one record per group instead of repeating it per chunk.

---

For the step-by-step build-up that produced this design (dense baseline, plus sparse, plus title prefetch, plus grouping, plus boosting) with eval numbers showing the lift at each step, see the [accompanying notebook](https://github.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb). For a complementary view that varies the *query* across three representations against a single document representation, see the [Universal Query for Hybrid Retrieval demo](/course/essentials/day-5/universal-query-demo/). This tutorial is the document-side equivalent: multiple document representations against a single query.

## Where This Pattern Doesn't Fit

Multi-representation retrieval pays off when items are long and structured. It's overkill, and sometimes worse than a single dense vector, when items are short and homogeneous. Tweets, product names, and one-line forum titles don't have a meaningful title-versus-body distinction; splitting them into representations adds query latency without adding signal. For those cases, a single well-chosen dense model and a sparse fallback are usually enough.

The pattern also assumes you can identify the representations cleanly. If your corpus has inconsistent metadata (some documents have abstracts, others don't), the missing-representation case becomes its own design problem: empty vectors, fallback strategies, or a separate index per representation availability.

## Wrapping Up

Multi-representation retrieval is a schema decision, not a model decision. Once each representation has its own named vector, the Query API composes them at query time: prefetch per representation, fuse with RRF, group by document for presentation, and apply a formula for ranking preferences.

Related reading:

- [Hybrid Search Revamped](/articles/hybrid-search/) for the why behind RRF over linear weighting.
- [Hybrid Queries reference](/documentation/search/hybrid-queries/) for the full Query API surface, including grouping.
- [Search Relevance reference](/documentation/search/search-relevance/) for the formula and decay function syntax.
