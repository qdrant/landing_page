---
title: "The Two Families of Search"
short_description: "Module 3 of the Beginner Course: dense and sparse retrieval, and what each one misses."
description: "Compare the two families every retrieval system is built from: dense vectors that find what a query means, and sparse vectors that find what it says."
weight: 2
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# The Two Families of Search

Every retrieval system is built from one or both of these.

### Dense Search

![Two similar phrases encoded as dense vectors, landing near each other.](/courses/beginners/module-3/dense-search.png)

A dense vector has a small, fixed number of dimensions, 384 for the model used here, and every one of them holds a value. Two texts with similar meaning land close together whether or not they share any words:

```python
cosine("car repair",    "automobile maintenance")   # 0.7334
cosine("cheap flights", "affordable airfare")       # 0.7241
cosine("cheap flights", "bake a cake")              # 0.2047
```

Read the gap, not the absolute number: what makes 0.73 meaningful is the distance from the 0.20, not the value on its own.

### Sparse Search

![A sparse vector with five weighted tokens and many empty dimensions.](/courses/beginners/module-3/sparse-search.png)

Sparse vectors are token-based: each dimension corresponds to a token, only the tokens present carry a weight, and everything else is zero. Storing that mostly-zero row would be wasteful, so a sparse vector is two parallel arrays, the `indices` of the non-zero dimensions and the `values` at those positions:

```python
# BM25 vector for "Nike Pegasus 40 running shoes"
indices = [1974139272, 24614856, 1784631546, 243905464, 303109060]
values  = [1.67, 1.67, 1.67, 1.67, 1.67]
```

Five tokens, five weights, nothing else stored. The indices are hashes of each token rather than positions in a word list, which is why they are large. The values are uniform because BM25 produces only half the score, the part counting how often a token appears. Qdrant computes the other half at query time.

Sparse retrieval does not match characters, which is a common assumption. BM25 first splits text into tokens and cuts each token back to its root (stemming), so `SKU-48291` and `SKU-48292` still share the token `sku`.

What it gives you is that `40` and `41` are *different tokens* with no relationship at all, where dense placed them 0.0087 apart. The distinguishing token gets its own dimension instead of being averaged away.

Sparse similarity in Qdrant is always the dot product, with no metric to choose, unlike the dense side where you pick Cosine, Dot, or Euclidean.

#### Sparse Models

This module uses BM25, a statistical scoring method that requires no training. It scores the terms already present in the text.

Two trained models extend BM25:

- **SPLADE** expands the text with related terms, allowing a document to match a query even when they share none of the same words.
- **miniCOIL** keeps the original terms but weights them based on their surrounding context. We recommend it for new projects.

Switching between these models requires only a one-line change. Start with BM25, then read [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/) or [miniCOIL](/articles/minicoil/) when you need more.

#### Indexing Sparse Vectors

Because most dimensions are zero, Qdrant stores sparse vectors in an inverted index: rather than a row per point, it keeps one list per token recording which points contain that token and its weight.

```text
Token "nike"    → list: [point_1, point_2, point_4, ...]
Token "pegasus" → list: [point_1, point_2, point_3, ...]
```

A query reads only the lists for the tokens it contains, summing weights as it goes, so it scores just the points that share at least one token with the query. HNSW from Module 2 is approximate, trading a little accuracy for speed. The sparse index scores every candidate those lists hold, so its ranking is exact.

### Dense and Sparse, Side by Side

Module 1 covered the strengths of dense vectors, and those strengths apply here too. Dense vectors handle synonyms, paraphrases, and intent well, but they can miss cases where one exact token carries the meaning, such as a serial number, rare term, or invented product name.

Sparse vectors make the opposite tradeoff. They work well for exact tokens and domain-specific terms, but they cannot recognize reworded content when the query and document share no words.

One caveat is cross-language retrieval. The model used here, `sentence-transformers/all-MiniLM-L6-v2`, supports English only. For cross-language retrieval, use a multilingual embedding model.

Dense finds what a query means. Sparse finds what it says. Most real catalogs carry both, a name a shopper paraphrases and a model number they type exactly, which is what [Hybrid Search: Dense and Sparse](/course/beginners/module-3/hybrid-search/) builds.
