---
title: "Sentinel - Gen AI Zürich Hackathon Winner"
draft: false
slug: gen-ai-zurich-winners
short_description: "Meet Sentinel, the AI-powered misinformation detection system that won the Qdrant Challenge at Gen AI Zürich Hackathon. Discover how this solo developer built a real-time fact-checking system using Qdrant Cloud for semantic search."
description: "Meet Sentinel, the AI-powered misinformation detection system that won the Qdrant Challenge at Gen AI Zürich Hackathon. Discover how this solo developer built a real-time fact-checking system using Qdrant Cloud for semantic search."
preview_image: blog/gen-ai-zurich-hackathon/sentinel.png
social_preview_image: blog/gen-ai-zurich-hackathon/sentinel.png
date: 2026-04-29
author: Manas Chopra
featured: true
tags:
  - news
  - blog
---
When Ali Aoun Mehdi watched two major global news outlets report opposite facts during the Iran-US conflict, he saw a critical problem: misinformation spreading in real-time. From Islamabad, participating virtually in the Gen AI Zürich Hackathon, he built Sentinel to close this "fact-gap" by detecting contradictions across news sources instantly.

Sentinel is an AI-powered early warning system that monitors 20 global news sources every 30 minutes. It identifies factual contradictions in under 30 seconds, providing users with a misinformation risk score and narrative traction assessment.

![Sentinel Project Cover](/blog/gen-ai-zurich-hackathon/cover.jpeg)

## 🏆 Hackathon Success

**🥇 Winner — Qdrant Challenge**

**🥉 3rd Place — Apify Challenge**

**🎯 Top 10 Finalist (out of 93 submissions)**

## How Sentinel Works

### Data Collection
Sentinel uses a custom Apify Actor with Python SDK to automatically scrape news from 20 global sources every 30 minutes.

### Vector Search with Qdrant
This is where Qdrant Cloud shines. Sentinel uses semantic search to find related articles based on meaning, not just keywords. This allows the system to compare different sources even when they use completely different wording to describe the same event. Qdrant stores article embeddings and enables fast similarity searches to identify potentially conflicting reports.

### AI Analysis
The system uses Mistral-7B model (via Featherless AI) to extract facts and calculate contradiction scores. When related articles are found through Qdrant's semantic search, the AI analyzes them for factual inconsistencies.

### Technology Stack
- **Backend:** FastAPI hosted on HuggingFace Spaces
- **Frontend:** React (via Lovable) with D3.js for narrative network visualization
- **Vector storage and search engine:** Qdrant Cloud for semantic search
- **AI Model:** Mistral-7B for fact extraction and scoring

### Sentinel in Action

![Sentinel Working Dashboard](/blog/gen-ai-zurich-hackathon/working.png)

## Why Qdrant Was Essential

Qdrant Cloud serves as Sentinel's semantic memory core. Without Qdrant's ability to find articles by meaning rather than exact keywords, Sentinel couldn't detect when different sources report the same event differently. The vector database enables the system to:

- Find semantically related articles across different sources
- Compare factual claims even when wording varies significantly
- Scale to handle continuous news ingestion from multiple sources

## Try Sentinel Yourself

**Live Demo:** [sentinel-checker.lovable.app](https://sentinel-checker.lovable.app)

**Demo Video:** [Watch the Walkthrough](https://vimeo.com/1179503292?fl=pl&fe=sh)

**GitHub Repository:** [github.com/Ali-Aoun5/sentinel](https://github.com/Ali-Aoun5/sentinel)

## About the Creator

**Name:** Ali Aoun Mehdi  
**LinkedIn:** [linkedin.com/in/ali-aoun-98719b3a2](https://www.linkedin.com/in/ali-aoun-98719b3a2)

Ali developed Sentinel as a solo developer, proving that with the right tools like Qdrant, complex AI systems can be built by individuals to tackle real-world misinformation challenges.

## What's Next

Congratulations to Ali for this impressive achievement! Sentinel demonstrates how vector search, combined with AI analysis, can create powerful solutions for one of today's most pressing challenges.

👉 Join the Qdrant community: [qdrant.tech/community](https://qdrant.tech/community)
