---
draft: false
id: 2
title: How vector search should be benchmarked?
weight: 1
---

# Benchmarking Vector Databases

At Qdrant, performance is the top-most priority. We always make sure that we use system resources efficiently so you get the **fastest and most accurate results at the cheapest cloud costs**. So all of our decisions from [choosing Rust](/articles/why-rust), [io optimisations](/articles/io_uring), [serverless support](/articles/serverless), [binary quantization](/articles/binary-quantization), to our [fastembed library](/articles/fastembed) are all based on our principle. In this article, we will compare how Qdrant performs against the other vector search engines.

Here are the principles we followed while designing these benchmarks:

- We do comparative benchmarks, which means we focus on **relative numbers** rather than absolute numbers.
- We use affordable hardware, so that you can reproduce the results easily.
- We run benchmarks on the same exact machines to avoid any possible hardware bias.
- All the benchmarks are [open-sourced](https://github.com/qdrant/vector-db-benchmark), so you can contribute and improve them.

<details>
<summary> Scenarios we tested </summary>

1. Upload & Search benchmark on single node [Benchmark](/benchmarks/single-node-speed-benchmark/)
2. Filtered search benchmark - [Benchmark](/benchmarks/#filtered-search-benchmark)
3. Memory consumption benchmark - Coming soon
4. Cluster mode benchmark - Coming soon

</details>

</br>

Some of our experiment design decisions are described in the [F.A.Q Section](/benchmarks/#benchmarks-faq).
Reach out to us on our [Discord channel](https://qdrant.to/discord) if you want to discuss anything related Qdrant or these benchmarks.
