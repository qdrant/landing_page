---
title: Distributed Deployment
weight: 1
aliases:
  - ../distributed_deployment
  - /guides/distributed_deployment
  - distributed_deployment
---

# Distributed Deployment

Starting with Qdrant v0.8.0, you can enable a distributed deployment mode. In this mode, multiple Qdrant services communicate with each other to distribute data across peers, extending storage capabilities and increasing overall stability.

| Section                                                         | Description                                              |
|---------------------------------------------------------------|----------------------------------------------------------|
| [Choosing the Number of Nodes](#how-many-qdrant-nodes-should-i-run) | Cost, resilience, and performance trade-offs.           |
| [Self-Hosted Distributed Mode](#enabling-distributed-mode-in-self-hosted-qdrant) | Enabling and configuring Qdrant locally.                |
| [Qdrant Cloud Distributed Mode](#enabling-distributed-mode-in-qdrant-cloud) | Scaling your cluster in Qdrant Cloud.                   |
| [Using a New Distributed Cluster](#making-use-of-a-new-distributed-qdrant-cluster) | Creating replicas and moving shards.                    |
| [Raft Overview](#raft-overview)                               | The cluster’s consensus mechanism.                      |


## How Many Qdrant Nodes Should I Run?

The ideal number of Qdrant nodes depends on how you balance **cost savings, resilience, and performance or scalability**.

#### Cost-Focused (Single Node)
If minimizing cost is your top priority, you can run a single Qdrant node. However, this setup is not recommended for production environments.  
- Resilience: Users will experience downtime during node restarts, and data recovery depends on having backups or snapshots.  
- Performance: Limited by the resources of a single server.

#### Resilience-Focused (3+ Nodes)
For maximum resilience, run a Qdrant cluster with three or more nodes and at least two shard replicas. Clusters of this size and replication level can continue normal operations even when one node is down. This setup also provides performance benefits through load balancing. If a node is permanently lost, the cluster can recover the data without relying on backups or snapshots (though backups are still strongly recommended). This is the most common recommendation for production environments.  
- Cost: Larger clusters are more expensive, which is the primary downside of this configuration.

#### Balanced (2 Nodes)  
Running a two-node cluster with replicated shards strikes a balance between cost, resilience, and performance. The cluster can continue most read/write operations if one node goes down (e.g., during maintenance). This configuration will be more performant than a single-node cluster and more affordable than a three-node cluster.  
- Resilience (uptime): The cluster cannot perform operations on collections (create, modify, delete) when one node is down, since these operations require a majority (>50%) of nodes to be active (i.e., 3+ nodes).  
- Resilience (data integrity): If one node is permanently lost or corrupted, data cannot be recovered unless you have backups or snapshots. Unlike 3+ node clusters, there is no built-in recovery for the permanent loss of a node.  
- Cost: Storing two copies of the data increases storage costs.  
- Performance: Adding more nodes generally increases maximum cluster throughput.

In summary:
- Single-node clusters are best for non-production workloads.  
- 3+ node clusters with replication are considered the gold standard for production.  
- 2-node clusters provide a middle ground between cost and resilience.

## Enabling Distributed Mode in Self-Hosted Qdrant

To enable distributed deployment, set `cluster.enabled = true` in the [configuration](/documentation/guides/configuration/) or by using the `QDRANT__CLUSTER__ENABLED=true` environment variable:

```yaml
cluster:
  # Use `enabled: true` to run Qdrant in distributed deployment mode
  enabled: true
  # Configuration for inter-cluster communication
  p2p:
    # Port used for internal communication between peers
    port: 6335

  # Configuration related to the distributed consensus algorithm
  consensus:
    # Frequency for peers to ping each other.
    # Lower values detect disconnected nodes faster but can increase network and CPU overhead.
    # Change this only if you fully understand the implications.
    tick_period_ms: 100
```

By default, Qdrant uses port `6335` for internal communication. All peers must be accessible on this port within the cluster, so ensure it is isolated from outside access.

You also need to provide the `--uri` flag to the first peer so it can inform other nodes of its address:

```bash
./qdrant --uri 'http://qdrant_node_1:6335'
```

Subsequent peers must know at least one existing cluster node to synchronize with the rest of the cluster. They receive this information via the `--bootstrap` flag:

```bash
./qdrant --bootstrap 'http://qdrant_node_1:6335'
```

The URL for new peers is derived automatically from the IP address of their request. However, you can specify it explicitly using the `--uri` argument if needed.

```text
USAGE:
    qdrant [OPTIONS]

OPTIONS:
        --bootstrap <URI>
            URI of the peer to bootstrap from in case of multi-peer deployment.
            If not specified, this peer is considered the first in a new deployment.

        --uri <URI>
            URI of this peer (reachable by other peers). Must be supplied if this is
            the first peer in a new deployment. If not the first peer, this argument
            is optional. If omitted, Qdrant derives the IP address on the bootstrap
            peer (the receiving side).
```

After successful synchronization, you can check the cluster status through the [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status):

```http
GET /cluster
```

Example response:

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

Note that enabling distributed mode does not automatically replicate your data. See the [Making Use of a New Distributed Qdrant Cluster](#making-use-of-a-new-distributed-qdrant-cluster) section for the next steps.

## Enabling Distributed Mode in Qdrant Cloud

For the best results, ensure your cluster is running Qdrant v1.7.4 or higher. Distributed mode does work with older Qdrant versions, but improvements in v1.7.4 enhance resilience during outages.

In the [Qdrant Cloud console](https://cloud.qdrant.io/), click “Scale Up” to enlarge your cluster beyond a single node. Qdrant Cloud automatically configures distributed mode settings.

Once the scale-up process completes, you’ll have a new empty node running alongside your existing node(s). To replicate data to this new node, see the next section.

## Making Use of a New Distributed Qdrant Cluster

When distributed mode is activated and your cluster grows to two or more nodes, any new node starts out empty. To populate it with data, you have several options:

- Create a new replicated collection by specifying a [replication_factor](/documentation/guides/replication/#replication-factor) of 2 or more and setting your [number of shards](/documentation/guides/sharding/#choosing-the-right-number-of-shards) to a multiple of the total number of nodes.  
- If your existing collection does not have enough shards for each node, you must create a new collection as described above.  
- If you already have enough shards and just need data replication, follow the instructions for [creating new shard replicas](/documentation/guides/replication/#creating-new-shard-replicas).  
- If your data is already replicated and you simply want to move data (without additional replication) to the new node(s), see [moving shards](/documentation/guides/sharding/#moving-shards).

## Raft Overview

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to maintain a consistent view of cluster topology and the collection structure.

Point-level operations do not go through consensus. Qdrant does not provide strong transaction guarantees but keeps the overhead low for point operations. This means Qdrant does not guarantee atomic distributed updates, though you can [wait for the completion](/documentation/concepts/points/#awaiting-result) of write operations to see the results.

In contrast, collection-level operations (like creating or deleting a collection) go through the consensus protocol. A majority of nodes must agree on an operation before it is performed. If the cluster is in a transitional state—such as electing a new leader after a failure or during startup—collection update operations will be denied.

For details on the cluster’s current state, consult the [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status).

See [Advanced Deployment](/documentation/production/advanced-deployment/) for more information on Raft internals and consensus checkpointing.