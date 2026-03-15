---
title: "Video Anomaly Detection From Edge to Cloud With Qdrant"
draft: false
slug: video-anomaly-detection-edge-to-cloud
short_description: "Detect anomalies in live video by reframing surveillance as a nearest-neighbor search problem in Qdrant."
description: "Qdrant Edge, Twelve Labs Marengo 3.0, NVIDIA Metropolis VSS, and Vultr Cloud GPUs come together for real-time video anomaly detection. Detect what you've never seen before."
preview_image: /blog/video-anomaly-detection-edge-to-cloud/preview.png
social_preview_image: /blog/video-anomaly-detection-edge-to-cloud/preview.png
date: 2026-03-09
author: Qdrant
featured: false
tags:
  - news
  - blog
---

![Sentinel dashboard: live camera grid with real-time anomaly alerts](/blog/video-anomaly-detection-edge-to-cloud/sentinel-dashboard.png)

What if your surveillance cameras could detect fights, accidents, intrusions, and equipment failures without ever being trained on those specific events?

Traditional video classifiers need labeled examples of every anomaly type you want to catch. That breaks in the real world. You can't enumerate everything that could go wrong, and the moment something new happens, your model scores 0.0.

We built a system that takes a different approach: reframe anomaly detection as a **nearest-neighbor search problem**. Instead of asking "is this a fight?", ask "how different is this from what we normally see?" That question is a vector distance calculation, and Qdrant answers it in sub-millisecond time.

![Reframing anomaly detection as vector search](/articles_data/video-anomaly-edge/vector-reframe.png)

## The Idea

Index video embeddings of normal activity into Qdrant as a baseline. When a new clip arrives, embed it and search for its nearest neighbors. If the clip is far from anything in the baseline, it's anomalous. No anomaly labels required, no retraining when new anomaly types emerge.

This works because the space of "normal" is learnable, but the space of "abnormal" is unbounded. A binary classifier trained on 13 crime categories will miss a forklift collision or a pipe burst. kNN distance from normal catches anything unusual by definition.

![kNN lookup: incoming clip embedded and searched against nearest neighbors in Qdrant](/articles_data/video-anomaly-edge/knn-lookup.png)

## The Stack

![Tech stack overview: Qdrant Edge, Twelve Labs, NVIDIA VSS, Vultr](/articles_data/video-anomaly-edge/tech-stack-overview.png)

**[Qdrant Edge](/documentation/edge/)** runs directly on NVIDIA Jetson devices with a two-shard architecture: an immutable HNSW shard synced from the cloud as the baseline, and a mutable shard for live writes. Sub-millisecond kNN lookups with no network dependency and full offline resilience.

![Two-shard edge architecture: mutable shard for live writes, immutable HNSW shard synced from cloud](/articles_data/video-anomaly-edge/edge-shards.png)

**[Twelve Labs](https://twelvelabs.io) Marengo 3.0** provides the video embeddings. Unlike frame-level models like CLIP (0.23 AUC-ROC), Marengo processes temporal dynamics, audio, and scene context as a unified signal (0.97 AUC-ROC). One model handles both anomaly scoring and semantic search across your video archive.

**[NVIDIA Metropolis VSS](https://developer.nvidia.com/metropolis)** orchestrates GPU-accelerated video ingestion on [Vultr Cloud GPUs](https://www.vultr.com/products/cloud-gpu/): embeddings, VLM captioning, audio transcription, and CV pipelines running together.

**[Vultr](https://www.vultr.com/)** provides the cloud GPU infrastructure that powers the entire cloud tier. Dedicated NVIDIA GPUs with per-hour billing and a global data center footprint keep latency low and costs predictable for edge-to-cloud escalation.

## What It Produces

![Sentinel incident view: video playback with Twelve Labs-powered chat Q&A](/blog/video-anomaly-detection-edge-to-cloud/sentinel-chat.png)

The system transforms live surveillance streams into:

- **Real-time anomaly scores** using kNN distance from the normal baseline, with temporal smoothing and hysteresis thresholding to filter noise
- **Incident reports** with severity scoring, timelines, and natural-language explanations of what happened
- **Semantic video search** across all cameras and time periods. "Show me unusual activity at the north entrance last week."
- **Interactive Q&A** about detected events, grounded in actual video content
- **Edge-to-cloud escalation** that reduces cloud processing volume by ~6x while catching ~95% of true anomalies



## Why Edge Matters

![Escalation pipeline from edge to cloud](/articles_data/video-anomaly-edge/escalation-pipeline.png)

A 50-camera deployment generates 432,000 clips per day. Sending every clip to the cloud for embedding and scoring is neither fast enough nor cost-effective. Qdrant Edge triages locally on-device: only clips scoring above threshold get escalated to the cloud tier for higher-fidelity analysis with Marengo 3.0 and ensemble scoring.

The result is a system that scales with camera count without scaling cloud costs linearly.

![Sentinel: real-time AI-powered anomaly detection powered by Qdrant Edge, Twelve Labs, Vultr, and NVIDIA](/blog/video-anomaly-detection-edge-to-cloud/sentinel-splash.png)

## Build It Yourself

We published a full 3-part tutorial that walks through every component of this architecture with working code: from kNN anomaly detection theory through Qdrant Edge's two-shard design to baseline governance and Vultr deployment.

- [Part I | Architecture, Twelve Labs, and NVIDIA VSS](/documentation/tutorials-build-essentials/video-anomaly-edge-part-1/)
- [Part II | Edge-to-Cloud Pipeline](/documentation/tutorials-build-essentials/video-anomaly-edge-part-2/)
- [Part III | Scoring, Governance, and Deployment](/documentation/tutorials-build-essentials/video-anomaly-edge-part-3/)

**GitHub**: [qdrant/video-anomaly-edge](https://github.com/qdrant/video-anomaly-edge)

**Live Demo**: [qdrant-edge-video-anomaly.vercel.app](https://qdrant-edge-video-anomaly.vercel.app/)

The concepts extend beyond surveillance. Manufacturing safety, retail analytics, traffic monitoring: anywhere you need to detect "something unusual" without defining every possible anomaly in advance.
