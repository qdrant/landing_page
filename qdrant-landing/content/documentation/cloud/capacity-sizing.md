---
title: Configure Size & Capacity
weight: 40
aliases:
  - capacity
---

# Configuring Qdrant Cloud Cluster Capacity and Size

We have been asked a lot about the optimal cluster configuration to serve a number of vectors.
The only right answer is “It depends”.

It depends on a number of factors and options you can choose for your collections.

## Basic configuration

If you need to keep all vectors in memory for maximum performance, there is a very rough formula for estimating the needed memory size looks like this:

```text
memory_size = number_of_vectors * vector_dimension * 4 bytes * 1.5
```

Extra 50% is needed for metadata (indexes, point versions, etc.) as well as for temporary segments constructed during the optimization process.

If you need to have payloads along with the vectors, it is recommended to store it on the disc, and only keep [indexed fields](../../concepts/indexing/#payload-index) in RAM.
Read more about the payload storage in the [Storage](../../concepts/storage/#payload-storage) section.


## Storage focused configuration

If your priority is to serve large amount of vectors with an average search latency, it is recommended to configure [mmap storage](../../concepts/storage/#configuring-memmap-storage).
In this case vectors will be stored on the disc in memory-mapped files, and only the most frequently used vectors will be kept in RAM.

The amount of available RAM will significantly affect the performance of the search.
As a rule of thumb, if you keep 2 times less vectors in RAM, the search latency will be 2 times lower.

The speed of disks is also important. [Let us know](mailto:cloud@qdrant.io) if you have special requirements for a high-volume search.

## Sub-groups oriented configuration


If your use case assumes that the vectors are split into multiple collections or sub-groups based on payload values,
it is recommended to configure memory-map storage.
For example, if you serve search for multiple users, but each of them has an subset of vectors which they use independently.

In this scenario only the active subset of vectors will be kept in RAM, which allows
the fast search for the most active and recent users.

In this case you can estimate required memory size as follows:

```text
memory_size = number_of_active_vectors * vector_dimension * 4 bytes * 1.5
```

## Disk space

Clusters that support vector search require significant disk space. If you're
running low on disk space in your cluster, you can use the UI at
[cloud.qdrant.io](https://cloud.qdrant.io/) to  **Scale Up** your cluster. 

<aside role="status">If you use the Qdrant UI to increase the disk space in your cluster, you
cannot decrease that allocation later.</aside>

If you're running low on disk space, consider the following advantages:

- Larger Datasets: Supports larger datasets. With vector search,
larger datasets can improve the relevance and quality of search results.
- Improved Indexing: Supports the use of indexing strategies such as 
HNSW (Hierarchical Navigable Small World).
- Caching: Improves speed when you cache frequently accessed data on disk.
- Backups and Redundancy: Allows more frequent backups. Perhaps the most important advantage.
