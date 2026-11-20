---
figure: /img/rethink-reranking/regulated-data.svg
figureAlt: 'Keep every full-precision vector in RAM, or cache the vectors queried first and read the rest from disk'
title: Give Regulated Data Exact Answers and Spend RAM Where It Counts
description: 'Back to the clinician: for a pediatric dose, a close-enough vector is a risk every reviewer rejects. Keep vectors in float32 and place each in a memory tier: RAM for the prefetch, disk for rescoring. Where policy allows, add a quantized copy and rescore against the originals. Measure first reads from disk against your p99.'
callout:
  text: 'Bayer: keeps quantized vectors in RAM and originals on disk across about 135 million points, then rescores with 3x oversampling.'
  url: https://qdrant.tech/blog/case-study-bayer/
  label: Read the Bayer case study
sitemapExclude: true
---
