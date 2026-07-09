---
title: Horizontal Scaling and Resilience
short_description: "Understand how Qdrant's distributed model delivers horizontal scale and fault tolerance through Raft consensus, replication, and resilience guarantees."
description: "Learn how Qdrant achieves horizontal scaling and resilience: Raft consensus, the default replication behavior, the replication-factor-and-node-count lever behind fault tolerance, and Multi-AZ."
weight: 10
---

# Horizontal scaling and resilience

Horizontal scaling means adding more nodes to a Qdrant cluster instead of making existing nodes bigger. It's how Qdrant handles data that no longer fits on one node, and it's also the mechanism behind fault tolerance: a cluster with enough nodes and enough replicas keeps serving traffic even when a node goes down.

Replication factor and node count together are the single lever behind all of Qdrant's resilience. Set them well, and both your data survives failures and your service keeps serving requests. Under-provision either one, and you risk losing data, availability, or both. This page explains the concepts behind that lever: Raft consensus, the replication model, consistency guarantees, and Multi-AZ. For the practical configuration steps, see [Distributed Deployment](/documentation/scaling/distributed_deployment/).

## How resilience works

Two settings determine how resilient a Qdrant cluster is:

- **Replication factor** controls how many copies of each shard exist. More copies mean your data survives the loss of more nodes.
- **Node count** controls how many independent machines those copies can be spread across, and how many nodes can vote in the [Raft consensus](#raft-consensus) that manages collection operations.

These two settings work together. A high replication factor on a single node still leaves you with a single point of failure, since all copies sit on the same machine. A large node count with a replication factor of one means data loss is permanent the moment a node fails, even though the rest of the cluster keeps running. Resilience comes from provisioning both together: enough nodes, and enough replicas spread across them. See [How many Qdrant nodes should I run?](/documentation/scaling/distributed_deployment/#how-many-qdrant-nodes-should-i-run) for concrete recommendations.

### Single-Replica Clusters Get None of This

By default, a Qdrant collection has a `replication_factor` of one: a single, unreplicated copy of each shard. A single-replica cluster gets none of the high-availability guarantees that replication enables, including Multi-AZ protection, automatic failover, and zero-downtime upgrades. All of these depend on having at least two replicas of every shard spread across at least two nodes. See [Replication factor](/documentation/scaling/distributed_deployment/#replication-factor) to configure it.

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

## Multi-AZ vs. Replication Factor

Replication factor and Multi-AZ solve two different problems, and enabling one does not enable the other.

- **Replication factor** governs data durability: how many copies of each shard exist across your nodes.
- **Multi-AZ** governs zone placement: whether those nodes, and therefore those copies, are spread across separate availability zones.

Creating a multi-node cluster with replication does not automatically distribute nodes across availability zones. Without Multi-AZ enabled at cluster creation, nodes may end up placed in the same availability zone, so a single zone outage could take down every replica of a shard at once, even with a replication factor of two or more. Enable Multi-AZ explicitly if you need protection against a zone-level failure. See [Create a Cluster](/documentation/cloud/create-cluster/) for how to enable it.

## Resilience Terminology: Uptime vs. Data Integrity

The [How many Qdrant nodes should I run?](/documentation/scaling/distributed_deployment/#how-many-qdrant-nodes-should-i-run) decision guide uses two specific senses of "resilience" that are easy to conflate:

- **Resilience (uptime)** refers narrowly to collection-management operations, such as create, edit, and delete. It does not mean query or write availability. A cluster can lose a node and keep serving search and write requests while still being unable to perform collection operations, which require a majority of nodes to be healthy.
- **Resilience (data integrity)** refers to whether your data survives the permanent loss of a node. This depends on replication factor and node count together, not on uptime.

See [Temporary Node Failure](/documentation/scaling/distributed_deployment/#temporary-node-failure) for exactly how differently-configured clusters behave when a node goes down.

## Where to Go Next

- [Distributed Deployment](/documentation/scaling/distributed_deployment/) covers the practical configuration: enabling distributed mode, sharding, replication, and node failure recovery.
- [Vertical Scaling](/documentation/scaling/vertical-scaling/) covers resizing existing nodes instead of adding more.
