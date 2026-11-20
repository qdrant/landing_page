---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free cluster has one node with 1 GB of RAM and needs no credit card.
  - id: 1
    question: Will this work with hybrid search, combining keyword and semantic results in one query?
    answer: A text query can also be used as a prefetch, for example, to combine BM25 with dense vector search in hybrid search.
  - id: 2
    question: How does BM25 scoring work, and can we tune it?
    answer: 'Term frequency (TF): the more often a term appears in a document, the more relevant that document is likely to be.'
  - id: 3
    question: If our text field is an array of objects, like reviews, does BM25 score each element separately or treat the whole array as one document?
    answer: When the elements are independent texts, such as reviews or passages of a long document, you may want to score each element as its own document instead.
sitemapExclude: true
---
