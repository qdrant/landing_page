---
title: "Evaluating Search Pipelines"
description: Learn how to evaluate different search configurations in terms of cost, latency, and retrieval quality using ground truth datasets and standardized metrics.
weight: 6
---

{{< date >}} Module 3 {{< /date >}}

# Evaluating Search Pipelines

Throughout this module, you've learned many optimization techniques: quantization to reduce memory, pooling to compress representations, MUVERA for efficient indexing, and multi-stage retrieval to balance speed with accuracy. But how do you know which combination is right for *your* data?

The answer lies in systematic evaluation across three dimensions: **cost** (memory and compute resources), **latency** (query response time), and **quality** (retrieval accuracy). Cost and latency are straightforward to measure - you can observe memory usage and time queries directly. Quality, however, requires a more principled approach: you need to measure whether your system returns the *right* documents.

> **Note:** This lesson demonstrates evaluation methodology on a **small, comprehensible dataset** that you can manually inspect and understand. We use 4 document images with 8 queries where you can verify relevance judgments yourself. Real production benchmarks would use larger datasets like ViDoRe, but the methodology remains the same.

---

<div class="video">
<iframe
  src="https://www.youtube.com/embed/xK9mV7zR4pL"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-3/evaluating-pipelines.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## Quick Reference: Evaluation Metrics

Before diving in, here's the essential guide to choosing metrics. For multi-stage pipelines, focus on **Recall@k for the prefetch stage** (did we capture candidates?) and **NDCG@k for the final ranking** (did we order them correctly?).

| Metric          | When to Use                | Key Insight                                  |
|-----------------|----------------------------|----------------------------------------------|
| **Recall@k**    | Prefetch stage (k=50, 100) | Did we capture relevant candidates?          |
| **NDCG@k**      | Final ranking (k=5, 10)    | Are most relevant results ranked highest?    |
| **MRR**         | Single-answer retrieval    | How quickly do we find THE right answer?     |
| **Precision@k** | Result page quality        | What fraction of shown results are relevant? |

## Ground Truth: Defining "Correct" Retrieval

To measure retrieval quality, you need **relevance judgments** (called **qrels**) - data that defines which documents are relevant for which queries.

### What Are Qrels?

Each qrel is a triplet: a query, a document, and a relevance score indicating how relevant that document is to the query.

```python
# Ground truth: which documents are relevant to which queries?
qrels_dict = {
    "company quarterly financial results and revenue": {
        "images/financial-report.png": 3,  # Highly relevant
    },
    "historic ship disaster at sea": {
        "images/titanic-newspaper.jpg": 3,  # Highly relevant
    },
    "news headline from early 1900s": {
        "images/titanic-newspaper.jpg": 3,  # Highly relevant
        "images/einstein-newspaper.jpg": 2,  # Somewhat relevant
    },
}
```

Relevance can be **binary** (0 = not relevant, 1 = relevant) or **graded** (0-3 scale where higher means more relevant). Graded relevance provides more nuance for ranking evaluation.

### Building Ground Truth

Three practical approaches:

1. **Manual Annotation** - Have domain experts review query-document pairs. Highest quality but time-intensive. Even 50-100 queries provides valuable signal.

2. **Synthetic Generation with LLMs** - Use language models to generate relevant queries for documents. Scales well but may not capture real user query patterns.

3. **Existing Benchmarks** - For visual document retrieval, **ViDoRe** provides standardized evaluation. For text retrieval, **BEIR** offers diverse domains.

For this lesson, we'll use a small manually-annotated dataset where you can inspect the relevance judgments yourself.

## The Degrees of Freedom Problem

With so many optimization techniques, the configuration space explodes quickly:

| Dimension        | Options                                                             |
|------------------|---------------------------------------------------------------------|
| **Quantization** | None, Scalar (int8), Binary (1-bit, 1.5-bit, 2-bit), Product        |
| **Pooling**      | None, Hierarchical (k=16, 32, 64, ...)                              |
| **MUVERA**       | Disabled, or Enabled (differenr k_sim, dim_proj, r_reps variations) |
| **Multi-stage**  | Single-stage, Two-stage (prefetch: 50, 100, 500, ...)               |

