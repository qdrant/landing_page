---
title: Production Checklist
weight: 80
---

# Things to Check Before Taking Qdrant into Production

A practical checklist to ensure Qdrant is optimized, stable, and ready to handle real-world load.

---

## 1. Choose Your Optimization Strategy

Pick the right balance before you configure anything else. You can only optimize for two of three dimensions: **Speed**, **Memory**, and **Precision**.

![qdrant resource tradeoffs](/docs/tradeoff.png)

| Intended Result | Optimization Strategy |
|---|---|
| High Precision + Low Memory | On-Disk Indexing |
| Low Memory + High Speed | Quantization |
| High Precision + High Speed | RAM Storage + Quantization |

---

## 2. Sharding & Multitenancy

Architect for scale from day one. Retrofitting these patterns onto an existing deployment is costly.

- **Ensure you have enough shards to scale.**
Qdrant  [scales horizontally](/documentation/operations/distributed_deployment/) through [sharding](/documentation/operations/distributed_deployment/#sharding). Plan for enough shards to distribute your data and load across the nodes in your cluster. A one-shard, one-collection setup cannot scale beyond a single node. Choosing a sharding strategy upfront is critical to avoid costly resharding operations later.

- **Ensure you don't have too many shards.** While sharding is essential for scale, having too many shards can lead to performance degradation. Consider using multitenancy to logically separate data within a single collection, reducing the number of shards needed (see the next point).

- **Use multitenancy instead of separate collections per user.**
[Multitenancy](/documentation/manage-data/multitenancy/) enables you to logically isolate data for different users or groups within the same collection. This approach scales better than per-tenant collections as the number of tenants grows.

- **Set up load balancing across nodes.**
  Distribute incoming requests evenly across cluster nodes to ensure consistent performance. Without load balancing, a single overloaded node can cause timeouts across your entire application.

---

## 3. Quantization

Compress vectors to reduce memory footprint. [Quantization](/documentation/manage-data/quantization/) is one of the most impactful changes you can make before going to production.

- **Evaluate whether [Scalar Quantization](/documentation/manage-data/quantization/#scalar-quantization) fits your use case.**
Scalar quantization converts `float32` to `uint8`, reducing memory by a factor of 4. Accuracy loss is typically below 1%. The right default for most production workloads, especially with high-dimensional vectors.

- **Consider [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization) for maximum compression.**
Binary quantization reduces memory by a factor of 32 and can speed up searches by up to a factor of 40. Best suited for compatible high-dimensional embedding models (for example, OpenAI `text-embedding-ada-002` or Cohere `embed-english-v2.0`). Plan for rescoring or oversampling to manage precision loss.

- **Benchmark SLAs after applying quantization.**
Some models produce embeddings that can't be quantized efficiently. Measure precision against your uncompressed baseline before going live. Verify that error rates stay within your acceptable threshold for your specific dataset and query patterns. Rescoring adds latency, so ensure it meets your SLA.

---

## 4. Storage & Hardware

Right-size your RAM, disk type, and storage mode. These decisions are difficult to change once you're in production.

- **Choose between in-memory and on-disk/memmap storage.**
In-memory gives maximum speed, but RAM becomes a bottleneck at scale. [On-disk/memmap](/documentation/manage-data/storage/#configuring-memmap-storage) maps data to disk-backed virtual address space, which is slightly slower but handles datasets larger than physical RAM.

- **Estimate your RAM requirements before provisioning.**
[Calculate](/documentation/operations/capacity-planning/) your full dataset size and add headroom for index overhead.

- **Use SSDs for disk-backed storage, not HDDs.**
SSDs are strongly recommended for workloads involving random reads and writes. HDDs introduce significant latency that can degrade query response times at scale.

- **Keep frequently accessed data in memory.**
Keep hot collections in RAM to minimize disk I/O and speed up query execution. Identify your most-queried collections and prioritize them for in-memory storage.

- **Enable inline storage.**
When storing vectors and the HNSW index on disk, improve search performance by [enabling inline storage](/documentation/operations/optimize/#inline-storage-in-hnsw-index). It makes searches faster by reducing the number of I/O operations, at the cost of 3-4x increased storage usage.

---

## 5. Query Optimization

Ensure your search is fast, accurate, and efficient under production load.

- **Apply payload filters to narrow the search space.**
Searching every data point is inefficient at scale. [Filtering](/documentation/search/filtering/) on specific payload fields can reduce computational load and focus queries on relevant data subsets.

- **Evaluate whether [hybrid search](/documentation/search/hybrid-queries/) fits your use case.**
Combine dense vector search (semantic similarity) with sparse vector search (keyword matching) for higher precision.

- **Rerank for maximum result precision.**
After initial hybrid retrieval, apply late interaction embeddings to [rerank](/documentation/tutorials-search-engineering/reranking-hybrid-search/) results. Reranking can be computationally expensive, so aim for a balance between relevance and speed.

- **Implement batch processing for inserts and queries.**
[Group vector inserts into larger batches](/documentation/manage-data/points/?q=batch#upload-points) rather than individual transactions to reduce write overhead. [Batch multiple queries together](/documentation/search/search/#batch-search-api) to cut round trips to the database.

- **Reduce tail latency with [delayed fan-outs](/documentation/search/low-latency-search/#use-delayed-fan-outs).**
Use the `read_fan_out_delay_ms` parameter to automatically query a second replica if the first one doesn't respond within the required latency threshold.

- **[Query indexed data only](/documentation/search/low-latency-search/#query-indexed-data-only).**
Under heavy write loads, large amounts of data may not be indexed immediately, leading to slower searches. Use `indexed_only` to ensure queries only consider indexed data and `prevent_unoptimized` to prevent the creation of large unoptimized segments.
---

## 6. Index Configuration (HNSW)

Qdrant uses the HNSW (Hierarchical Navigable Small World Graph) algorithm as its [dense vector index](/documentation/manage-data/indexing/#vector-index). Tune these three parameters to match your specific workload:

- **Set `m` (edges per node) appropriately.**
  Higher values improve search accuracy but require more memory and build time. Tune this to match the precision/memory balance you defined in your strategy.

- **Configure `ef_construct` for index build quality.**
  Larger values improve index accuracy at the cost of longer build times. Lock this in before loading your dataset.

- **Set `ef` (search range) for query time.**
  This controls how many neighbors are evaluated per query. Increase it to improve accuracy; lower it to improve latency. Test under expected load before finalizing.

---