---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Shard transfer deltas, Sparse vector performance, Text index loading optimization, Text immutability, Dynamic CPU saturation" 
preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
title_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
small_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
date: 2024-02-26T11:12:00-08:00
author: Mike Jang
featured: false 
tags:
  - vector search
  - new features
  - shard diff transfer
  - sparse vector performance
  - text immutability
  - text loading optimization
  - dymamic CPU saturation
weight: 0 # Change this weight to change order of posts
---

Today, we are pleased to announce the release of [Qdrant 1.8.0](https://github.com/qdrant/qdrant/releases/tag/v1.8.0).
We've optimized performance in a number of ways. We've addressed issues with:

- Shard deltas
- Sparse vectors
- Text immutability
- Text loading optimization
- Dynamic CPU saturation.

We've also added <!-- TBD -->.

Did we miss something? We rely on your feedback to drive our development. We
welcome your contributions, especially in our [Discord community](https://qdrant.to/discord). Join us, introduce yourself, and help us build the best vector search engine!

## Optimized shard transfers

Smaller data transfers based on deltas

## Improved sparse vector performance

16x faster throughput

## Immutable text fields

Immutability with filters reduces required amount of data

Optimized RAM by avoiding `point_to_docs`

## Optimized text field loading

Insertion in increasing order 

Avoid binary search while loading

## Dynamic CPU saturation internals

how many CPUs (threads) to allocate for an optimization job.
