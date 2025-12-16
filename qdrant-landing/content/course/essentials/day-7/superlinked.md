---
title: "Integrating with Superlinked"
description: Learn how Superlinked’s Mixture of Encoders and Qdrant enable rich, multi-modal embeddings that fuse semantic, numerical, and temporal data for optimized vector retrieval.
weight: 5
---

{{< date >}} Day 7 {{< /date >}}

# Integrating with Superlinked

Advanced feature engineering for vector search applications.

{{< youtube "55iDpaHwKJo" >}}

## What You'll Learn

- Advanced feature engineering techniques
- Vector space optimization
- Multi-modal data handling
- Performance enhancement strategies

## Mixture of Encoders Architecture in Superlinked

The Mixture of Encoders architecture is Superlinked's modular system for combining multiple data-specific embedding models into one unified representation. It creates metadata-aware vector embeddings that integrate signals from text, images, popularity, user interaction, numbers, categories, and time, producing richer and more accurate results for search, retrieval, and recommendation tasks.

### Core Concept

Traditional embedding systems rely on a single model to handle all types of input. Superlinked's Mixture of Encoders takes a different approach by letting users define multiple spaces, each powered by an encoder specialized for a particular data type.

- **Text encoders** (for example, sentence transformers or LLMs) capture semantic meaning from descriptions or notes.
- **Numerical encoders** represent quantitative metrics such as ratings, prices, or counts.
- **Categorical encoders** handle tags, IDs, or labels to model discrete entities.
- **Temporal encoders** learn patterns of recency, popularity, frequency, and event timing to capture how relevance changes over time.

Each encoder produces its own vector representation that reflects its data domain. These embeddings are then merged into a composite embedding, forming a single, context-rich representation that captures multiple dimensions of meaning.

⭐ **Show your support!** Give Superlinked a star on their GitHub repository: [github.com/superlinked/superlinked](https://github.com/superlinked/superlinked)