---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: Which parts of Qdrant are written in Rust?
    answer: All of it. The storage layer, the indexes, the query planner, and the API server are Rust, and Qdrant compiles into a single binary executable.
  - id: 2
    question: Does Qdrant run embedded in a Rust process?
    answer: 'If you searched for a rust embedded database, Qdrant Edge is the in-process option: the qdrant-edge crate runs the engine inside your application, in beta, and can sync with a Qdrant server for backups and heavier indexing.'
  - id: 3
    question: Is Qdrant Cloud the same engine as the open source binary?
    answer: Yes. Qdrant Cloud runs the same Rust engine as a managed service on AWS, GCP, or Azure, so the client code you write against a free cluster runs unchanged against a self-hosted node.
sitemapExclude: true
---
