---
title: Capacity Planning
weight: 40
aliases:
  - capacity
---

# Capacity Planning

We often get asked about the optimal cluster configuration for serving a specific number of vectors. This depends on various factors and configuration options for your collections. When planning your Qdrant cluster, consider RAM size and Disk storage size.

## Measuring data points

You can measure the size of an individual data point in Qdrant by estimating the space used for both the vector itself and any associated payloads.

### Vector size

Each vector is composed of `n` dimensions, and each dimension is represented by a 4-byte floating-point number (`float32`). Therefore, the size of the vector can be calculated as:

```text
vector_size = number_of_dimensions * 4 bytes
```

For example, if you have a vector with 128 dimensions, the size would be:

```text
vector_size = 128 * 4 bytes = 512 bytes
```

### Payload size

The size of the payload depends on the structure and content of the data. For instance:

- **Text fields** will consume space based on their length and encoding.
- **Numeric fields** (integers, floats) have fixed sizes (e.g., 4 bytes for `int32` or `float32`, 8 bytes for `int64` or `float64`).
- **Boolean fields** typically consume 1 byte.

#### Example calculation
If you have a 128-dimensional vector with some metadata and a simple payload (e.g., a boolean flag and an integer), the approximate size would be:

1. **Vector size**: 
   ```text
   128 * 4 bytes = 512 bytes
   ```

2. **Metadata overhead (50%)**:
   ```text
   512 * 0.5 = 256 bytes
   ```

3. **Payload size**: 
   ```text
   1 byte (boolean) + 4 bytes (int32) = 5 bytes
   ```

4. **Total size**:
   ```text
   512 bytes + 256 bytes + 5 bytes = 773 bytes
   ```


Payloads can be stored on disk while the indexed fields are kept in RAM, reducing the memory footprint but increasing disk space usage.   

### Measuring Size Programmatically
If you want to programmatically determine the size of a collection or its vectors in Qdrant, you can use Qdrant's monitoring tools or query for the size of a collection via the Qdrant API. The size of the collection will be influenced by the number of vectors, the dimensionality, and any payloads.

Let me know if you'd like further details on how to measure this via the API!



## Memory size 

If you need to keep all vectors in memory for maximum performance, a rough formula for estimating the required memory size is:

```text
memory_size = number_of_vectors * vector_dimension * 4 bytes * 1.5
```

The extra 50% accounts for metadata (such as indexes and point versions) and temporary segments created during optimization.

If you need to store payloads along with vectors, it's recommended to store them on disk while keeping only [indexed fields](../../concepts/indexing/#payload-index) in RAM. You can read more about payload storage in the [Storage](../../concepts/storage/#payload-storage) section.

## Storage-focused configuration

If your priority is to handle large volumes of vectors with average search latency, it's recommended to configure [memory-mapped (mmap) storage](../../concepts/storage/#configuring-memmap-storage). In this setup, vectors are stored on disk in memory-mapped files, while only the most frequently accessed vectors are cached in RAM.

The amount of available RAM greatly impacts search performance. As a general rule, if you store half as many vectors in RAM, search latency will roughly double.

Disk speed is also crucial. [Contact us](/documentation/support/) if you have specific requirements for high-volume searches.

## Subgroup-oriented configuration

If your use case involves splitting vectors into multiple collections or subgroups based on payload values (e.g., serving searches for multiple users, each with their own subset of vectors), memory-mapped storage is recommended.

In this scenario, only the active subset of vectors will be cached in RAM, allowing for fast searches for the most recent and active users. You can estimate the required memory size as:

```text
memory_size = number_of_active_vectors * vector_dimension * 4 bytes * 1.5
```

## Disk space

Clusters supporting vector search require substantial disk space. If you're running low on disk space, you can use the UI at [cloud.qdrant.io](https://cloud.qdrant.io/) to **Scale Up** your cluster.

<aside role="status">Note: If you increase disk space via the Qdrant UI, you cannot reduce it later.</aside>

When running low on disk space, consider the following benefits of scaling up:

- **Larger Datasets**: Supports larger datasets, which can improve the relevance and quality of search results.
- **Improved Indexing**: Enables the use of advanced indexing strategies like HNSW (Hierarchical Navigable Small World).
- **Caching**: Enhances speed by allowing frequently accessed data to be cached on disk.
- **Backups and Redundancy**: Facilitates more frequent backups, which is a key advantage for data safety.

On top of this, add 50% of the vector size. This would account for things like indexes and auxiliary data used during operations such as vector insertion, deletion, and search. Thus, the estimated memory size including metadata is:

```text
total_vector_size = number_of_dimensions * 4 bytes * 1.5
```