---
title: Resilience
short_description: "Configure Qdrant's replication factor, node count, and Multi-AZ settings for fault tolerance, plus failover best practices for production."
description: "Learn how replication factor and node count together determine Qdrant's fault tolerance, how Multi-AZ differs from replication, and how to configure failover for production."
weight: 15
---

# Resilience

Replication factor and node count together are the single lever behind all of Qdrant's resilience. Set them well, and both your data survives failures and your service keeps serving requests. Under-provision either one, and you risk losing data, availability, or both. This page covers what determines Qdrant's fault tolerance and how to configure failover in production. For how the underlying replication and consensus mechanics work, see [Horizontal Scaling](/documentation/scaling/horizontal-scaling/).

## How Resilience Works

Two settings determine how resilient a Qdrant cluster is:

- **Replication factor** controls how many copies of each shard exist. More copies mean your data survives the loss of more nodes.
- **Node count** controls how many independent machines those copies can be spread across, and how many nodes can vote in the [Raft consensus](/documentation/scaling/horizontal-scaling/#raft-consensus) that manages collection operations.

These two settings work together. A high replication factor on a single node still leaves you with a single point of failure, since all copies sit on the same machine. A large node count with a replication factor of one means data loss is permanent the moment a node fails, even though the rest of the cluster keeps running. Resilience comes from provisioning both together: enough nodes, and enough replicas spread across them. See [How many Qdrant nodes should I run?](/documentation/scaling/horizontal-scaling/#how-many-qdrant-nodes-should-i-run) for concrete recommendations.

### Single-Replica Clusters Get None of This

By default, a Qdrant collection has a `replication_factor` of one: a single, unreplicated copy of each shard. A single-replica cluster gets none of the high-availability guarantees that replication enables, including Multi-AZ protection, automatic failover, and zero-downtime upgrades. All of these depend on having at least two replicas of every shard spread across at least two nodes. See [Replication factor](/documentation/scaling/distributed_deployment/#replication-factor) to configure it.

## Temporary Node Failure

If properly configured, running Qdrant in distributed mode makes your cluster resistant to outages when one node fails temporarily. Here is how differently-configured Qdrant clusters respond:

- 1-node clusters: All operations time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
- 2-node clusters where shards ARE NOT replicated: All operations will time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
- 2-node clusters where all shards ARE replicated to both nodes: All requests except for operations on collections continue to work during the outage.
- 3+-node clusters where all shards are replicated to at least 2 nodes: All requests continue to work during the outage.

For the steps to recover from a permanent node loss, see [Node Failure Recovery](/documentation/scaling/distributed_deployment/#node-failure-recovery).

## Multi-AZ vs. Replication Factor

Replication factor and Multi-AZ solve two different problems, and enabling one does not enable the other.

- **Replication factor** governs data durability: how many copies of each shard exist across your nodes.
- **Multi-AZ** governs zone placement: whether those nodes, and therefore those copies, are spread across separate availability zones.

Creating a multi-node cluster with replication does not automatically distribute nodes across availability zones. Without Multi-AZ enabled at cluster creation, nodes may end up placed in the same availability zone, so a single zone outage could take down every replica of a shard at once, even with a replication factor of two or more. Enable Multi-AZ explicitly if you need protection against a zone-level failure. See [Create a Cluster](/documentation/cloud/create-cluster/) for how to enable it.

## Resilience Terminology: Uptime vs. Data Integrity

The [How many Qdrant nodes should I run?](/documentation/scaling/horizontal-scaling/#how-many-qdrant-nodes-should-i-run) decision guide uses two specific senses of "resilience" that are easy to conflate:

- **Resilience (uptime)** refers narrowly to collection-management operations, such as create, edit, and delete. It does not mean query or write availability. A cluster can lose a node and keep serving search and write requests while still being unable to perform collection operations, which require a majority of nodes to be healthy.
- **Resilience (data integrity)** refers to whether your data survives the permanent loss of a node. This depends on replication factor and node count together, not on uptime.

See [Temporary Node Failure](#temporary-node-failure) for exactly how differently-configured clusters behave when a node goes down.

## Failover Best Practices

How Qdrant responds to a node failure depends entirely on how the cluster is provisioned beforehand:

- **Run at least three nodes with a `replication_factor` of two or more in production.** A single-replica cluster, which is the default, gets none of Qdrant's high-availability guarantees: no automatic failover, no Multi-AZ protection, and no zero-downtime upgrades. All of these depend on having replicated data spread across multiple nodes.
- **Enable Multi-AZ if you need protection against a zone-level outage.** Replication alone doesn't guarantee that your nodes, and therefore your replicas, are spread across separate availability zones. Multi-AZ must be enabled explicitly at cluster creation. See [Multi-AZ vs. Replication Factor](#multi-az-vs-replication-factor) for how the two settings differ.
- **Self-hosted Qdrant does not fail over automatically.** If a node fails permanently, you need to remove it from consensus and attach a replacement node yourself. See [Node Failure Recovery](/documentation/scaling/distributed_deployment/#node-failure-recovery) for the recovery steps.
- **Qdrant Cloud (Managed, Hybrid, and Private) adds automatic failover on top of replication**, so a failed node is detected and replaced without manual intervention, provided your cluster has enough replicas to tolerate the loss.
- **Monitor cluster health so you can react before a second failure compounds the first.** See [Monitoring & Telemetry](/documentation/ops-monitoring/) for setting up Prometheus and Grafana against your cluster.

## Where to Go Next

- [Horizontal Scaling](/documentation/scaling/horizontal-scaling/) covers Raft consensus, the replication model, and consistency guarantees.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) covers the practical configuration: enabling distributed mode, sharding, replication, and node failure recovery.
