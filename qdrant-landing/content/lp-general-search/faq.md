---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: How is a vector search engine different from a traditional search engine?
    answer: A traditional search engine scores keyword matches. A vector search engine scores how close embeddings are and ranks results by similarity. Qdrant runs both in one query and fuses the keyword and vector rankings into one list.
  - id: 2
    question: Can I use Qdrant as a search results API?
    answer: Yes. Send a dense, sparse, or hybrid query over REST or gRPC and get back one ranked list of results with their payloads.
sitemapExclude: true
---
