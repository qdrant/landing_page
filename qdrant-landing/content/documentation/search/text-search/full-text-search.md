---
title: Full-Text Search
short_description: "Perform ranked full-text search in Qdrant using BM25."
description: "Rank text payloads in Qdrant by relevance to a query using BM25."
weight: 2
---

# Full-Text Search

Full-text search is similar to full-text filtering, with the key difference being that full-text queries are used for ranking. For each document that matches the search terms, Qdrant calculates a relevance score based on how well the document matches the search terms. That score is used to rank the results.

## BM25

BM25 (Best Matching 25) is a popular ranking algorithm that takes a probabilistic approach to score calculation. For each search term, BM25 considers several statistics about the term and the document to calculate a relevance score:
- Term frequency (TF): the more often a term appears in a document, the more relevant that document is likely to be.
- Inverse document frequency (IDF): the rarer a term is across all documents, the higher the weight of that term.
- Document length: a term appearing in a shorter document is more relevant than the same term appearing in a longer document.

To run BM25 on sparse vectors, see [Sparse Vector Search](/documentation/search/text-search/sparse-vector-search/#bm25). For learned sparse models like SPLADE++ and miniCOIL, see [Sparse Vector Search](/documentation/search/text-search/sparse-vector-search/).
