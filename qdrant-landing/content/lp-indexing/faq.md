---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: Does Qdrant use an IVF index?
    answer: Qdrant, an open source engine written in Rust, uses HNSW as its dense vector index, so you tune one graph with m, ef_construct, and hnsw_ef, and payload indexes add filter-aware links to it.
  - id: 2
    question: When should I create payload indexes?
    answer: Before you upload data. Qdrant adds filter-aware links for the payload indexes that exist when the graph is built. A payload index added later needs an HNSW rebuild.
sitemapExclude: true
---