Just considering these options yields hundreds of possible configurations. The key insight: **you don't need to test them all**. Instead, you need a systematic approach to test *representative* configurations efficiently.

## Unified Collection Architecture

The traditional approach creates a separate collection for each configuration - tedious and storage-intensive. A better approach: **store all vector representations in a single collection** using named vectors.

### Four Named Vectors

We'll store four different representations of each document:

```python
from qdrant_client import QdrantClient, models
from qdrant_client.models import (
    VectorParams, Distance, MultiVectorConfig, MultiVectorComparator,
    ScalarQuantization, ScalarQuantizationConfig, ScalarType,
)

client = QdrantClient(url="http://localhost:6333")

COLLECTION_NAME = "eval-multi-vector"

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config={
        # Full ColModernVBERT multi-vector (no quantization)
        "colmodernvbert": VectorParams(
            size=128,
            distance=Distance.DOT,
            multivector_config=MultiVectorConfig(
                comparator=MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),  # Disable HNSW for multi-vector
        ),
        # ColModernVBERT with scalar quantization enabled
        "colmodernvbert_sq": VectorParams(
            size=128,
            distance=Distance.DOT,
            multivector_config=MultiVectorConfig(
                comparator=MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
            quantization_config=ScalarQuantization(
                scalar=ScalarQuantizationConfig(
                    type=ScalarType.INT8,
                    quantile=0.99,
                    always_ram=True,
                )
            ),
        ),
        # MUVERA single-vector approximation for fast HNSW search
        "muvera": VectorParams(
            size=40960,  # muvera.embedding_size from k_sim=6, dim_proj=32, r_reps=20
            distance=Distance.COSINE,
        ),
        # Hierarchical pooled multi-vector (k=32 clusters)
        "hierarchical": VectorParams(
            size=128,
            distance=Distance.DOT,
            multivector_config=MultiVectorConfig(
                comparator=MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
        ),
    },
)
```

**Key insight:** The `colmodernvbert_sq` vector stores the same embeddings as `colmodernvbert` but with scalar quantization enabled. This allows direct comparison of quantized vs. non-quantized search without re-indexing.

### Embedding and Uploading Documents

A single function generates all four representations for each document:

```python
from fastembed import LateInteractionMultimodalEmbedding
from scipy.cluster.vq import kmeans2
import numpy as np
from fastembed.postprocess import Muvera

# Load the embedding model
model = LateInteractionMultimodalEmbedding(
    model_name="Qdrant/colmodernvbert"
)

# Initialize MUVERA with the same configuration as the collection
muvera = Muvera.from_multivector_model(model=model, k_sim=6, dim_proj=32, r_reps=20)


def hierarchical_pool(embeddings: np.ndarray, k: int = 32) -> np.ndarray:
    """Pool multi-vector to k centroids using k-means clustering."""
    if len(embeddings) <= k:
        return embeddings  # No pooling needed
    centroids, labels = kmeans2(embeddings.astype(np.float64), k, minit="++")
    # Return mean of embeddings in each cluster
    pooled = np.array([
        embeddings[labels == i].mean(axis=0)
        for i in range(k)
        if (labels == i).any()
    ])
    return pooled.astype(np.float32)


def embed_and_upload_document(doc_path: str, doc_id: int) -> None:
    """Embed a document and upload all four vector representations."""
    # Generate full multi-vector embeddings
    full_multivec = np.array(list(model.embed_image([doc_path]))[0])

    # Generate MUVERA approximation
    muvera_vec = muvera.process_document(full_multivec)

    # Generate hierarchical pooled version (k=32)
    hierarchical_vec = hierarchical_pool(full_multivec, k=32)

    # Upload all representations in one point
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            models.PointStruct(
                id=doc_id,
                payload={"filename": doc_path},
                vector={
                    "colmodernvbert": full_multivec.tolist(),
                    "colmodernvbert_sq": full_multivec.tolist(),  # Same data, quantized config
                    "muvera": muvera_vec.tolist(),
                    "hierarchical": hierarchical_vec.tolist(),
                },
            )
        ],
    )
```

