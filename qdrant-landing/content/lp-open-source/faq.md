---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: A free Qdrant Cloud cluster has 1 GB RAM, 0.5 vCPU, 4 GB disk, and one node, enough for about 1 M vectors of 768 dimensions, with no credit card. Move to a Standard cluster when you need dedicated resources, multi-node high availability, backups, and SLAs.
  - id: 1
    question: Is Qdrant really open source?
    answer: Yes. The Qdrant engine is open source under the Apache 2.0 license. The project has more than 35,000 GitHub stars and passed 250 million downloads across its packages.
  - id: 2
    question: Can I use Qdrant for free?
    answer: 'You can run it free two ways: self-host the open source engine on your own infrastructure, or use a free tier cluster on Qdrant Cloud. Paid Cloud tiers add scaling, backups, and an uptime SLA.'
  - id: 3
    question: Can I move from self-hosted Qdrant to Qdrant Cloud later?
    answer: Yes. Create a snapshot of your collection and restore it on Qdrant Cloud. Or copy it with the Qdrant migration tool while your app keeps writing.
  - id: 4
    question: Does open source Qdrant have every feature of Qdrant Cloud?
    answer: The engine is the same. Some features need the Cloud platform, including Cloud Inference, automatic shard rebalancing, and resharding. On self-hosted Qdrant, you run your own embedding model and balance shards yourself.
sitemapExclude: true
---
