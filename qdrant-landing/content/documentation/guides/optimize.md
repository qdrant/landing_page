---
title: Optimize Performance
weight: 11
aliases:
  - ../tutorials/optimize
---

# Optimizing Qdrant Performance: Three Scenarios

Different use cases require different balances between memory usage, search speed, and precision. Qdrant is designed to be flexible and customizable so you can tune it to your specific needs. 

This guide will walk you three main optimization strategies:

- High Speed Search & Low Memory Usage
- High Precision & Low Memory Usage
- High Precision & High Speed Search

![qdrant resource tradeoffs](/docs/tradeoff.png)

## 1. High-Speed Search with Low Memory Usage

To achieve high search speed with minimal memory usage, you can store vectors on disk while minimizing the number of disk reads. Vector quantization is a technique that compresses vectors, allowing more of them to be stored in memory, thus reducing the need to read from disk.

To configure in-memory quantization, with on-disk original vectors, you need to create a collection with the following parameters:

- `on_disk`: Stores original vectors on disk.
- `quantization_config`: Compresses quantized vectors to `int8` using the `scalar` method.
- `always_ram`: Keeps quantized vectors in RAM.

{{< code-snippet path="/documentation/headless/snippets/create-collection/scalar-quantization-in-ram/" >}}

### Disable Rescoring for Faster Search (optional)

This is completely optional. Disabling rescoring with search `params` can further reduce the number of disk reads. Note that this might slightly decrease precision.

{{< code-snippet path="/documentation/headless/snippets/query-points/disable-quantization-rescoring/" >}}

## 2. High Precision with Low Memory Usage

If you require high precision but have limited RAM, you can store both vectors and the HNSW index on disk. This setup reduces memory usage while maintaining search precision.

To store the vectors `on_disk`, you need to configure both the vectors and the HNSW index:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-vectors-and-hnsw-on-disk/" >}}

### Improving Precision

Increase the `ef` and `m` parameters of the HNSW index to improve precision, even with limited RAM:

```json
...
"hnsw_config": {
    "m": 64,
    "ef_construct": 512,
    "on_disk": true
}
...
```

**Note:** The speed of this setup depends on the disk’s IOPS (Input/Output Operations Per Second).</br>
You can use [fio](https://gist.github.com/superboum/aaa45d305700a7873a8ebbab1abddf2b) to measure disk IOPS.

## 3. High Precision with High-Speed Search

For scenarios requiring both high speed and high precision, keep as much data in RAM as possible. Apply quantization with re-scoring for tunable accuracy.

Here is how you can configure scalar quantization for a collection:

{{< code-snippet path="/documentation/headless/snippets/create-collection/scalar-quantization-and-vectors-in-ram/" >}}

### Fine-Tuning Search Parameters

You can adjust search parameters like `hnsw_ef` and `exact` to balance between speed and precision:

**Key Parameters:**
- `hnsw_ef`: Number of neighbors to visit during search (higher value = better accuracy, slower speed).
- `exact`: Set to `true` for exact search, which is slower but more accurate. You can use it to compare results of the search with different `hnsw_ef` values versus the ground truth.

{{< code-snippet path="/documentation/headless/snippets/query-points/with-params/" >}}

## Balancing Latency and Throughput

When optimizing search performance, latency and throughput are two main metrics to consider:
- **Latency:** Time taken for a single request.
- **Throughput:** Number of requests handled per second.

The following optimization approaches are not mutually exclusive, but in some cases it might be preferable to optimize for one or another.

### Minimizing Latency

To minimize latency, you can set up Qdrant to use as many cores as possible for a single request.
You can do this by setting the number of segments in the collection to be equal to the number of cores in the system. 

In this case, each segment will be processed in parallel, and the final result will be obtained faster.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-high-number-of-segments/" >}}
### Maximizing Throughput

To maximize throughput, configure Qdrant to use as many cores as possible to process multiple requests in parallel.

To do that, use fewer segments (usually 2) of larger size (default 200Mb per segment) to handle more requests in parallel.

Large segments benefit from the size of the index and overall smaller number of vector comparisons required to find the nearest neighbors. However, they will require more time to build the HNSW index.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-large-segments/" >}}

## Summary

By adjusting configurations like vector storage, quantization, and search parameters, you can optimize Qdrant for different use cases:
- **Low Memory + High Speed:** Use vector quantization.
- **High Precision + Low Memory:** Store vectors and HNSW index on disk.
- **High Precision + High Speed:** Keep data in RAM, use quantization with re-scoring.
- **Latency vs. Throughput:** Adjust segment numbers based on the priority.

Choose the strategy that best fits your use case to get the most out of Qdrant’s performance capabilities.