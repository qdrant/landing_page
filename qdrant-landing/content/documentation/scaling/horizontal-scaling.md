---
title: Horizontal Scaling
short_description: "Understand how Qdrant scales out across nodes through sharding, replication, Raft consensus, and consistency guarantees."
description: "Learn how Qdrant's distributed model works: sharding, the default replication behavior, Raft consensus for cluster metadata, and the consistency trade-off."
weight: 10
---

# Horizontal Scaling

Horizontal scaling means adding more nodes to a Qdrant cluster instead of making existing nodes bigger. It's how Qdrant handles data that no longer fits on one node, and it's also the mechanism underlying Qdrant's fault tolerance. This page covers how it works under the hood: sharding, replication, Raft consensus, and consistency guarantees. For what these mechanics buy you in terms of fault tolerance and failover, see [Resilience](/documentation/scaling/resilience/). For the practical configuration steps, see [Distributed Deployment](/documentation/scaling/distributed_deployment/).

## How Many Qdrant Nodes Should I Run?

The ideal number of Qdrant nodes depends on how much you value cost-saving, resilience, and performance/scalability in relation to each other.

- **Prioritizing cost-saving**: If cost is most important to you, run a single Qdrant node. This is not recommended for production environments. Drawbacks:
  - Resilience: Users will experience downtime during node restarts, and recovery is not possible unless you have backups or snapshots.
  - Performance: Limited to the resources of a single server.

- **Prioritizing resilience**: If resilience is most important to you, run a Qdrant cluster with three or more nodes and two or more shard replicas. Clusters with three or more nodes and replication can perform all operations even while one node is down. Additionally, they gain performance benefits from load-balancing and they can recover from the permanent loss of one node without the need for backups or snapshots (but backups are still strongly recommended). This is most recommended for production environments. Drawbacks:
   - Cost: Larger clusters are more costly than smaller clusters, which is the only drawback of this configuration.

