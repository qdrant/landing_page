---
title: Configure Clusters
weight: 55
---

# Configure Qdrant Cloud Clusters

Qdrant Cloud offers several advanced configuration options to optimize clusters for your specific needs. You can access these options from the Cluster Details page in the Qdrant Cloud console.

The cloud platform does not expose all [configuration options](/documentation/guides/configuration/) available in Qdrant. We have selected the relevant options that are explained in detail below.

In adition the cloud platform automatically configures the following settings for your cluster to ensure optimal performance and reliability:

* The maximum number of collections in a cluster is set to 1000. Larger numbers of collections lead to performance degradation. For more information see [Multitenancy](/documentation/guides/multiple-partitions/).
* Strict mode is activated by default for new collections enforcing that all filters being used in retrieve and udpate queries are indexed. This improves performance and reliability. You can disable this individually for each collection. For more information see [Strict Mode](/documentation/guides/administration/#strict-mode).
* The cluster mode is automatically enabled to allow distributed deployments and horizontal scaling.

## Collection Defaults

You can set default values for the configuration of new collections in your cluster. These defaults will be used when creating a new collection, unless you override them in the collection creation request.

You can configure the default *Replication Factor*, the default *Write Consistency Factor*, and if vectors should be stored on disk only, instead of being cached in RAM.

Refer to [Qdrant Configuration](/documentation/guides/configuration/#configuration-options) for more details.

## Advanced Optimizations

You can change the *Optimzer CPU Budget* and the *Async Scorer* configurations for your cluster. These advanced settings will have an impact on performance and reliability. We recommend using the default values unless you are confident they are required for your use case.

See [Qdrant under the hood: io_uring](/articles/io_uring/#and-what-about-qdrant) and [Large Scale Search](/documentation/database-tutorials/large-scale-search/) for more details.

## Client IP Restrictions

If configured, only the chosen IP ranges will be allowed to access the cluster. This is useful for securing your cluster and ensuring that only clients coming from trusted networks can connect to it.

## Restart Mode

The cloud platform will automatically choose the optimal restart mode during version upgrades or maintenance for your cluster. If you have a multi-node cluster and one or more collections with a replication factor of at least 2, the cloud platform will use the rolling restart mode. This means that nodes in the cluster will be restarted one at a time, ensuring that the cluster remains available during the restart process.

If you have a multi-node cluster, but all collections have a replication factor of 1, the cloud platform will use the parallel restart mode. This means that nodes in the cluster will be restarted simultaneously, which will result in a short downtime period, but will be faster than a rolling restart.

It is possible to override your cluster's default restart mode in the advanced configuration section of the Cluster Details page.

## Shard Rebalancing

When you scale your cluster horizontally, the cloud platform will automatically rebalance shards across all nodes in the cluster, ensuring that data is evenly distributed. This is done to ensure that all nodes are utilized and that the performance of the cluster is optimal.

Qdrant Cloud offers three strategies for shard rebalancing:

* `by_count_and_size` (default): This strategy will rebalance the shards based on the number of shards and their size. It will ensure that all nodes have the same number of shards and that shard sizes are evenly distributed across nodes.
* `by_count`: This strategy will rebalance the shards based on the number of shards only. It will ensure that all nodes have the same number of shards, but shard sizes may not be balanced evenly across nodes.
* `by_size`: This strategy will rebalance the shards based on their size only. It will ensure that shards are evenly distributed across nodes by size, but the number of shards may not be even across all nodes.

You can deactivate automatic shard rebalancing by deselecting the `rebalancing_strategy` option. This is useful if you want to manually control the shard distribution across nodes.
