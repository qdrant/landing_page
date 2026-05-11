---
title: Multi-Representation Search
weight: 11
aliases:
  - /documentation/tutorials/multi-representation-search/
---

# Multi-Representation Search Across Titles, Summaries, and Chunks

| Time: 45 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb) |
| --- | ----------- | ----------- | ----------- |

A document is rarely well-represented by a single embedding. A paper has a title, an abstract, body chunks, and category tags, each carrying a different signal. Treat all four as one dense vector and the title gets averaged out, keyword matches on tags disappear, and chunk-level grounding for downstream reasoning is gone.

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

You'll work with 20 000 arXiv papers from the [`gfissore/arxiv-abstracts-2021`](https://huggingface.co/datasets/gfissore/arxiv-abstracts-2021) Hugging Face dataset, filtered to ML/CS categories and to papers from 2018 onward, since earlier ML papers predate most of the topics queries care about. Each paper has a title, an abstract, and category tags, which gives you four natural representations once the abstract is split into chunks: title, full abstract as a summary, abstract sentences as chunks, and categories as tags.

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

Design the collection before writing any queries. The point granularity is the chunk: every chunk of every paper becomes one point. Title and summary embeddings are stored on every chunk so the Query API can fuse across them in a single request without an extra lookup.

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
        "dense_summary": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse_keywords": models.SparseVectorParams(
            modifier=models.Modifier.IDF,
        ),
    },
)
```

Each vector covers a different signal:

- `dense_chunk`: the content workhorse. Chunks are short enough that a single embedding represents them faithfully.
- `dense_title`: a few tokens that name the topic. A title hit is a strong signal even when no chunk matches.
- `dense_summary`: between title and chunk in length and specificity. Catches queries about the contribution rather than a passage.
- `sparse_keywords`: BM25 over title and tags concatenated. BM25 pays off on short structured fields where exact lexical matches matter.

Title and summary vectors are duplicated across every chunk of the same document. That trades storage for query simplicity: one collection, one Query API call, no `lookup_from`. If your titles or summaries are heavy, or you have millions of chunks per document, store them in a separate collection and reach them with `lookup_from`. For the typical case (a few dozen chunks per document, embeddings under a kilobyte each), inline storage is the simpler choice.

Ingestion produces one point per chunk and reuses the title and summary embeddings.

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

    # Title, summary, and sparse docs are reused across every chunk of this paper; only the chunk text varies.
    # Cloud Inference embeds each Document on the server, so you don't need a client-side embedding library.
    title_doc   = models.Document(text=paper["title"],    model=DENSE_MODEL)
    summary_doc = models.Document(text=paper["abstract"], model=DENSE_MODEL)
    sparse_doc  = models.Document(
        text=paper["title"] + " " + " ".join(paper["categories"]),
        model=BM25_MODEL,
    )

    for i, chunk in enumerate(chunks):
        points.append(models.PointStruct(
            id=len(points),
            vector={
                "dense_chunk":     models.Document(text=chunk, model=DENSE_MODEL),
                "dense_title":     title_doc,
                "dense_summary":   summary_doc,
                "sparse_keywords": sparse_doc,
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

After the upload completes, opening any point in the Qdrant Cloud UI shows all four named vectors attached to one chunk. `dense_chunk` carries the chunk's own embedding, while `dense_title`, `dense_summary`, and `sparse_keywords` are the same across every chunk of this paper.

![A point in the arxiv_multi_repr collection showing all four named vectors](/documentation/tutorials/multi-representation-search/point.png)

A fixed-length sentence chunker is used here for clarity. Chunking strategy is its own design space; see the limitations section at the end for pointers.

## Retrieval

The recommended pipeline fuses three prefetches with Reciprocal Rank Fusion and groups the results by document. One Query API call covers everything except boosting:

```python
def retrieve(query, limit=10, group_size=3):
    dense_query  = models.Document(text=query, model=DENSE_MODEL)
    sparse_query = models.Document(text=query, model=BM25_MODEL)
    return client.query_points_groups(
        collection_name="arxiv_multi_repr",
        prefetch=[
            models.Prefetch(query=dense_query,  using="dense_chunk",     limit=100),
            models.Prefetch(query=dense_query,  using="dense_title",     limit=100),
            models.Prefetch(query=sparse_query, using="sparse_keywords", limit=100),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
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
- `sparse_keywords` carries lexical hits on title and tags that the dense embedding has averaged out: rare entity names, jargon, controlled-vocabulary tags.

Adding `dense_summary` as a fourth prefetch is worth it only if summaries surface what chunks don't. If summaries paraphrase the chunks, the extra prefetch adds latency without lift.

### How to Fuse

[Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) works on rank, not score, so it sidesteps the calibration problem entirely: dense scores live in [0, 1], sparse BM25 scores don't, and RRF doesn't have to reconcile the two. The prefetches return overlapping but not identical candidate sets, and RRF rewards documents the paths agree on.

Tuning linear weights between dense and sparse scores instead of using RRF is fragile: the right weight depends on query length, model, and corpus, and a weight that helps one query class hurts another. The full argument is in [Hybrid Search Revamped](/articles/hybrid-search/). Stick with RRF unless you have a reason and a holdout set to validate the alternative.

### When to Group, When Not To

`query_points_groups` collapses chunks back to documents while keeping the top chunks per document attached. Each group's `hits` field carries the top-`group_size` chunks for that paper, ranked by their fused score.

Grouping helps when the consumer wants documents: a results UI, a citation list, an LLM that wants document-level attribution. It hurts when an LLM benefits from seeing several independently ranked chunks across multiple documents in its context window. Collapsing those chunks into one group per document throws away ordering information the LLM could have used.

Grouping is a presentation choice, not a relevance technique. The candidates and their fused scores don't change; only the result shape does.

Two operational notes:

- Increase prefetch `limit` when grouping. If a paper has three chunks worth retrieving but the prefetch only returned two, grouping doesn't have the third to consider.
- Use the `with_lookup` parameter when document-level metadata (full title, authors, publication date) lives in a separate collection. It fetches one record per group instead of repeating it per chunk.

### When to Boost, When to Rerank

The Query API's [score boosting](/documentation/search/search-relevance/#score-boosting) lets you express ranking preferences that aren't captured by similarity alone. Swap the `FusionQuery` for a `FormulaQuery` and use the prefetch scores as variables:

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

`$score[i]` references the score from prefetch `i`, so order in the `prefetch=` list is load-bearing. The `defaults` map covers candidates that appeared in one prefetch but not another: without it, a missing variable would error. The formula above sums the chunk score with a half-weighted title score and a smaller sparse contribution. Unlike RRF, this is a linear combination of raw scores and is fragile across query types unless you've held the weights up against representative queries.

Use the formula API when the preference is structured and known up front: recency, source authority, geographic proximity, content type. For time-based decay on a `published_at` payload field, swap the title term for an `exp_decay` expression from the [decay functions](/documentation/search/search-relevance/#decay-functions) reference.

Use a reranker when the preference is "this is more relevant than that" but you can't easily express why in a closed form. Formulas are cheap and deterministic; rerankers are expensive but learn what you can't articulate.

---

For the step-by-step build-up that produced this design (dense baseline, plus sparse, plus title prefetch, plus grouping, plus boosting) with eval numbers showing the lift at each step, see the [accompanying notebook](https://github.com/qdrant/examples/blob/master/multi-representation-search/multi-representation-search.ipynb). For a complementary view that varies the *query* across three representations against a single document representation, see the [Universal Query for Hybrid Retrieval demo](/course/essentials/day-5/universal-query-demo/). This tutorial is the document-side equivalent: multiple document representations against a single query.

## Where This Pattern Doesn't Fit

Multi-representation retrieval pays off when items are long and structured. It's overkill, and sometimes worse than a single dense vector, when items are short and homogeneous. Tweets, product names, and one-line forum titles don't have a meaningful title-versus-summary-versus-body distinction; splitting them into representations adds query latency without adding signal. For those cases, a single well-chosen dense model and a sparse fallback are usually enough.

The pattern also assumes you can identify the representations cleanly. If your corpus has inconsistent metadata (some documents have summaries, others don't), the missing-representation case becomes its own design problem: empty vectors, fallback strategies, or a separate index per representation availability.

## Open Ends

**Chunking strategy.** This tutorial uses a fixed-length sentence chunker for clarity. The chunking choice has a measurable effect on retrieval quality, and the right strategy depends on document structure. Worth considering for your corpus: hierarchical chunking ([POMA-AI VST](https://arxiv.org/abs/2406.04590)), late chunking ([Jina](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)), and semantic chunking ([Chonkie](https://github.com/chonkie-ai/chonkie)).

**BM25F.** The technically correct extension of BM25 to multi-field text of varying length is BM25F, which weights term statistics per field. Qdrant doesn't support BM25F natively today. The workaround used in step 3, separate sparse vectors per field fused via the Query API, gives you most of the practical benefit. Default BM25 parameters (k1, b) are calibrated for document-length text and may need recalibration for short fields like titles or tags; treat them as tunable hyperparameters when working with mixed-length sparse representations.

## Wrapping Up

Multi-representation retrieval is a schema decision, not a model decision. Once each representation has its own named vector, the Query API composes them at query time: prefetch per representation, fuse with RRF, group by document for presentation, and apply a formula for ranking preferences. Each step in the walkthrough targets a specific retrieval failure mode the previous step left on the table.

Related reading:

- [Hybrid Search Revamped](/articles/hybrid-search/) for the why behind RRF over linear weighting.
- [Hybrid Queries reference](/documentation/search/hybrid-queries/) for the full Query API surface, including grouping and `lookup_from`.
- [Search Relevance reference](/documentation/search/search-relevance/) for the formula and decay function syntax used in step 5.
