---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: Do I need to normalize vectors for cosine similarity?
    answer: Qdrant normalizes vectors when you add them to a collection configured for cosine distance, so you send raw embeddings and the engine handles the rest.
  - id: 2
    question: How accurate is approximate nearest neighbor search?
    answer: 'Recall is a setting, measured against a full scan. Raise hnsw_ef for higher recall, or set exact: true on a query to get exact results and see the difference on your data.'
  - id: 3
    question: Can I filter a vector similarity search engine by metadata?
    answer: Yes. Store a JSON payload with each vector, index the fields you filter on, and Qdrant applies the filter during the graph search so the nearest results are the ones that match.
sitemapExclude: true
---
