---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Shard transfer deltas, Sparse vector performance, Text index loading optimization, Text immutability, Dynamic CPU saturation" 
preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
title_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
small_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
date: 2024-02-26T11:12:00-08:00
author: Mike Jang
featured: false 
tags:
  - vector search
  - new features
  - shard diff transfer
  - sparse vector performance
  - text immutability
  - text loading optimization
  - dymamic CPU saturation
weight: 0 # Change this weight to change order of posts
---

Today, we are pleased to announce the release of [Qdrant 1.8.0](https://github.com/qdrant/qdrant/releases/tag/v1.8.0).
We've optimized performance in a number of ways. We've addressed issues with:

<!-- Shard deltas (deferred to v1.9) -->
- Sparse vectors
- Text immutability
- Text loading optimization
- Dynamic CPU saturation

We've also added <!-- TBD -->.

Did we miss something? We rely on your feedback to drive our development. We
welcome your contributions, especially in our [Discord community](https://qdrant.to/discord). Join us, introduce yourself, and help us build the best vector search engine!

## Improved sparse vector performance

The primary focus of Qdrant is performance. It's why we build our work in Rust.
We also want to optimze performance in "real-world" situations.

We used the [NeurIPS 2023 datasets](https://big-ann-benchmarks.com/neurips23.html). We've optimized our search to improve throughput by a factor of 16.
<!-- a factor of 16 was a goal stated internally. I don't know if we got there. -->

We set up test benchmarks in our [Sparse vectors benchmark](https://github.com/qdrant/sparse-vectors-benchmark) repository. For our benchmarks, we use
moderately-sized Azure instances with separate clients and servers:
<!-- Arnaud isn't sure we should include these details. I think they're useful for our readers. (I've removed the Azure configuration bits described elsewhere.)  -->

| System | vCPU | RAM (GB) |
|--------|------|----------|
| Server | 8    | 32       |
| Client | 4    | 16       |

We created the test collection with:

- 8 Sparse NeruIPS segments
- `index.on_disk=false`

Based on those datasets, we found the following two-dimentional histogram of
latency per query dimension count:

![Histogram with increasing latency for higher query dimensions](/blog/qdrant-1.8.x/neurIPS_bench_example.png)

The colors within the scatter plot show the frequency of the results. The "red"
points show the highest frequency.

While this is a two-dimensional graph, the dataset represents over 100 dimensions! 

## Optimize RAM with immutable text fields

We have optimized the required RAM with immutable text fields. We minimize
what is stored. Based on our tests, we've reduced by the amount of required
RAM by around 10%. 

Mutable documents require additional RAM.

## Optimized text field loading

Insertion in increasing order 

Avoid binary search while loading

## Dynamic CPU saturation internals

We continue to optimize our search to minimize the load on your hardware. One
part of that is on CPUs. On a typical system, loads on each CPU is relatively
low, which is a waste of resources.

With dynamic CPU saturation, we set an `optimizer_cpu_budget` to drive the
number of CPU _cores_ to saturate with optimization tasks. Specifically, if the
value is:

- `0`: Qdrant keeps one or more CPU cores unallocated
- A negative number: Qdrant subtracts this from the number of available CPU cores
- A positive number: Qdrant assigns this exact number of CPU cores to your configuration

The default value for `optimizer_cpu_budget` is `0`. For most users, the default
works well. It allocates most CPUs for building indexes, while saving some CPUs
to handle searches.

With our [Collections](/documentation/concepts/collections/) API, you can 
configure how Qdrant saturates the CPUs in your configuration. 

As shown in our API documenmtation, `max_indexing_threads` is a part of the
`hnsw_config` parameter. For more information see our 
[Create collection](ihttps://qdrant.github.io/qdrant/redoc/index.html#tag/collections/operation/create_collection) REST call.

The `max_indexing_threads` is the number of parallel threads used by Qdrant
to build your index in the background. The options are:

- `null`: No limit. Dynamically saturate your CPUs
- `0`: Automatically select between 8 and 16 CPUs, to minimize the chance of
  building broken or inefficient HNSW graphs.

If you have more CPUs, you could try different configurations. For example:

- Assume you have 128 CPU cores. You have also set up 4 Qdrant instances. If
you set `max_indexing_threads` to 32, you've allocated 25% of available CPU
cores for indexing and optimization. 
- If you need to reserve CPUs for important ongoing searches, you can set
`max_indexing_threads` to a negative value. Qdrant then reserves those cores
for searches.