### Sample Dataset

For this lesson, we use a small dataset you can manually inspect:

```python
# Small dataset of document images you can manually inspect
DOC_PATHS = [
    "images/financial-report.png",
    "images/titanic-newspaper.jpg",
    "images/men-walk-on-moon-newspaper.jpg",
    "images/einstein-newspaper.jpg",
]

# Upload all documents with all 4 vector representations
for doc_id, doc_path in enumerate(DOC_PATHS):
    embed_and_upload_document(doc_path, doc_id)
```

## Building Evaluation Pipelines

With all vectors stored in a single collection, we can build different pipelines **without re-indexing** - we simply query different named vectors.

### The Search Function

```python
def search_pipeline(
    query_embedding: np.ndarray,
    using: str,
    prefetch_using: str | None = None,
    prefetch_limit: int = 50,
    limit: int = 10,
) -> list[tuple[str, float]]:
    """
    Execute a search pipeline with optional prefetch stage.

    Args:
        query_embedding: The query's multi-vector embedding
        using: Named vector for final ranking
        prefetch_using: Named vector for prefetch (None = single-stage)
        prefetch_limit: How many candidates to retrieve in prefetch
        limit: Final number of results

    Returns:
        List of (filename, score) tuples
    """
    if prefetch_using is None:
        # Single-stage search
        response = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_embedding.tolist(),
            using=using,
            limit=limit,
        )
    else:
        # Two-stage search: prefetch with one vector, rerank with another
        # For MUVERA prefetch, we need the MUVERA query embedding
        if prefetch_using == "muvera":
            prefetch_query = muvera.process_query(query_embedding).tolist()
        else:
            prefetch_query = query_embedding.tolist()

        response = client.query_points(
            collection_name=COLLECTION_NAME,
            prefetch=[
                models.Prefetch(
                    query=prefetch_query,
                    using=prefetch_using,
                    limit=prefetch_limit,
                )
            ],
            query=query_embedding.tolist(),
            using=using,
            limit=limit,
        )

    return [
        (point.payload["filename"], point.score)
        for point in response.points
    ]
```

### Representative Pipeline Configurations

Rather than testing all combinations, we select **6 representative pipelines** that cover the key trade-offs:

```python
PIPELINES = {
    # Baseline: full quality, no optimization
    "baseline": {
        "using": "colmodernvbert",
        "prefetch_using": None,
    },

    # Scalar quantized: reduced memory, minimal quality loss
    "scalar_quantized": {
        "using": "colmodernvbert_sq",
        "prefetch_using": None,
    },

    # Hierarchical pooling: fewer vectors per document
    "hierarchical": {
        "using": "hierarchical",
        "prefetch_using": None,
    },

    # Two-stage: fast MUVERA prefetch + full quality rerank
    "muvera_rerank": {
        "using": "colmodernvbert",
        "prefetch_using": "muvera",
        "prefetch_limit": 50,
    },

    # Two-stage with quantized rerank
    "muvera_quantized": {
        "using": "colmodernvbert_sq",
        "prefetch_using": "muvera",
        "prefetch_limit": 50,
    },

    # Maximum compression: MUVERA prefetch + pooled rerank
    "muvera_hierarchical": {
        "using": "hierarchical",
        "prefetch_using": "muvera",
        "prefetch_limit": 50,
    },
}
```

**Key insight:** All six pipelines query the **same indexed data** - we just configure which named vectors to use for prefetch and final ranking.

### Running All Pipelines

