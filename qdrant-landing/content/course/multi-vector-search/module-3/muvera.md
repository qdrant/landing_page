---
title: "MUVERA"
description: Understand MUVERA and how it enables HNSW indexing for multi-vector search despite MaxSim asymmetry.
weight: 4
---

{{< date >}} Module 3 {{< /date >}}

# MUVERA

MUVERA (Multi-Vector Retrieval with Approximation) solves a fundamental problem: MaxSim's asymmetry makes traditional indexing methods like HNSW ineffective. MUVERA enables fast approximate search for multi-vector representations.

Understanding MUVERA is key to scaling multi-vector search to millions of documents.

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

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-3/muvera.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## The HNSW Incompatibility Problem

Traditional vector indexes like HNSW are designed for single-vector search with symmetric distance metrics. Multi-vector representations break this assumption: **MaxSim is inherently asymmetric and non-metric**.

When comparing query tokens to document tokens, the direction matters - searching documents with a query gives different results than searching queries with a document. This asymmetry makes HNSW's graph-based navigation ineffective, forcing us back to full scans across millions of documents.

## MUVERA: Making Multi-Vector Search Fast

MUVERA (Multi-Vector Retrieval Algorithm) solves this incompatibility by creating a **single approximation vector** for each document that HNSW can efficiently index. The algorithm works in three stages:

1. **SimHash Clustering**: Groups token vectors into spatial regions using random hyperplanes
2. **Fixed Dimensional Encoding (FDE)**: Aggregates clustered vectors into a single representative vector per document
3. **Dimensionality Reduction**: Applies random projection to create compact, robust representations

![MUVERA high-level](/courses/multi-vector-search/module-3/muvera-high-level.png)

The resulting single vector approximates the multi-vector representation well enough for fast retrieval, achieving massive speedup. A reranking step with the original multi-vector data then aims to recover full accuracy.

For a deep dive into MUVERA's architecture and mathematical foundations, see our detailed article: [MUVERA: Multi-Vector Retrieval Made Fast](/articles/muvera-embeddings/).

## Applying MUVERA Multi-Stage Retrieval

FastEmbed provides built-in support for MUVERA postprocessing, making it straightforward to implement this optimization. Let's see how to apply MUVERA to multi-vector embeddings for fast retrieval with multi-stage reranking.

### Setting Up MUVERA with ColModernVBERT

FastEmbed 0.7.2+ includes MUVERA as a postprocessing technique that transforms variable-length multi-vector sequences into fixed-dimensional single vectors. You can apply MUVERA to any late interaction model, including **ColModernVBERT**.

The workflow involves loading a multi-vector embedding model and wrapping it with a MUVERA processor:

```python
# TODO: implement the code snippet
# Load ColModernVBERT model
# Wrap with MUVERA processor (k_sim, dim_proj, r_reps parameters)
# Configure for both MUVERA and original multi-vector embeddings
```

The MUVERA processor accepts several key parameters that control the speed-accuracy tradeoff:

- **`k_sim`**: Number of similarity buckets for SimHash clustering (more buckets = higher precision)
- **`dim_proj`**: Target dimensionality for the projection (lower = faster search, higher = better accuracy)
- **`r_reps`**: Number of random projections for robust encoding (higher = more stable representations)

### Indexing Both Representations

For multi-stage retrieval to work, you need to index **both** the MUVERA approximation vectors and the original multi-vector representations in Qdrant. The MUVERA vectors enable fast HNSW retrieval, while the multi-vector representations provide accurate reranking:

```python
# TODO: implement the code snippet
# Embed documents with MUVERA processor
# Upload MUVERA and original vectors to one collection
```

The dual-vector approach stores:
1. **MUVERA embeddings**: Single vector per document, fast HNSW retrieval
2. **Multi-vector representation**: Full token sequences per document, precise MaxSim scoring

![MUVERA search](/courses/multi-vector-search/module-3/muvera-search.png)

### Querying with Multi-Stage Retrieval

At query time, you first retrieve candidates using the fast MUVERA vectors, then rescore those candidates using the original multi-vector representations. This hybrid approach maintains search quality while dramatically reducing compute requirements:

```python
# TODO: implement the code snippet
# 1. Fast retrieval: Query MUVERA with HNSW (e.g., top 100 candidates)
# 2. Precise reranking: Rescore candidates using multi-vector MaxSim (e.g., return top 10)
```

This two-stage process achieves near-identical accuracy to full multi-vector search across all documents, but only computes expensive MaxSim operations for a small candidate set.

For complete implementation details and parameter tuning guidance, see the [FastEmbed Postprocessing documentation](/documentation/fastembed/fastembed-postprocessing/).

### Trade-offs and Considerations

**Storage Requirements**: MUVERA requires storing both representations - the single approximation vector and the full multi-vector sequence. This doubles storage compared to single-vector search, but remains practical for production systems.

**Speed Gains**: The performance improvement is substantial. Instead of computing MaxSim against millions of documents, you only compute it for your candidate set (typically 100-1000 documents). The MUVERA-powered HNSW retrieval scales logarithmically, making multi-vector search viable at scale.

**Accuracy Preservation**: Research shows MUVERA maintains nearly the same accuracy as full multi-vector search when properly configured. The key is choosing appropriate parameter values based on your dataset and quality requirements.

## What's Next

You've learned why MaxSim's asymmetry prevents HNSW from efficiently indexing multi-vector representations, and how MUVERA solves this with single-vector approximations. By combining MUVERA's fast retrieval with multi-vector reranking, you can achieve significant speedups while maintaining search quality.

Now that you have multiple optimization techniques - quantization, pooling, and MUVERA - how do you choose between them? Let's learn how to evaluate and compare different search pipeline configurations.