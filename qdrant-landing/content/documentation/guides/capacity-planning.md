---
title: Capacity Planning
weight: 11
aliases:
  - capacity
  - /documentation/cloud/capacity-sizing
---
# Capacity Planning

When setting up your cluster, you'll need to figure out the right balance of **RAM** and **disk storage**. The best setup depends on a few things:

- How many vectors you have and their dimensions.
- The amount of payload data you're using and their indexes.
- What data you want to store in memory versus on disk.
- Your cluster's replication settings.
- Whether you're using quantization and how you’ve set it up.

## Calculating RAM size 

You should store frequently accessed data in RAM for faster retrieval. If you want to keep all vectors in memory for optimal performance, you can use this rough formula for estimation:

```text
memory_size = number_of_vectors * vector_dimension * 4 bytes * 1.5
```

At the end, we multiply everything by 1.5. This extra 50% accounts for metadata (such as indexes and point versions) and temporary segments created during optimization.

Let's say you want to store 1 million vectors with 1024 dimensions:

```text
memory_size = 1,000,000 * 1024 * 4 bytes * 1.5 
```
The memory_size is approximately 6,144,000,000 bytes, or about 5.72 GB.

Depending on the use case, large datasets can benefit from reduced memory requirements via [quantization](/documentation/guides/quantization/).

## Calculating payload size

This is always different. The size of the payload depends on the [structure and content of your data](/documentation/concepts/payload/#payload-types). For instance:

- **Text fields** consume space based on length and encoding (e.g. a large chunk of text vs a few words).
- **Floats** have fixed sizes of 8 bytes for `int64` or `float64`.
- **Boolean fields** typically consume 1 byte. 

<aside role="alert">
    The easiest way to calculate your payload size is to use a JSON size calculator.
</aside>

Calculating total payload size is similar to vectors. We have to multiply it by 1.5 for back-end indexing processes.

```text
total_payload_size = number_of_points * payload_size * 1.5 
```

Let's say you want to store 1 million points with JSON payloads of 5KB:

```text
total_payload_size = 1,000,000 * 5KB * 1.5 
```
The total_payload_size is approximately 5,000,000 bytes, or about 4.77 GB.

## Choosing disk over RAM

For optimal performance, you should store only frequently accessed data in RAM. The rest should be offloaded to the disk. For example, extra payload fields that you don't use for filtering can be stored on disk. 

Only [indexed fields](/documentation/concepts/indexing/#payload-index) should be stored in RAM. You can read more about payload storage in the [Storage](/documentation/concepts/storage/#payload-storage) section.

### Storage-focused configuration

If your priority is to handle large volumes of vectors with average search latency, it's recommended to configure [memory-mapped (mmap) storage](/documentation/concepts/storage/#configuring-memmap-storage). In this setup, vectors are stored on disk in memory-mapped files, while only the most frequently accessed vectors are cached in RAM.

The amount of available RAM greatly impacts search performance. As a general rule, if you store half as many vectors in RAM, search latency will roughly double.

Disk speed is also crucial. [Contact us](/documentation/support/) if you have specific requirements for high-volume searches in our Cloud.

### Subgroup-oriented configuration

If your use case involves splitting vectors into multiple collections or subgroups based on payload values (e.g., serving searches for multiple users, each with their own subset of vectors), memory-mapped storage is recommended.

In this scenario, only the active subset of vectors will be cached in RAM, allowing for fast searches for the most recent and active users. You can estimate the required memory size as:

```text
memory_size = number_of_active_vectors * vector_dimension * 4 bytes * 1.5
```

Please refer to our [multitenancy](/documentation/guides/multiple-partitions/) documentation for more details on partitioning data in a Qdrant.

## Scaling disk space in Qdrant Cloud

Clusters supporting vector search require substantial disk space compared to other search systems. If you're running low on disk space, you can use the UI at [cloud.qdrant.io](https://cloud.qdrant.io/) to **Scale Up** your cluster.

<aside role="status">Note: If you increase disk space via the Qdrant UI, you cannot reduce it later.</aside>

When running low on disk space, consider the following benefits of scaling up:

- **Larger Datasets**: Supports larger datasets, which can improve the relevance and quality of search results.
- **Improved Indexing**: Enables the use of advanced indexing strategies like HNSW.
- **Caching**: Enhances speed by having more RAM, allowing more frequently accessed data to be cached.
- **Backups and Redundancy**: Facilitates more frequent backups, which is a key advantage for data safety.

Always remember to add 50% of the vector size. This would account for things like indexes and auxiliary data used during operations such as vector insertion, deletion, and search. Thus, the estimated memory size including metadata is:

```text
total_vector_size = number_of_dimensions * 4 bytes * 1.5
```

**Disclaimer**

The above calculations are estimates at best. If you're looking for more accurate numbers, you should always test your data set in practice.