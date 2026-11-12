---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: What is generative search?
    answer: Generative search answers a query with text an LLM writes from retrieved results. The search step finds the passages, and the LLM turns them into an answer.
  - id: 2
    question: Which LLMs work with Qdrant?
    answer: Qdrant returns passages with their payloads over REST or gRPC, so you can send them to the model you choose through LangChain, LlamaIndex, Haystack, or your own code.
sitemapExclude: true
---
