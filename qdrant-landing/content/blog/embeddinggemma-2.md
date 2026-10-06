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

Google's new EmbeddingGemma 2 can run on a phone. The model travels light. The vectors need their own suitcase. At 10 million documents, full-size float32 vectors alone take 30.7 GB of RAM.

We got early access ahead of today's Google DeepMind release and tested how much of that memory we could save in Qdrant. Quantized full-size vectors kept 99% of their retrieval quality with 30x less vector RAM. Shorter vectors with rescoring reached 77x less vector RAM and retained 94.5%.

We tried both ways of saving memory: shorter vectors and fewer bits per dimension. The chart compares them with exact search over full-size float32 vectors on five text retrieval datasets. Quality is the percentage of the baseline's nDCG@10 retained, a score for how well the top 10 results rank relevant documents.

{{< chart id="embeddinggemma-2/memory-vs-retention" caption="Vector RAM excludes graph indexes, payloads, and original vectors stored for rescoring. Results cover text retrieval. Rescoring uses 4x oversampling." >}}

<aside role="status">
We tested SciFact, NFCorpus, ArguAna, SCIDOCS, and FiQA from BEIR and averaged retention across them. nDCG stands for normalized discounted cumulative gain. Rescoring ranks candidates again using original vectors.
</aside>

## About EmbeddingGemma 2

[EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2) is an open embedding model built on Gemma 4. It maps text, code, images, video, and audio into one 768-dimensional space. Its text-only path has 270M parameters. Google reports a 14% gain on code retrieval over the first EmbeddingGemma and an 8K-token context window.

Matryoshka Representation Learning lets you keep the first 512, 256, or 128 dimensions without re-embedding your data. Those first dimensions remain useful on their own. Quantization saves more memory by storing each dimension in fewer bits.

## Start With Full-Size, 1-Bit Vectors

This is where we'd start: keep all 768 dimensions, use 1-bit [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), and leave rescoring off. Each vector takes 104 bytes instead of 3,072. That puts the vectors for 10 million documents at about 1 GB of RAM.

Leaving rescoring off also avoids reading original vectors during search. On Quora's 523k documents, this setup took less than half the query time of float32 search and retained 99.0% of its retrieval quality.

High relevance doesn't mean identical results. Without rescoring, about 74% of the top 10 results matched exact search. Try rescoring if your application depends on recovering the same neighbors.

Cutting dimensions feels like the obvious way to save memory. In these tests, we'd cut bits first. At 72 bytes per vector, 512 dimensions at 1 bit kept 97.3% of the baseline. At a similar memory budget, the 128-dimensional, 4-bit setup kept 84.0%. Try keeping more dimensions and compressing each one more heavily first.

## Fit Into 77x Less Vector RAM With Rescoring

If you're counting every byte, 256 dimensions is worth a look. Keep 1-bit TurboQuant. Each vector takes 40 bytes in RAM. With rescoring, this setup retained 94.5% of the baseline. Without it, retention dropped to 88.1%. If the full-size setup still needs too much vector RAM, this is worth testing. Check whether the relevance loss and rescoring time fit your application.

<aside role="status">
Rescoring helps recover quality with 4x oversampling: 40 candidates for 10 results. The tradeoff is storing and reading original vectors. Test relevance and latency on your own index to see whether the smaller RAM footprint pays off.
</aside>

Qdrant's [vector datatypes](/documentation/manage-data/vectors/#datatypes) let you store originals as float16 or turbo4 to save disk space. We haven't tried those options yet. That's another experiment.

## Try It on Your Own Data

Start with the boring configuration: full-size vectors, 1-bit TurboQuant, rescoring off. It did well enough to earn the first test. Compare relevance and latency with an unquantized collection on your own queries. Try rescoring if you need better neighbor recovery. Shorten the vectors if you still need to save memory.

## Thanks

Thanks to Google DeepMind for EmbeddingGemma 2 and for early access to the model.
