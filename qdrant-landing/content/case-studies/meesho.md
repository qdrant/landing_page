---
title: "Meesho & Qdrant: Implementing Vector Similarity Search for Enhanced Performance and Scalability"
short_description: Why Meesho chose Qdrant as a cornerstone for building their Vector Similarity Search platform
description: Why Meesho chose Qdrant as a cornerstone for building their Vector Similarity Search platform
social_preview_image: /case-studies/meesho/social_preview.png
preview_dir: /case-studies/meesho/preview
weight: 1
date: 2024-01-010T09:48:00.000Z
---

# Qdrant Case Study: Implementing Vector Similarity Search for Enhanced Performance and Scalability

## Overview
This case study explores the journey of a team, comprising Anshu Aditya, Dhaval Parmar, and Aditya Kumar Garg, as they transitioned from using Elastic to Qdrant for their vector database needs. The decision to switch was driven by the limitations faced with Elastic, especially at the scale of 200-300 million vectors, where it began to break down.

## Initial Challenges with Elastic
The team initially used Elastic, but encountered significant issues as their data scaled. Elastic struggled to handle 200-300 million vectors and completely broke at 50-100 million, a problem even the Elastic.co team couldn't resolve. Furthermore, Elastic was never intended to be a vector database, leading to cost inefficiencies, particularly in product image matching.

## Transition to Qdrant
### Originating Need
The need for a more efficient system arose from the requirement of a nearest neighbour search for recommendations and similar items. The previous workflow included using SageMaker Endpoints and hosting HNSW, ScanNN for immutable data. However, this setup didn't allow for real-time updates on the index or support pre-filtering during searches.

### Introducing VSS
To address these limitations, the team created a Vector Similarity Search (VSS) platform as an intermediary layer between Qdrant and their existing ecosystem. This platform enhanced scalability through caching and load balancing. The VSS focused on storing an ID corresponding to an embedding, known as EmbeddingStore, without requiring an understanding of the embedding concept.

## Implementation of Qdrant
### Setup and Benchmarking
The team implemented Qdrant using Docker, beginning with the April 2023 version. Their primary benchmarks were latency and throughput, followed by recall. Initially, they were not highly concerned with CPU and memory requirements.

### Configuration Adjustments
Configurations were tweaked mainly in logging and ports. They also adjusted the ef construction and m parameter, shifting to a FAISS Flat Index with exact=True and integrating GPT.

## Utilization of VSS across Services
### Services Employing VSS
1. **Similar Items Search:**
   - Custom embedding using the Meesho dataset and external resources.
   - Focus on the return-on-cost trade-off.

2. **Image Matching for Supplier Upload:**
   - Handles 200 million vectors at 128 dimensions, managing 200 requests per second.
   - Utilizes a distinct embedding and separate Qdrant collection.

3. **Search Functionality:**
   - Incorporation of multi-modal embeddings combining query and Meesho-specific embeddings.

### Scalability and Dynamic Collection Sizes
- Managing a vast scale of 500 million images and 100,000 text vectors.
- Mutable indexes allow dynamic collection sizes, ranging from 30,000 to 400,000.
- Handles 10 to 20 million vectors efficiently, scaling up to 30 to 40 million vectors.

This case study demonstrates how the integration of Qdrant significantly improved the scalability and performance of the team's vector database needs, addressing the challenges faced with Elastic and providing a robust platform for their diverse vector similarity search requirements.