```python
def evaluate_all_pipelines(
    queries: dict[str, np.ndarray],
    qrels: dict,
) -> dict[str, dict]:
    """Run all pipeline configurations and collect results."""
    from ranx import Qrels, Run, evaluate
    import time

    ranx_qrels = Qrels(qrels)
    results = {}

    for pipeline_name, config in PIPELINES.items():
        # Collect search results for all queries
        pipeline_results = {}
        latencies = []

        for query_text, query_embedding in queries.items():
            start = time.perf_counter()
            search_results = search_pipeline(query_embedding, **config)
            latencies.append((time.perf_counter() - start) * 1000)

            # Convert to ranx format: {doc_id: score}
            pipeline_results[query_text] = {
                filename: score for filename, score in search_results
            }

        # Create ranx Run and evaluate
        run = Run(pipeline_results, name=pipeline_name)
        metrics = evaluate(ranx_qrels, run, ["ndcg@10", "recall@10", "mrr"])

        results[pipeline_name] = {
            "metrics": metrics,
            "avg_latency_ms": np.mean(latencies),
        }

    return results
```

## Evaluation with ranx

The **ranx** library provides battle-tested implementations of IR metrics. Here's how to compare all our pipelines:

```python
from ranx import Qrels, Run, compare
import time

# Define ground truth - which documents are relevant to which queries
qrels_dict = {
    "company quarterly financial results and revenue": {
        "images/financial-report.png": 3,  # Highly relevant
    },
    "historic ship disaster at sea": {
        "images/titanic-newspaper.jpg": 3,
    },
    "space exploration and astronauts": {
        "images/men-walk-on-moon-newspaper.jpg": 3,
    },
    "physics theory and scientist": {
        "images/einstein-newspaper.jpg": 3,
    },
    "news headline from early 1900s": {
        "images/titanic-newspaper.jpg": 3,
        "images/einstein-newspaper.jpg": 2,  # Somewhat relevant
    },
    "business earnings report": {
        "images/financial-report.png": 3,
    },
    "NASA moon landing mission": {
        "images/men-walk-on-moon-newspaper.jpg": 3,
    },
    "ocean liner sinking": {
        "images/titanic-newspaper.jpg": 3,
    },
}

qrels = Qrels(qrels_dict)

# Generate query embeddings
query_embeddings = {
    query: np.array(list(model.embed_text([query]))[0])
    for query in qrels_dict.keys()
}

# Collect runs from each pipeline
runs = []
latency_results = {}

for pipeline_name, config in PIPELINES.items():
    pipeline_results = {}
    latencies = []

    for query_text, query_embedding in query_embeddings.items():
        start = time.perf_counter()
        search_results = search_pipeline(query_embedding, **config, limit=10)
        latencies.append((time.perf_counter() - start) * 1000)

        # Convert to ranx format: {doc_id: score}
        pipeline_results[query_text] = {
            filename: score for filename, score in search_results
        }

    runs.append(Run(pipeline_results, name=pipeline_name))
    latency_results[pipeline_name] = np.mean(latencies)

# Compare all pipelines
report = compare(
    qrels=qrels,
    runs=runs,
    metrics=["ndcg@10", "recall@10", "mrr"],
    max_p=0.05,  # Statistical significance threshold
)
print(report)
```

This produces a formatted comparison table showing how each pipeline performs across all metrics, with statistical significance indicators.

## Choosing a Pipeline: Trade-off Analysis

With multiple pipelines evaluated across quality and latency, how do you choose? The concept of **Pareto optimality** helps frame the decision. A pipeline is Pareto-optimal if no other pipeline beats it in *all* dimensions simultaneously. For example, `muvera_rerank` might offer 94% of baseline quality at 4x the speed - you can't get both faster *and* higher quality without trade-offs.

When analyzing your results, plot quality (NDCG@10) against latency or memory usage. Pipelines that fall below the "frontier" of best options are **dominated** - there's always a better choice available. Focus your attention on configurations along this frontier, then choose based on your constraints: quality-first applications should stay closer to baseline, while latency-critical systems can move toward faster approximations like `muvera_hierarchical`.

In practice, multi-stage pipelines with MUVERA prefetch often provide the best balance - they leverage fast HNSW search for candidate retrieval while preserving full multi-vector quality for final ranking. Start with `muvera_rerank` as a strong default, then adjust the prefetch limit based on your recall requirements.

