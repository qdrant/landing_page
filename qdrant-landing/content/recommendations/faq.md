---
title: FAQs
questions:
  - id: 0
    question: How does the recommendation system work?
    answer: The recommendation API is exposed via the Query API as the Recommend Query.
  - id: 1
    question: Which recommendation strategy should we use?
    answer: Each of them has its own strengths and weaknesses, so experiment and choose the one that works best for your case.
  - id: 2
    question: Do you support recommendation with only negative examples, for things like data exploration or outlier detection?
    answer: A beneficial side-effect of bestscore strategy is that you can use it with only negative examples.
  - id: 3
    question: How does multitenancy work with recommendations? Can user and item embeddings live in separate collections?
    answer: Where user and item embeddings, although having the same vector parameters (distance type and dimensionality), are usually stored in different collections.
  - id: 4
    question: How do we measure or tune recommendation quality?
    answer: 'In the paper this boosted the nDCG@20 performance by 5.6% points when using 2-8 positive feedback documents.'
sitemapExclude: true
---
