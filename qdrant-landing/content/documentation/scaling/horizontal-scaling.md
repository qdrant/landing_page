---
title: Horizontal Scaling
short_description: "Understand how Qdrant scales out across nodes through Raft consensus, replication, and consistency guarantees."
description: "Learn how Qdrant's distributed model works: Raft consensus for cluster metadata, the default replication behavior, and the consistency trade-off."
weight: 10
---

# Horizontal Scaling

Horizontal scaling means adding more nodes to a Qdrant cluster instead of making existing nodes bigger. It's how Qdrant handles data that no longer fits on one node, and it's also the mechanism underlying Qdrant's fault tolerance. This page covers how it works under the hood: Raft consensus, the replication model, and consistency guarantees. For what these mechanics buy you in terms of fault tolerance and failover, see [Resilience](/documentation/scaling/resilience/). For the practical configuration steps, see [Distributed Deployment](/documentation/scaling/distributed_deployment/).

## Raft Consensus

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to maintain consistency regarding the cluster topology and the collections structure.

Operations on points, on the other hand, do not go through the consensus infrastructure. Qdrant is not intended to have strong transaction guarantees, which allows it to perform point operations with low overhead. In practice, it means that Qdrant does not guarantee atomic distributed updates but allows you to wait until the [operation is complete](/documentation/manage-data/points/#awaiting-result) to see the results of your writes.

Operations on collections, on the contrary, are part of the consensus which guarantees that all operations are durable and eventually executed by all nodes. In practice it means that a majority of nodes agree on what operations should be applied before the service will perform them.

For high availability, run at least three voting nodes. A two-node cluster cannot form a majority if either node is unavailable, so Raft cannot elect or confirm a leader until both nodes can communicate again.

Practically, it means that if the cluster is in a transition state, either electing a new leader after a failure or starting up, the collection update operations will be denied.

You may use the cluster [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status) to check the state of the consensus.

## Replication Model

Qdrant allows you to replicate shards between nodes in the cluster, keeping several copies of a shard spread across the cluster. This ensures the availability of data in case of node failures, except if all replicas are lost.

By default, Qdrant has no primary or secondary replicas. Writes execute in parallel on all active replicas of a shard, and any replica can serve reads or writes. A "leader" replica only exists when a collection is configured with `medium` or `strong` [write ordering](/documentation/scaling/distributed_deployment/#write-ordering); even then, the leader is dynamically elected rather than fixed, and it exists to serialize writes for consistency, not to act as a permanent primary. See [Replication factor](/documentation/scaling/distributed_deployment/#replication-factor) and [Creating new shard replicas](/documentation/scaling/distributed_deployment/#creating-new-shard-replicas) for how to configure replication.

## Consistency Guarantees: The Model

By default, Qdrant focuses on availability and maximum throughput of search operations, which is a preferable trade-off for most use cases. During normal operation, you can search and modify data from any peer in the cluster: reads use a partial fan-out strategy to optimize latency and availability, and writes execute in parallel on all active sharded replicas.

This default favors throughput over strict consistency, so concurrent updates to the same point can briefly diverge across replicas. Qdrant provides tunable knobs to trade some of that throughput for stronger guarantees when you need them. See [Consistency guarantees](/documentation/scaling/distributed_deployment/#consistency-guarantees) for the write consistency factor, read consistency, and write ordering options.

## Where to Go Next

- [Resilience](/documentation/scaling/resilience/) covers what these mechanics buy you in fault tolerance, Multi-AZ, and failover.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) covers the practical configuration: enabling distributed mode, sharding, replication, and node failure recovery.
- [Vertical Scaling](/documentation/scaling/vertical-scaling/) covers resizing existing nodes instead of adding more.