## Putting It All Together

Here's the complete evaluation workflow:

```python
from fastembed import LateInteractionMultimodalEmbedding
from fastembed.postprocess import Muvera
from ranx import Qrels, Run, compare
import numpy as np

# 1. Load model and initialize MUVERA
model = LateInteractionMultimodalEmbedding(
    model_name="Qdrant/colmodernvbert"
)
muvera = Muvera.from_multivector_model(model=model, k_sim=6, dim_proj=32, r_reps=20)

# 2. Create unified collection with all named vectors
# (See collection creation code above)

# 3. Embed and upload documents (generates all 4 representations)
DOC_PATHS = [
    "images/financial-report.png",
    "images/titanic-newspaper.jpg",
    "images/men-walk-on-moon-newspaper.jpg",
    "images/einstein-newspaper.jpg",
]

for doc_id, doc_path in enumerate(DOC_PATHS):
    embed_and_upload_document(doc_path, doc_id)

# 4. Define ground truth (qrels)
qrels_dict = {
    "company quarterly financial results and revenue": {
        "images/financial-report.png": 3,
    },
    "historic ship disaster at sea": {
        "images/titanic-newspaper.jpg": 3,
    },
    # ... more queries with relevance judgments
}
qrels = Qrels(qrels_dict)

# 5. Embed queries
query_embeddings = {
    query: np.array(list(model.embed_text([query]))[0])
    for query in qrels_dict.keys()
}

# 6. Evaluate all pipeline configurations and collect runs
runs = []
for pipeline_name, config in PIPELINES.items():
    pipeline_results = {}
    for query_text, query_embedding in query_embeddings.items():
        search_results = search_pipeline(query_embedding, **config, limit=10)
        pipeline_results[query_text] = {
            filename: score for filename, score in search_results
        }
    runs.append(Run(pipeline_results, name=pipeline_name))

# 7. Compare all pipelines
report = compare(
    qrels=qrels,
    runs=runs,
    metrics=["ndcg@10", "recall@10", "mrr"],
)
print(report)

# 8. Select pipeline based on requirements:
#    - Quality-first? Use baseline or muvera_rerank
#    - Latency-critical? Use muvera_hierarchical
#    - Balanced? Use muvera_quantized
```

## Summary

Evaluating multi-vector search pipelines requires:

1. **Ground truth data** (qrels) that defines what "correct" retrieval means
2. **A unified collection architecture** that stores all vector representations together
3. **Representative pipeline configurations** that cover the key trade-offs
4. **Appropriate metrics** chosen for your use case (NDCG for ranking, Recall for prefetch)
5. **Trade-off analysis** using Pareto frontiers to identify optimal configurations

The key insight from this lesson: **you don't need separate collections for each configuration**. By storing multiple named vectors (full multi-vector, quantized, MUVERA, hierarchical pooled), you can evaluate many pipeline configurations efficiently without re-indexing.

---

## Course Conclusion

Congratulations on completing the Multi-Vector Search course!

You've journeyed from the foundations of late interaction and MaxSim distance, through multi-modal applications with ColPali, to production optimization techniques. You now have the knowledge to:

- **Understand** why multi-vector representations capture richer semantic relationships
- **Implement** multi-vector search with Qdrant's native support
- **Apply** these techniques to visual document retrieval using ColPali models
- **Optimize** for production with quantization, pooling, MUVERA, and multi-stage retrieval
- **Evaluate** different configurations to find the right trade-offs for your use case

Multi-vector search is a powerful paradigm that's particularly well-suited for complex retrieval tasks where single-vector representations fall short. As you apply these techniques to your own projects, remember that the best configuration depends on your specific data, queries, and constraints. Use the evaluation framework from this lesson to make data-driven decisions.

We encourage you to experiment with your own datasets, try different model variants, and share what you learn with the community. The field of multi-vector search is evolving rapidly, and practical insights from real-world applications are invaluable.

Happy searching!
