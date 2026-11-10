---
label: Vector database benchmark
title: Run an Open Source Vector Database Benchmark on Your Vectors
description: A published vector db comparison describes someone else's machine and dataset. The numbers that decide your project come from your vectors, your filters, and your latency budget.
image:
  src: /img/lp-benchmarks-comparison/equal-precision.png
  alt: Two throughput curves over precision, with the comparison read where both engines reach the same precision
cards:
  - id: 0
    title: Use the open source benchmark tool.
    description: The vector-db-benchmark repository on GitHub tests engines under the same hardware constraints, with every dataset and engine setting in a plain configuration file.
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
    title: Check recall against exact results.
    description: 'Set exact: true on a query to run a full scan, then compare the approximate results with it.'
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
