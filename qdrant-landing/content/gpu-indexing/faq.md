---
title: FAQs
questions:
  - id: 0
    question: Which clusters can use GPU indexing?
    answer: Any Qdrant Cloud cluster with 16 GiB RAM or more per node. Select a qualifying node configuration and enable GPU at the cluster level. Available on AWS today.
  - id: 1
    question: Where is GPU indexing available?
    answer: Available on AWS clusters today. GCP and Azure are on the roadmap. Need GCP or Azure with GPU-accelerated indexing? <a href="/contact-us/">Contact us</a>.
  - id: 2
    question: Do I need to manage the GPU instances?
    answer: No. Qdrant Cloud provisions and configures them automatically. Select a node configuration with 16 GiB RAM or more, and the GPU option appears in the package selector at that threshold. GPU is enabled at the cluster level; everything else is managed.
  - id: 3
    question: Does GPU indexing speed up my queries?
    answer: No, and that is by design. GPU accelerates HNSW index construction; queries always run on CPU. You get faster builds without paying for GPU on every query.
  - id: 4
    question: Which GPU does it use?
    answer: "NVIDIA T4 instances on AWS Cloud. In open source, GPU indexing is vendor-agnostic through the Vulkan API and works with NVIDIA, AMD, or Intel GPUs."
  - id: 5
    question: How much faster is it?
    answer: Up to 4x faster HNSW index builds on dedicated GPUs, based on Qdrant benchmarks. The benefit is largest for sustained write load, bulk loads, and full-corpus re-embeds.
  - id: 6
    question: Can I turn GPU off when I don't need it?
    answer: Yes. GPU is a cluster-level setting you can disable, returning the cluster to standard instances. Useful for one-time migrations; for sustained write load, leave it on.
  - id: 7
    question: Does GPU indexing work with quantization?
    answer: "Yes. The two complement each other: GPU accelerates the build, and quantization reduces the memory footprint of the resulting index."
sitemapExclude: true
---
