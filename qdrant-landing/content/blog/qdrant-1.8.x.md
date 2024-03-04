---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Sparse vector performance, Text index loading optimization, Text immutability, Dynamic CPU saturation" 
preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
title_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
small_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
date: 2024-03-03T11:12:00-08:00
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
You'll see significant performance improvements. We've addressed issues with:

<!-- Shard deltas (deferred to v1.9) -->
- Sparse vectors
- Dynamic CPU saturation
- Text immutability
- Text loading optimization

We've also made [minor improvements](#minor-improvements-and-new-features] to our APIs. In addition, we no longer need to convert dates to UNIX timestamps. 

Did we miss something? We rely on your feedback to drive our development. We
welcome your contributions, especially in our [Discord community](https://qdrant.to/discord). Join us, introduce yourself, and help us build the best vector search engine!

## Improved sparse vector performance

The primary focus of Qdrant is performance. It's why we build our work in Rust.
It helps us optimize performance in "real-world" situations.

For our v1.7.0 release we introduced sparse vectors. As noted in our [Qdrant v.1.7.0 release announcement](https://qdrant.tech/articles/qdrant-1.7.x/#sparse-vectors), we store sparse vectors differently and keep the non-zero dimensions.

As an additional improvement, we used the [NeurIPS 2023 datasets](https://big-ann-benchmarks.com/neurips23.html) which are a standard to evaluate vector search algorithms.

We optimized our search to improve throughput by a factor of 16.

This is based on our test benchmarks in this [Sparse vectors benchmark](https://github.com/qdrant/sparse-vectors-benchmark) repository. For those benchmarks, we ran
the full query dataset againt a system with 8 CPUs.

Based on our tests, you can expect significant performance improvements. 
The performance that we see is shown on the following two-dimensional histogram:

![Histogram with increasing latency for higher query dimensions](/blog/qdrant-1.8.x/neurIPS_bench_example.png)

The colors within the scatter plot show the frequency of the results. The "red"
points show the highest frequency.

## Optimized CPU use

We continue to optimize our search. With dynamic CPU saturation we've increased
indexing speed, with no impact on search requests.

This version introduces an `optimizer_cpu_budget` parameter to control the maximum number of CPUs used
for indexing. For most users, the default `optimizer_cpu_budget` works well. It allocates more CPU resources
for building indexes faster, while reserving resources to handle searches.

![Allocation of CPU resources](/blog/qdrant-1.8.x/cpu-management.png)

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

## Minor improvements and new features

Beyond these enhancements, Qdrant v1.8.0 adds and improves several features:

<!-- Requires merging https://github.com/qdrant/landing_page/pull/631 -->
1. Order results by payload value with the Scroll API. For more information,
   see how you can [Order points by a payload key](/documentation/concepts/points/#order-points-by-a-payload-key).
1. [Implement datetime support for the payload index](https://github.com/qdrant/qdrant/issues/3320)
   We no longer need to convert dates to UNIX timestamps.
1. Add `/exists` to the `/collections/{collection_name}` endpoint for a 
   true/false response to verify if a collection is there ([PR#3472](https://github.com/qdrant/qdrant/pull/3472)).
1. Include `min_should` match feature for a condition to be `true` ([PR#3331](https://github.com/qdrant/qdrant/pull/3466/)).
1. Improve `set_payload` API, adds ability to modify nested fields ([PR#3548](https://github.com/qdrant/qdrant/pull/3548)).

## Release notes
<!-- The link won't work until we create v1.8.0 release notes -->

For more information, see [our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.8.0). 
Qdrant is an open source project. We welcome your contributions, as [issues](https://github.com/qdrant/qdrant/issues), or even better, as [pull requests](https://github.com/qdrant/qdrant/pulls)!
