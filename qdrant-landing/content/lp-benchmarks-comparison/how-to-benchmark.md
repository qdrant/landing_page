---
label: How to benchmark
title: How to Benchmark Qdrant on Your Own Data
cards:
  - id: 0
    title: Create a free cluster.
    description: Sign up for Qdrant Cloud with no credit card, then copy the cluster URL and an API key.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Install the benchmark tool.
    description: Clone vector-db-benchmark from GitHub and install its dependencies with Poetry.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Register your dataset.
    description: Add an entry for your vectors to datasets/datasets.json, and the tool downloads and loads them for each run.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
  - id: 3
    title: Run it against your cluster.
    description: Set QDRANT_API_KEY, run run.py with --host set to your cluster URL, and pick a Qdrant configuration from experiments/configurations.
    icon:
      src: /icons/outline/chart-bar-blue.svg
      alt: ""
  - id: 4
    title: Keep every run on file.
    description: The tool saves each run as its own file, with the search settings it used, so you can line runs up side by side.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
button:
  text: Start Free
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
