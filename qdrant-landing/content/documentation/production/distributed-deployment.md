---
title: Distributed Deployment
weight: 1
aliases:
  - ../distributed_deployment
  - /guides/distributed_deployment
  - distributed_deployment
---

# Distributed Deployment 

Since version v0.8.0 Qdrant supports a distributed deployment mode.
In this mode, multiple Qdrant services communicate with each other to distribute the data across the peers to extend the storage capabilities and increase stability.

## How many Qdrant nodes should I run?

The ideal number of Qdrant nodes depends on how much you value cost-saving, resilience, and performance/scalability in relation to each other.

- **Prioritizing cost-saving**: If cost is most important to you, run a single Qdrant node. This is not recommended for production environments. Drawbacks:
  - Resilience: Users will experience downtime during node restarts, and recovery is not possible unless you have backups or snapshots.
  - Performance: Limited to the resources of a single server.

- **Prioritizing resilience**: If resilience is most important to you, run a Qdrant cluster with three or more nodes and two or more shard replicas. Clusters with three or more nodes and replication can perform all operations even while one node is down. Additionally, they gain performance benefits from load-balancing and they can recover from the permanent loss of one node without the need for backups or snapshots (but backups are still strongly recommended). This is most recommended for production environments. Drawbacks:
   - Cost: Larger clusters are more costly than smaller clusters, which is the only drawback of this configuration.

- **Balancing cost, resilience, and performance**: Running a two-node Qdrant cluster with replicated shards allows the cluster to respond to most read/write requests even when one node is down, such as during maintenance events. Having two nodes also means greater performance than a single-node cluster while still being cheaper than a three-node cluster. Drawbacks:
   - Resilience (uptime): The cluster cannot perform operations on collections when one node is down. Those operations require >50% of nodes to be running, so this is only possible in a 3+ node cluster. Since creating, editing, and deleting collections are usually rare operations, many users find this drawback to be negligible.
   - Resilience (data integrity): If the data on one of the two nodes is permanently lost or corrupted, it cannot be recovered aside from snapshots or backups. Only 3+ node clusters can recover from the permanent loss of a single node since recovery operations require >50% of the cluster to be healthy.
   - Cost: Replicating your shards requires storing two copies of your data.
   - Performance: The maximum performance of a Qdrant cluster increases as you add more nodes.

In summary, single-node clusters are best for non-production workloads, replicated 3+ node clusters are the gold standard, and replicated 2-node clusters strike a good balance.

## Enabling distributed mode in self-hosted Qdrant

To enable distributed deployment - enable the cluster mode in the [configuration](/documentation/guides/configuration/) or using the ENV variable: `QDRANT__CLUSTER__ENABLED=true`.

```yaml
cluster:
  # Use `enabled: true` to run Qdrant in distributed deployment mode
  enabled: true
  # Configuration of the inter-cluster communication
  p2p:
    # Port for internal communication between peers
    port: 6335

  # Configuration related to distributed consensus algorithm
  consensus:
    # How frequently peers should ping each other.
    # Setting this parameter to lower value will allow consensus
    # to detect disconnected node earlier, but too frequent
    # tick period may create significant network and CPU overhead.
    # We encourage you NOT to change this parameter unless you know what you are doing.
    tick_period_ms: 100
```

By default, Qdrant will use port `6335` for its internal communication.
All peers should be accessible on this port from within the cluster, but make sure to isolate this port from outside access, as it might be used to perform write operations.

Additionally, you must provide the `--uri` flag to the first peer so it can tell other nodes how it should be reached:

```bash
./qdrant --uri 'http://qdrant_node_1:6335'
```

Subsequent peers in a cluster must know at least one node of the existing cluster to synchronize through it with the rest of the cluster.

To do this, they need to be provided with a bootstrap URL:

```bash
./qdrant --bootstrap 'http://qdrant_node_1:6335'
```

The URL of the new peers themselves will be calculated automatically from the IP address of their request.
But it is also possible to provide them individually using the `--uri` argument.

```text
USAGE:
    qdrant [OPTIONS]

OPTIONS:
        --bootstrap <URI>
            Uri of the peer to bootstrap from in case of multi-peer deployment. If not specified -
            this peer will be considered as a first in a new deployment

        --uri <URI>
            Uri of this peer. Other peers should be able to reach it by this uri.

            This value has to be supplied if this is the first peer in a new deployment.

            In case this is not the first peer and it bootstraps the value is optional. If not
            supplied then qdrant will take internal grpc port from config and derive the IP address
            of this peer on bootstrap peer (receiving side)

```

After a successful synchronization you can observe the state of the cluster through the [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status):

```http
GET /cluster
```

Example result:

```json
{
  "result": {
    "status": "enabled",
    "peer_id": 11532566549086892000,
    "peers": {
      "9834046559507417430": {
        "uri": "http://172.18.0.3:6335/"
      },
      "11532566549086892528": {
        "uri": "http://qdrant_node_1:6335/"
      }
    },
    "raft_info": {
      "term": 1,
      "commit": 4,
      "pending_operations": 1,
      "leader": 11532566549086892000,
      "role": "Leader"
    }
  },
  "status": "ok",
  "time": 5.731e-06
}
```

Note that enabling distributed mode does not automatically replicate your data. See the section on [making use of a new distributed Qdrant cluster](#making-use-of-a-new-distributed-qdrant-cluster) for the next steps.

## Enabling distributed mode in Qdrant Cloud

For best results, first ensure your cluster is running Qdrant v1.7.4 or higher. Older versions of Qdrant do support distributed mode, but improvements in v1.7.4 make distributed clusters more resilient during outages.

In the [Qdrant Cloud console](https://cloud.qdrant.io/), click "Scale Up" to increase your cluster size to >1. Qdrant Cloud configures the distributed mode settings automatically.

After the scale-up process completes, you will have a new empty node running alongside your existing node(s). To replicate data into this new empty node, see the next section.

## Making use of a new distributed Qdrant cluster

When you enable distributed mode and scale up to two or more nodes, your data does not move to the new node automatically; it starts out empty. To make use of your new empty node, do one of the following:

* Create a new replicated collection by setting the [replication_factor](/documentation/guides/replication/#replication-factor) to 2 or more and setting the [number of shards](/documentation/guides/sharding/#choosing-the-right-number-of-shards) to a multiple of your number of nodes.
* If you have an existing collection which does not contain enough shards for each node, you must create a new collection as described in the previous bullet point.
* If you already have enough shards for each node and you merely need to replicate your data, follow the directions for [creating new shard replicas](/documentation/guides/replication/#creating-new-shard-replicas).
* If you already have enough shards for each node and your data is already replicated, you can move data (without replicating it) onto the new node(s) by [moving shards](/documentation/guides/sharding/#moving-shards).

## Raft Overview

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to maintain consistency regarding the cluster topology and the collections structure.

Operations on points, on the other hand, do not go through the consensus infrastructure.
Qdrant is not intended to have strong transaction guarantees, which allows it to perform point operations with low overhead.
In practice, it means that Qdrant does not guarantee atomic distributed updates but allows you to wait until the [operation is complete](/documentation/concepts/points/#awaiting-result) to see the results of your writes.

Operations on collections, on the contrary, are part of the consensus which guarantees that all operations are durable and eventually executed by all nodes.
In practice it means that a majority of nodes agree on what operations should be applied before the service will perform them.

Practically, it means that if the cluster is in a transition state - either electing a new leader after a failure or starting up, the collection update operations will be denied.

You may use the cluster [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status) to check the state of the consensus.

See [Advanced Deployment](/documentation/production/advanced-deployment/) for more details on Raft internals and consensus checkpointing. 