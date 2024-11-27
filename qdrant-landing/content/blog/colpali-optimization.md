---
title: "Optimizing ColPali for Retrieval at Scale, 13x Faster Results"
draft: false
slug: colpali-qdrant-optimization # Change this slug to your page slug if needed
short_description:  Learn how we optimized ColPali, a document retrieval system, to be 13x faster for datasets of 20,000+ PDFs. Discover how pooling and reranking boost scalability while maintaining precision. # Change this
description: ColPali combines text and visual contexts for precise document retrieval, but scaling posed challenges. We achieved 13x faster retrieval using pooling and reranking, reducing vector counts by ~30x while retaining near-original accuracy. Explore the open-source demo to optimize your retrieval workflows! # Change this

preview_image: /blog/colpali-optimization/preview-2.png # Change this
social_preview_image: /blog/colpali-optimization/preview-2.png # Optional image used for link previews
# title_preview_image: /blog/Article-Image.png # Optional image used for blog post title
# small_preview_image: /blog/colpali-optimization.png # Optional image used for small preview in the list of blog posts

date: 2024-11-27T00:40:24-03:00
author: Evgeniya Sukhodolskaya # Change this
featured: yes # if true, this post will be featured on the blog page
tags: # Change this, related by tags posts will be shown on the blog page
  - colpali
  - reranker
  - optimization
  - qdrant
  - quantization
  - multimodal


---

ColPali is a fascinating leap in document retrieval. Its precision in handling visually rich PDFs is phenomenal, but scaling it to handle real-world datasets comes with its share of computational challenges.

Here's how we solved these challenges to make ColPali 13x faster without sacrificing the precision it’s known for.

## The Scaling Dilemma

ColPali generates **~1,030 vectors for just one page of a PDF.** While this is manageable for small-scale tasks, in a real-world production setting where you may need to store hundreds od thousands of PDFs, the challenge of scaling becomes significant.

Consider this scenario:

- **Dataset Size:** 20,000 PDF pages.
- **Vector Explosion:** Each page generates ~1,030 vectors of 128 dimensions.
- **Index Complexity:** Trillions of comparisons to build the index comparing every vector pair.

Even advanced indexing algorithms like **HNSW** struggle with this scale, as computational costs grow quadratically. 

We turned to a hybrid optimization strategy combining **pooling** (to reduce computational overhead) and **reranking** (to preserve accuracy).

Before we go any deeper, watch our [Webinar video](https://www.youtube.com/live/_h6SN1WwnLs?si=n8gwiIjJ5dnfucXC) for the full demo walkthrough.
<iframe width="560" height="315" src="https://www.youtube.com/embed/_h6SN1WwnLs?si=HqJTcwDbdk4j_L0Y&amp;start=922" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

For those eager to explore, the [codebase is available here](https://github.com/qdrant/demo-colpali-optimized).


## Two-Stage Retrieval Process

### Pooling

Pooling is well-known in machine learning as a way to compress data while keeping important information intact. For ColPali, we reduced ~1,030 vectors per page to just 38 vectors by pooling rows in the document's 32x32 grid.

The most popular types of pooling are:

- **Mean Pooling:** Averages values across rows.
- **Max Pooling:** Selects the maximum value for each feature.

32 vectors represent the pooled rows, while an additional 6 vectors encode contextual information derived from ColPali’s special tokens (e.g., <bos> for the beginning of the sequence, and task-specific instructions like “Describe the image”).

For our experiments, we chose to preserve these 6 additional vectors.

### The "ColPali as a Reranker" Experiment

Pooling drastically reduces retrieval costs, but there’s a risk of losing fine-grained precision. To address this, we implemented a **two-stage retrieval system** with the pooled vectors for the initial retrieval stage and the original ColPali model for reranking:

1. **Pooled Retrieval:** Quickly retrieves the top 200 candidates using lightweight pooled embeddings.
2. **Full Reranking:** Refines these candidates using the original, high-resolution embeddings, delivering the final top 20 results.

This approach delivers speed without compromising on retrieval quality.

### Implementation

We created a custom dataset with over 20,000 unique PDF pages by merging:

- **ViDoRe Benchmark:** Designed for document retrieval evaluation.
- **UFO Dataset:** Visually rich documents paired with synthetic queries.
- **DocVQA Dataset:** A large set of document-derived Q&A pairs.

Each document was processed into 32x32 grids, generating both full-resolution and pooled embeddings. 

![](/blog/colpali-optimization/rows.png)

These embeddings were stored in the **Qdrant vector database**, configured for speed:

- **Full-Resolution Embeddings:** ~1,030 vectors per page.
- **Pooled Embeddings:** Mean and max pooling variants.

All embeddings were kept in RAM to ensure consistent retrieval performance.


### Experiment Setup

We evaluated retrieval quality using 1,000 task-specific queries and the retrieval process followed the two-stage approach:
1. **Pooled embeddings** retrieved the top 200 candidates.
2. **Full-resolution embeddings** reranked these candidates to produce the final top 20 results.

To measure performance, we used:

- **NDCG@20:** Measures ranking quality (how well the top results align with expectations).
- **Recall@20:** Measures the overlap between pooled and full-resolution retrievals.

## Results

The experiments gave us some very promissing results:

- **Speed:** Retrieval time improved **13x** compared to full-resolution embeddings alone.
- **Accuracy:** Mean pooling preserved retrieval quality nearly identical to the original ColPali.

### Metrics

| Pooling Type | NDCG@20 | Recall@20 |
|--------------|---------|-----------|
| **Mean**     | 0.952   | 0.917     |
| **Max**      | 0.759   | 0.656     |


Mean pooling offered the ideal balance, combining speed and precision, while max pooling delivered faster results but at the cost of noticeable quality degradation.

### Other Insights

We also explored additional optimizations, including removing `<pad>` tokens, which slightly improved speed without significant quality loss, and applying binary quantization, which increased retrieval speed but introduced minor accuracy drops.

## What’s Next?
Future experiments could push these results even further:

- Investigating column-wise pooling for additional compression.
- Testing hybrid half-precision (float16) vectors to balance memory use and speed.
- Skipping special multivectors during prefetch to streamline retrieval.
- Combining quantization with oversampling for even faster search.


### Try It Yourself

Curious to see this in action? Explore the full codebase and experiment with ColPali optimizations:

- **Demo Notebook:** [GitHub Repository](https://github.com/qdrant/demo-colpali-optimized)
- **Webinar Walkthrough:** [Watch Here](https://www.youtube.com/live/_h6SN1WwnLs?si=n8gwiIjJ5dnfucXC)

[Join the community](https://discord.com/invite/qdrant) and share your results!

--- 
