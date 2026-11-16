---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, and 4 GB disk, for about 1 M vectors of 768 dimensions. Upgrade to Standard for dedicated resources and SLAs.
  - id: 1
    question: How do I give my AI agents long-term memory?
    answer: Store what the agent learns as vectors in a Qdrant collection, with payload fields such as user, session, or date. At each step, the agent queries that collection with filters to pull back only the memory it needs.
  - id: 2
    question: Can every intelligent agent share one memory?
    answer: Yes. Point every agent at one Qdrant collection, and each can retrieve what the others stored.
sitemapExclude: true
---
