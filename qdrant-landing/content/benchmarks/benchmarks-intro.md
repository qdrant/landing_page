---
draft: false
id: 2
title: How vector databases should be benchmarked?
weight: 1
---

# Benchmarking vector search databases

At Qdrant, performance is the topmost priority. Starting from the language (Rust), improvements in the HNSW algorithm, to all the design decisions, we always make sure that we use all the resources efficiently so you get the fastest and most accurate results at the cheapest cloud costs. In this blog post, we will compare how Qdrant performs against the other engines.

### Assumptions:
- In any benchmark, the numbers are relative and can vary depending on the machine. But we believe this benchmark is good enough to get a rough idea of the performance of all the engines involved.
- We used the same and cheaply available hardware for each dataset so it's easy to reproduce (discussed later)
- We have tried our best to cover different types of datasets that are practically used in the real world.
- We have tried our best to dive deep into documentation of different vector engines to optimize them. But we are not experts in all of them.
- Configurations matter. That's why we have tried different config combinations for different engines for each of the datasets.
- If you believe you can do better than these numbers, feel free to use our fully open sourced [vector db benchmark](https://github.com/qdrant/vector-db-benchmark) repo. We are more than open to any kind of contributions!


### Benchmark variants:

1. Upload & Search benchmark on single node [Benchmark](/benchmarks/single-node-speed-benchmark/)
    - Required for backend services - **RPS is critical** so we will use 100 threads
    - Required for realtime systems - **Latency is critical** so we will use 1 thread
2. Filtered search benchmark - [Benchmark](/benchmarks/#filtered-search-benchmark)
3. Memory consumption benchmark - Coming soon
4. Cluster mode benchmark - Coming soon

Some of our experiment design decisions are described in the [F.A.Q Section](/benchmarks/#benchmarks-faq).

Reach out to us on our [Discord channel](https://qdrant.to/discord) if you want to discuss anything related Qdrant or these benchmarks.

