---
draft: false
id: 6
title: Real data
description: Not to be cut off from the world, we ran benchmarks on two datasets with the real data.
These datasets are `arxiv-384` and `h-and-m-2048`.
Payload was downloaded from kaggle: [arxiv](https://www.kaggle.com/datasets/Cornell-University/arxiv); [h-and-m](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations).
Then we applied models to specific fields in order to obtain embeddings.
[all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) computed vectors for paper titles in arXiv dataset.
EfficientNet with dim output 2048 was applied to cloth images in H&M dataset.
The latter one consists of `~100,000` records and has only exact keyword match filters, while the former one contains `~2,000,000` records and has both simple (match keyword) and complex filters (float range). 

filter_data: /benchmarks/real-filter-result-2023-02-03.json
default_plot: precision
date: 2023-02-13
weight: 5
---
