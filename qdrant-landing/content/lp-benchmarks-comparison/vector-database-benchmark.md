---
label: Vector database benchmark
title: Run an Open Source Vector Database Benchmark on Your Vectors
description: A published vector db comparison describes someone else's machine and dataset. The numbers that decide your project come from your vectors, your filters, and your latency budget.
image:
  src: /img/lp-benchmarks-comparison/equal-precision.png
  alt: Two throughput curves over precision, with the comparison read where both engines reach the same precision
cards:
  - id: 0
    title: Build the benchmark with Supernova.
    description: '[Supernova](https://github.com/qdrant-labs/supernova) is Qdrant''s open source toolkit for vector search benchmarks. It embeds your dataset, computes exact ground truth, loads the vectors into Qdrant, and measures latency and recall under load.'
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Compare at the same precision.
    description: Approximate search trades recall for speed, so read each speed figure at a matching recall level.
    icon:
      src: /icons/outline/award-blue.svg
      alt: ""
  - id: 2
    title: Test many index settings in one run.
    description: Supernova sweeps loading and load tests across a matrix of index and search settings and combines them into one report.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
