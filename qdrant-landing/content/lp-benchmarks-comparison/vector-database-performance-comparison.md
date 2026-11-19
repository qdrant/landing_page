---
label: Vector database performance comparison
title: Read Latency and Throughput Separately
description: A vector database performance comparison needs two numbers, because one user waiting and many users at once are different loads.
cards:
  - id: 0
    title: Latency for the user who waits.
    description: Single-threaded runs show the response time one user feels, including p95.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Throughput for traffic at scale.
    description: Parallel runs show requests per second under load.
    icon:
      src: /icons/outline/chart-bar-blue.svg
      alt: ""
  - id: 2
    title: Tune per query.
    description: Raise hnsw_ef for higher recall or lower it for speed, and record both numbers at each setting.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
