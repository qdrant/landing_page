---
title: "How Small Can Google's New EmbeddingGemma 2 Get?"
slug: embeddinggemma-2
short_description: "We got early access to Google's EmbeddingGemma 2 and tested how far its embeddings compress in Qdrant while keeping retrieval quality."
description: "Google's EmbeddingGemma 2 in Qdrant: 99% of retrieval quality in 30x less vector RAM, or 94.5% in 77x less with rescoring."
preview_image: /blog/embeddinggemma-2/hero.jpg
social_preview_image: /blog/embeddinggemma-2/hero.jpg
date: 2026-10-06
author: Qdrant Team
featured: false
tags:
  - embeddings
  - quantization
  - matryoshka
  - EmbeddingGemma
---

Google DeepMind released [EmbeddingGemma 2](https://TBD) today. We had early access, so we tested how far we could compress its embeddings in Qdrant while keeping its retrieval quality.

The model compresses very well. At full size with 1-bit quantization, it keeps 99% of its retrieval quality in 30x less vector RAM. With rescoring, it fits in 77x less and keeps 94.5%.

## About EmbeddingGemma 2

EmbeddingGemma 2 is an open embedding model built on Gemma 4. It maps text, code, images, video, and audio into one 768-dimensional space, and its text-only path has 270M parameters, small enough to run on a laptop. Google reports a 14% gain on code retrieval over the first EmbeddingGemma and an 8K-token context window.

The model is trained with Matryoshka Representation Learning, which puts the most important information in the first dimensions of each vector. You can keep the first 512, 256, or 128 dimensions and drop the rest without re-embedding your data. Quantization, which stores each dimension in fewer bits, gives you a second way to shrink the index, and the two combine.

## How we tested it

We embedded five BEIR text retrieval datasets (SciFact, NFCorpus, ArguAna, SCIDOCS, and FiQA) and searched them in Qdrant at every Matryoshka size, with every quantization method Qdrant offers, with and without rescoring. The baseline is exact search over the full 768-dimension float32 vectors. Every percentage in this post is the share of the baseline's nDCG@10 that a configuration keeps, averaged across the five datasets.

{{< chart id="embeddinggemma-2/memory-vs-retention" caption="With rescoring, 1-bit TurboQuant at 256 dimensions keeps 94.5% of nDCG@10 in 77x less vector RAM than float32. Without rescoring, 768 dimensions keeps 99.0% in 30x less." >}}

## Start with full-size, 1-bit vectors

Keep all 768 dimensions and quantize with 1-bit [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization). Each vector takes 104 bytes in RAM instead of 3,072, and search keeps 99.0% of the baseline without rescoring. For 10 million documents, that's about 1 GB of vector RAM instead of 30.7 GB.

Without rescoring, queries don't read the original vectors, which keeps search fast. On Quora's 523k documents, this configuration answered queries in less than half the time of float32 search and kept the same quality.

If your application needs the exact nearest neighbors rather than the most relevant results, for example for deduplication or recommendations, turn rescoring on. Without it, about 74% of the top 10 results match exact search, and the rest are near-ties with the same relevance.

## Fit into 77x less memory with rescoring

For tighter memory budgets, truncate to 256 dimensions and keep 1-bit TurboQuant. Each vector takes 40 bytes, 77x less than float32, and search keeps 94.5% of the baseline with rescoring on. Keep rescoring on at this size. It's what lifts quality from 88.1% to 94.5%.

<aside role="status">
  Qdrant's <a href="/documentation/manage-data/vectors/#datatypes" target="_blank" rel="noopener noreferrer">vector datatypes</a> can store the original vectors used for rescoring as float16 or turbo4, which can cut their size on disk as well.
</aside>

## Reduce bits before dimensions

For a fixed memory budget, reducing bits keeps more quality than reducing dimensions. At 72 bytes per vector, 512 dimensions at 1 bit keeps 97.3%, while 128 dimensions at 4 bits keeps 84.0%. Quantize first, and truncate dimensions when you need an index smaller than quantization alone gives you.

## Try it on your own data

Start with all 768 dimensions, 1-bit TurboQuant, and rescoring off, and compare the results with an unquantized collection on your own queries. That gives you 30x less vector RAM with nearly all of the model's retrieval quality. Turn rescoring on when you need exact neighbors, and move to 512 or 256 dimensions with rescoring when you need a smaller index.

## Thanks

Thanks to Google DeepMind for EmbeddingGemma 2 and for early access to the model.