---
draft: false
title: "We Raised $50M to Build Composable Vector Search as Core Infrastructure for Production AI"
short_description: "Qdrant raises $50M in Series B funding to scale composable vector search from edge devices to supercomputers."
description: "Qdrant announces $50M in Series B funding led by AVP to build composable vector search as foundational infrastructure for production AI — from agentic workflows to edge devices."
preview_image: /blog/series-b-announcement/social_preview_series-b.jpg
social_preview_image: /blog/series-b-announcement/social_preview_series-b.jpg
date: 2026-03-12
author: "Andre Zayarni"
featured: true

tags:
- series b
- funding
- composable vector search
- infrastructure
- agentic ai
- edge computing
- rust
- qdrant
--- 

Today we're announcing $50 million in Series B funding, led by AVP, with participation from Bosch Ventures, Unusual Ventures, Spark Capital, and 42CAP.

## Retrieval Is on the Critical Path of Every AI System

Every serious AI workload — RAG, agents, multimodal search — depends on retrieving the right information, at the right time, under real constraints. Teams prototype with whatever is convenient, then hit walls in production: indexes that stall under writes, filtering applied after search instead of during it, tail latencies that spike under load. These aren't configuration problems. They're architectural ones. And they're why we started Qdrant.

Our design philosophy: we are building fundamental infrastructure. The kind that lasts years, maybe decades. Think Linux kernel, not SaaS wrapper. That conviction is why Qdrant is built from the ground up in Rust — because infrastructure on the critical path of production AI cannot afford garbage collection pauses, memory safety issues, or the performance unpredictability of managed runtimes. It's why we control the stack down to assembly, rebuilding any layer that doesn't meet the standard. And it's why Qdrant delivers predictable low tail latency at billion-scale, running consistently from [edge devices](https://github.com/qdrant/qdrant-edge-demo) to bare-metal supercomputers like [Aurora at Argonne National Laboratory](https://arxiv.org/abs/2509.12384).

We’re proud of the enterprises running Qdrant in production, including Canva, Bazaarvoice, HubSpot, Roche, Bosch, and OpenTable. We surpassed 250 million downloads across all our packages and 29,000 GitHub stars.

"Qdrant's technical architecture and performance capabilities have proven to be exactly what we need as we scale our AI-powered features across the platform," said Colin Chauvet,  Director of Engineering at Canva. "They are an ideal partner as we standardize our vector search infrastructure to serve millions of users worldwide."

## Fixed Pipelines Break. Composable Primitives Don't.

Most search systems give you a fixed pipeline. Data goes in, queries come out, and the system decides how retrieval happens. Composable vector search inverts that. Features such as dense vectors, sparse vectors, metadata filters, multi-vector representations, and custom scoring are primitives you combine at query time, not features hidden behind an opaque API.

This matters because different workloads need fundamentally different retrieval. A [multimodal system at Tripadvisor](https://qdrant.tech/blog/case-study-tripadvisor/) retrieving across billions of signals looks nothing like an [agentic workflow at Lyzr](https://qdrant.tech/blog/case-study-lyzr/) working with 100s of agents operating at low latency. A composable engine adapts to the problem. A fixed pipeline forces the problem to adapt to the tool.

## Agents and Edge Devices Need the Same Thing: Fast, Flexible Retrieval Everywhere

Agentic AI can turn retrieval into a tight inner loop; imagine thousands of steps per workflow, where latency compounds and an occasional slow result cascades through the entire chain. Agents can't declare their retrieval strategy upfront. They shift from dense to hybrid search, tighten filters, and re-weight scores based on what prior steps returned. This is composability at query time, not configuration time.

Meanwhile, AI is moving to where decisions are made. Not everything can round-trip to the cloud: on-device assistants, field diagnostics, and industrial systems running semi-offline. [Qdrant Edge](https://qdrant.tech/documentation/edge/) will bring the full composable retrieval stack to resource-constrained devices with efficient cloud sync. One retrieval architecture from the data center to the device.

## Thanks to Our Community and the Engineers Who Shape This Engine

Qdrant is shaped by engineers running it under real pressure, and we want to thank them directly. The over 29,000 GitHub stars reflect reach, but it is the code contributions from production systems that move our engine forward. In v1.16, [@eltu added ASCII folding to improve multilingual full-text retrieval without upstream preprocessing](https://github.com/qdrant/qdrant/pull/7408). More recently, [@TY0909 contributed field-level control over HNSW graph construction](https://github.com/qdrant/qdrant/pull/7887), reducing indexing cost and memory overhead in large hybrid deployments. These contributions come from real operational pressure and directly shape how Qdrant behaves under load.

Models get the attention, but retrieval is what makes them useful in production. We believe vector search will be as fundamental to AI systems as relational databases were to the internet era. And we're building Qdrant to be the engine that lasts.

If you're building with Qdrant or contributing back: thank you. And if you want to work on fundamental infrastructure for AI, [we're hiring](https://join.com/companies/qdrant).

