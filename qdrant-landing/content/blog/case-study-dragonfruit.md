---
draft: false
title: "How Dragonfruit AI scaled real-time computer vision with Qdrant"
short_description: "Dragonfruit AI scales AI video analytics across thousands of cameras."
description: "Discover how Dragonfruit AI leveraged Qdrant’s per-collection configurability and float16 optimizations to achieve real-time, multi-camera computer vision analytics at enterprise scale."
preview_image: /blog/case-study-dragonfruit/social_preview_partnership-dragonfruit.jpg
social_preview_image: /blog/case-study-dragonfruit/social_preview_partnership-dragonfruit.jpg
date: 2025-11-05
author: "Daniel Azoulai"
featured: true

tags:
- Dragonfruit AI
- vector search
- computer vision
- real-time analytics
- Split AI
- float16 optimization
- case study
---


![Dragonfruit Overview](/blog/case-study-dragonfruit/dragonfruit-bento-box-dark.jpg)

## Dragonfruit AI scales real-time computer vision with Qdrant
### Introduction

<a href="https://www.dragonfruit.ai/" target="_blank">Dragonfruit AI</a> builds enterprise-ready computer vision solutions, turning ordinary IP camera feeds into actionable insights for security, safety, operations, and compliance. Their platform ships a suite of AI “agents,” including retail loss prevention and warehouse safety, that run with a patented “Split AI” approach: real-time inference on-prem for speed and bandwidth efficiency, paired with cloud services for aggregation and search. The business imperative was clear: keep total cost of ownership low, meet strict latency targets, and operate reliably across hundreds of sites with thousands of cameras, without asking customers to rip and replace existing infrastructure.

*“We use customers’ existing camera networks and deliver the lowest total cost of ownership we can. On-prem inference plus smart use of the cloud is what makes it practical at retail scale.”*  
 — Karissa Price, Chief Customer Officer, Dragonfruit AI
### The challenge: Real-time at messy, planetary scale

Retail and warehouse environments are bandwidth-constrained and heterogeneous. A single store may run 25–130 IP cameras, and many Dragonfruit agents are real-time, for example burglar alarms or self-checkout monitoring. Engineering needed to:

* Process \~30 FPS per camera on edge devices (Mac Minis) and move only compact inference data to the cloud.

* Track people and objects across multiple cameras and locations, which requires robust embeddings, re-identification, and fast similarity search.

* Sustain high ingestion and high query throughput simultaneously, with strict tail latencies.

* Operate a vector store at enterprise scale: thousands of locations → thousands of cameras, accumulating into tens to hundreds of billions of vectors and multi-terabyte storage.
### Why Qdrant: Performance headroom and operational control

Dragonfruit chose the open-source version of Qdrant as its vector database to meet the twin pressures of real-time reads and high-velocity writes. In head-to-head experiments, Qdrant delivered the QPS targets they needed while giving the team granular, [per-collection](https://qdrant.tech/documentation/concepts/collections/) tuning to match workload diversity.

Key reasons the team highlighted:

* **Per-collection configurability.** Collections with heavy reads and low writes use different settings than write-heavy pipelines. Tuning shard counts and HNSW parameters by collection helped hit latency Service Level Objectives without overprovisioning.

* **Efficient numeric formats.** For most vision workloads, [float16](https://qdrant.tech/documentation/concepts/vectors/) vectors were sufficient, improving memory efficiency and cache behavior with no material loss in retrieval accuracy for their use cases.

* **Open source and ecosystem fit.** Qdrant’s OSS model aligned with Dragonfruit’s platform strategy and let them co-evolve the deployment with their edge and cloud stack.

*“With Qdrant’s collection-level controls, we matched very different workloads, some ingestion-heavy, some read-intensive, and still hit real-time query performance.”*  
 — **Shivang Agarwal, VP Engineering, Dragonfruit AI**
### Solution architecture: Split AI \+ vector search

At the edge, Mac Minis ingest RTSP streams from IP cameras, run on-prem inference, and emit compact embeddings and event metadata. In the cloud, Qdrant serves multiple, distinct retrieval patterns:

* **Multi-camera person re-ID.** Embeddings link tracks across cameras to build “spaghetti charts” of in-store movement, enabling spatial analytics and alerting.

* **Self-checkout product verification.** Frames around scan events are embedded and matched against clustered product libraries to detect missed or incorrect scans in real time.

* **Full-frame semantic search.** Video frames are embedded for [text-to-image retrieval](https://qdrant.tech/advanced-search/) (for example “emergency door open”), enabling rapid incident triage and safety reviews.
### Results: New agents, faster delivery, lower TCO

Qdrant became an enabling layer for Dragonfruit’s agent roadmap. With real-time retrieval performance and cost-efficient storage, the team launched and iterated on new domain-specific agents more quickly, spanning loss prevention, occupational safety, and warehouse operations.

From a go-to-market perspective, Dragonfruit focuses on enterprise buyers and also works through major IT and security integrators, giving them reach into retail (their largest segment), manufacturing, government, entertainment, and healthcare. As Price summarized:

*“Our work with Qdrant gives us the agility to say ‘yes’ faster, adding new agents and answering new use cases, while staying cost-effective.”*

Quantitative highlights (self-reported by the team):

* Real-time processing of many cameras per site at high FPS on edge, with only inference data transmitted.

* Format optimization: float16 embeddings standard for most pipelines to reduce memory and improve throughput while maintaining retrieval quality.
### Lessons learned 

Operating retrieval for vision at enterprise scale is as much an operations problem as an algorithms problem. Dragonfruit learned to tune per workload, not per system. Treat each collection as a workload with its own performance profile; shard counts, flush intervals, and vector precision matter.
### Conclusion

Dragonfruit shows how a Split-AI architecture plus a purpose-built vector database can turn ubiquitous cameras into reliable, low-latency analytics at enterprise scale. Qdrant’s performance headroom, per-collection controls, and operational simplicity helped the team meet real-time constraints and expand their agent portfolio without ballooning costs or bandwidth. As the platform grows, tighter, native data-lifecycle tooling will further reduce operational toil, but the core result is already clear: fast, affordable, and scalable computer vision for the real world.