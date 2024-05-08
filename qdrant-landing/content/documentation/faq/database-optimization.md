---
title: Database Optimization
weight: 3
---

## Database Optimization Strategies

### How do I reduce memory usage?

The primary source of memory usage vector data. There are several ways to address that:

- Configure [Quantization](../../guides/quantization/) to reduce the memory usage of vectors.
- Configure on-disk vector storage

The choice of the approach depends on your requirements.
Read more about [configuring the optimal](../../tutorials/optimize/) use of Qdrant.

### How do you choose machine configuration?

There are two main scenarios of Qdrant usage in terms of resource consumption:

- **Performance-optimized** -- when you need to serve vector search as fast (many) as possible. In this case, you need to have as much vector data in RAM as possible. Use our [calculator](https://cloud.qdrant.io/calculator) to estimate the required RAM.
- **Storage-optimized** -- when you need to store many vectors and minimize costs by compromising some search speed. In this case, pay attention to the disk speed instead. More about it in the article about [Memory Consumption](../../../articles/memory-consumption/).

### I configured on-disk vector storage, but memory usage is still high. Why?

Firstly, memory usage metrics as reported by `top` or `htop` may be misleading. They are not showing the minimal amount of memory required to run the service.
If the RSS memory usage is 10 GB, it doesn't mean that it won't work on a machine with 8 GB of RAM.

Qdrant uses many techniques to reduce search latency, including caching disk data in RAM and preloading data from disk to RAM.
As a result, the Qdrant process might use more memory than the minimum required to run the service.

> Unused RAM is wasted RAM

If you want to limit the memory usage of the service, we recommend using [limits in Docker](https://docs.docker.com/config/containers/resource_constraints/#memory) or Kubernetes.

### My requests are very slow or time out. What should I do?

There are several possible reasons for that:

- **Using filters without payload index** -- If you're performing a search with a filter but you don't have a payload index, Qdrant will have to load whole payload data from disk to check the filtering condition. Ensure you have adequately configured [payload indexes](../../concepts/indexing/#payload-index).
- **Usage of on-disk vector storage with slow disks** -- If you're using on-disk vector storage, ensure you have fast enough disks. We recommend using local SSDs with at least 50k IOPS. Read more about the influence of the disk speed on the search latency in the article about [Memory Consumption](../../../articles/memory-consumption/).
- **Large limit or non-optimal query parameters** -- A large limit or offset might lead to significant performance degradation. Please pay close attention to the query/collection parameters that significantly diverge from the defaults. They might be the reason for the performance issues.

### How can I optimize optimizers configuration settings for better accuracy and speed, especially for large-scale collections?

To optimize optimizers config in Qdrant for better accuracy and speed, consider the following:

- For low memory footprint with high-speed search, utilize vector quantization with disk storage for vectors and in-memory quantized vectors. Configure memmap_threshold and always_ram accordingly.
- To prioritize high precision with a low memory footprint, enable on-disk vectors and HNSW index. Adjust HNSW parameters for precision while considering disk IOPS.
- For high precision with high-speed search, focus on keeping data in RAM. Utilize quantization with re-scoring and adjust search-time parameters like hnsw_ef for accuracy and speed balance.
- Balance latency vs. throughput based on your needs. Configure the number of segments to utilize CPU cores effectively for either minimizing latency or maximizing throughput.
- Explore different quantization methods like scalar, binary, and product quantization based on accuracy, speed, and compression requirements.
- Fine-tune quantization parameters such as quantile for scalar quantization to optimize search precision and memory usage.
- Adjust storage modes to balance between memory footprint and search speed, considering factors like disk reads and storage type (RAM, SSD, or HDD).

Read more about [optimizing](../../guides/optimize/), and [quantization](../../guides/quantization/) in Qdrant.

### How can Qdrant I enhance search performance when applying filters to their queries?

To improve search performance with filters in Qdrant:

- **Utilize Payload Index:** Implement payload indexes for fields used in filtering conditions. This enhances point retrieval speed based on filter criteria.
- **Consider Full-text Index:** For string payloads, utilize full-text indexes for word or phrase presence filtering, adjusting tokenization parameters as needed.
- **Parameterized Integer Index:** Opt for parameterized integer indexes for specific range filter requirements, balancing between lookup and range operations.
- **Leverage Vector Index:** Employ HNSW for dense vector indexing, adjusting parameters like `m` and `ef_construct` for improved search accuracy and efficiency.
- **Sparse Vector Index:** For sparse vectors, ensure efficient indexing and search mechanisms. Configure memory or disk storage based on segment characteristics and query patterns.
- **Filtrable Index Extension:** Enhance HNSW graph with additional edges based on payload values to optimize search efficiency with varying filter stringency.

By strategically combining these indexing techniques, you can address performance issues and achieve faster search results with applied filters in Qdrant.
Read more about [indexing](../../concepts/indexing/) in Qdrant.
