---
title: FAQs
questions:
  - id: 0
    question: What does hybrid search actually mean in Qdrant?
    answer: One of the most common problems when you have different representations of the same data is to combine the queried points for each representation into a single result.
  - id: 1
    question: How do I re-rank or combine results from multiple retrievers?
    answer: RRF considers the positions of results within each query and boosts those that appear closer to the top in multiple sets of results.
  - id: 2
    question: How should I weight the retrievers, and how do I know if my weights are right?
    answer: The most reliable way to set them is by testing on your data.
sitemapExclude: true
---
