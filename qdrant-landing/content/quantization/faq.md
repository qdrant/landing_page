---
title: FAQs
questions:
- question: Does quantization require a paid tier?
  answer: No. Quantization is available across Qdrant deployment modes and is not gated behind a paid tier. Enable it on Qdrant Cloud, Hybrid Cloud, Private Cloud, Edge, or self-hosted.
- question: Will I lose recall when I turn quantization on?
  answer: Compression does reduce recall if you search the quantized index alone. Enable rescoring on your search requests so Qdrant re-ranks candidates against the original vectors and recovers most of the accuracy.
- question: Which quantization method should I start with?
  answer: The comparison matrix in the docs shows memory savings, recall, and speed for scalar, product, and binary quantization side by side. Review it against your embedding model and latency budget before you pick.
sitemapExclude: true
---
