---
label: WHAT YOU GET
title: "Keep Your Recall: </br>Rescoring & Oversampling"
description: Compression trades some accuracy for speed and memory, and rescoring gives most of that accuracy back. Set the rescore parameter on your search request and Qdrant re-ranks the compressed candidates against the original vectors before returning results. Raise oversampling to widen that candidate pool.
chart:
  title: Recall vs P95 Latency, Oversampling 1X → 16X
  description: How much latency you pay for each point of recall that rescoring gives back
  legend:
    - id: 0
      text: K=10
    - id: 1
      text: K=100
    - id: 2
      text: HNSW, No Quantization
    - id: 3
      text: Rescore Off
  image:
    src: /img/quantization/chart-container.png
    alt: Chart
explanation: "At k=100, 3x with rescore beats un-quantized HNSW on both axes: 0.9946 recall at 1.49 ms against 0.9877 at 2.25 ms. Rescore off: 0.6873, unrecoverable. Measured on 100,000 dbpedia entities embedded with OpenAI text-embedding-ada-002, 1536d cosine."
link:
  text: Learn How Rescoring Works
  url: /documentation/manage-data/quantization/#searching-with-quantization
sitemapExclude: true
---