- **Balancing cost, resilience, and performance**: Running a two-node Qdrant cluster with replicated shards allows the cluster to respond to most read/write requests even when one node is down, such as during maintenance events. Having two nodes also means greater performance than a single-node cluster while still being cheaper than a three-node cluster. Drawbacks:
   - Resilience (uptime): "Uptime" here means the ability to perform operations on collections, such as create, edit, or delete, not the ability to serve search and write requests. The cluster cannot perform collection operations when one node is down, since those require >50% of nodes to be running, which is only possible in a 3+ node cluster. Since creating, editing, and deleting collections are usually rare operations, many users find this drawback to be negligible. See [Temporary Node Failure](/documentation/scaling/resilience/#temporary-node-failure) for what actually happens to search and write requests during an outage.
   - Resilience (data integrity): If the data on one of the two nodes is permanently lost or corrupted, it cannot be recovered aside from snapshots or backups. Only 3+ node clusters can recover from the permanent loss of a single node since recovery operations require >50% of the cluster to be healthy.
   - Cost: Replicating your shards requires storing two copies of your data.
   - Performance: The maximum performance of a Qdrant cluster increases as you add more nodes.

"Uptime" and "data integrity" are both forms of resilience but mean different things; see [Resilience terminology](/documentation/scaling/resilience/#resilience-terminology-uptime-vs-data-integrity) for the distinction, and [How resilience works](/documentation/scaling/resilience/#how-resilience-works) for the bigger picture on how replication factor and node count together determine it.

In summary, single-node clusters are best for non-production workloads, replicated 3+ node clusters are the gold standard, and replicated 2-node clusters strike a good balance.

## Sharding

A Qdrant collection is made up of one or more shards. Each shard is an independent store of points capable of performing all the operations a collection supports, and shards manage non-intersecting subsets of a collection's points.

Qdrant distributes points across shards in one of two ways:

- **Automatic sharding** (default): points are assigned to shards using a [consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) algorithm, so each shard manages a non-overlapping subset of points without manual placement.
- **User-defined sharding**: each point is uploaded to a shard you choose, so operations can target only the shard or shards they need. This is useful for isolating tenants or regions onto dedicated shards.

Every node knows where all parts of a collection are stored through [Raft consensus](#raft-consensus), so a search request sent to any single node automatically fans out to the rest of the cluster to gather the full result.

As a rule of thumb, create at least 2 shards per node so the cluster can grow without resharding, since [resharding](/documentation/scaling/distributed_deployment/#resharding) is only available in Qdrant Cloud and otherwise requires recreating the collection. If you anticipate significant growth, 12 shards is a common starting point, since it divides evenly as you scale from 1 node up to 2, 3, 6, and 12 nodes. Beyond that, more shards add overhead without much benefit on smaller clusters.

See [Sharding](/documentation/scaling/distributed_deployment/#sharding) in Distributed Deployment for how to set the shard count, enable user-defined sharding, and move shards between nodes.

## Replication

Qdrant allows you to replicate shards between nodes in the cluster, keeping several copies of a shard spread across the cluster. This ensures the availability of data in case of node failures, except if all replicas are lost.

By default, Qdrant has no primary or secondary replicas. Writes execute in parallel on all active replicas of a shard, and any replica can serve reads or writes. A "leader" replica only exists when a collection is configured with `medium` or `strong` [write ordering](/documentation/scaling/distributed_deployment/#write-ordering); even then, the leader is dynamically elected rather than fixed, and it exists to serialize writes for consistency, not to act as a permanent primary. See [Replication factor](/documentation/scaling/distributed_deployment/#replication-factor) and [Creating new shard replicas](/documentation/scaling/distributed_deployment/#creating-new-shard-replicas) for how to configure replication.

Each replica is in one of three states: active (healthy and serving traffic), dead (unresponsive to health checks or failing to serve traffic), or partial (resynchronizing before it can become active). A dead replica stops receiving traffic from other peers and may need manual intervention if it doesn't recover on its own. This state model is what keeps data consistent and available when only a subset of replicas fail during an update.

## Raft Consensus

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to maintain consistency regarding the cluster topology and the collections structure.

Operations on points, on the other hand, do not go through the consensus infrastructure. Qdrant is not intended to have strong transaction guarantees, which allows it to perform point operations with low overhead. In practice, it means that Qdrant does not guarantee atomic distributed updates but allows you to wait until the [operation is complete](/documentation/manage-data/points/#awaiting-result) to see the results of your writes.

Operations on collections, on the contrary, are part of the consensus which guarantees that all operations are durable and eventually executed by all nodes. In practice it means that a majority of nodes agree on what operations should be applied before the service will perform them.

For high availability, run at least three voting nodes. A two-node cluster cannot form a majority if either node is unavailable, so Raft cannot elect or confirm a leader until both nodes can communicate again.

Practically, it means that if the cluster is in a transition state, either electing a new leader after a failure or starting up, the collection update operations will be denied.

You may use the cluster [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status) to check the state of the consensus.

To keep the Raft log from growing indefinitely, Qdrant supports consensus checkpointing: periodically creating a consistent snapshot of the cluster state that all nodes have agreed on, then truncating the log. Without this, a node that joins a long-running cluster would need to replay the entire log to catch up, which gets slower as the log grows. See [Consensus Checkpointing](/documentation/scaling/distributed_deployment/#consensus-checkpointing) in Distributed Deployment for how to trigger one.

## Consistency

By default, Qdrant focuses on availability and maximum throughput of search operations, which is a preferable trade-off for most use cases. During normal operation, you can search and modify data from any peer in the cluster: reads use a partial fan-out strategy to optimize latency and availability, and writes execute in parallel on all active sharded replicas.

This default favors throughput over strict consistency, so concurrent updates to the same point can briefly diverge across replicas. Qdrant provides tunable knobs to trade some of that throughput for stronger guarantees when you need them. See [Consistency guarantees](/documentation/scaling/distributed_deployment/#consistency-guarantees) for the write consistency factor, read consistency, and write ordering options.

## Where to Go Next

- [Resilience](/documentation/scaling/resilience/) covers what these mechanics buy you in fault tolerance, Multi-AZ, and failover.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) covers the practical configuration: enabling distributed mode, sharding, replication, and node failure recovery.
- [Vertical Scaling](/documentation/scaling/vertical-scaling/) covers resizing existing nodes instead of adding more.
