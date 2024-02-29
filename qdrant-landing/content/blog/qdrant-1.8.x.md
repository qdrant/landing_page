---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Sparse vector performance, Text index loading optimization, Text immutability, Dynamic CPU saturation" 
preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
title_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
small_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
date: 2024-02-26T11:12:00-08:00
author: Mike Jang
featured: false 
tags:
  - vector search
  - new features
  - sparse vector performance
  - dymamic CPU saturation
  - text immutability
  - text loading optimization
weight: 0 # Change this weight to change order of posts
---

Today, we are pleased to announce the release of [Qdrant 1.8.0](https://github.com/qdrant/qdrant/releases/tag/v1.8.0).
We've optimized performance in a number of ways. We've addressed issues with:

<!-- Shard deltas (deferred to v1.9) -->
- Sparse vectors
- Dynamic CPU saturation
- Text immutability
- Text loading optimization

We've also added <!-- TBD -->.

Did we miss something? We rely on your feedback to drive our development. We
welcome your contributions, especially in our [Discord community](https://qdrant.to/discord). Join us, introduce yourself, and help us build the best vector search engine!

## Improved sparse vector performance

The primary focus of Qdrant is performance. It's why we build our work in Rust.
We also want to optimze performance in "real-world" situations.

We used the [NeurIPS 2023 datasets](https://big-ann-benchmarks.com/neurips23.html). We've optimized our search to improve throughput by a factor of 16.

We set up test benchmarks in our [Sparse vectors benchmark](https://github.com/qdrant/sparse-vectors-benchmark) repository. For our benchmarks, we ran
the full query dataset againt a system with 8 CPUs.

<!-- Not sure if we need the details of how we created the test collection -->

Based on our tests, we found the following two-dimentional histogram of
latency per query dimension count:

![Histogram with increasing latency for higher query dimensions](/blog/qdrant-1.8.x/neurIPS_bench_example.png)

The colors within the scatter plot show the frequency of the results. The "red"
points show the highest frequency.

## Optimized CPU use

We continue to optimize our search. With dynamic CPU saturation we've increased
indexing speed, with no impact on search requests.

For most users, the default `optimizer_cpu_budget` works well. It allocates
more CPU resources for building indexes, while reserving resources to handle
searches.

With our [Collections](/documentation/concepts/collections/) API, you can 
configure how Qdrant saturates the CPUs in your configuration. 

## Optimize RAM with immutable text fields

We have optimized the required RAM with immutable text fields. We have set up
a field index which helps minimize what is stored.

Based on our tests of a system with 64GB of RAM, we've reduced by the amount of 
required RAM by around 10%. We expect greater improvements on systems with less RAM.

Mutable documents require additional RAM.

## Increase search performance

To improve search performance we have optimized the way we load documents for searches with a text field index. This also minimizes the load on RAM. 

To set this up, we load documents mostly sequentially, in increasing order.

## Release notes
<!-- The link won't work until we create v1.8.0 release notes -->

For more information, see [our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.8.0). 
Qdrant is an open source project. We welcome your contributions, as [issues](https://github.com/qdrant/qdrant/issues), or even better, as [pull requests](https://github.com/qdrant/qdrant/pulls)!
