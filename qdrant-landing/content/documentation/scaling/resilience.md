---
title: Resilience
short_description: "Configure Qdrant's replication factor, node count, and Multi-AZ settings for fault tolerance, plus failover best practices for production."
description: "Learn how replication factor and node count together determine Qdrant's fault tolerance, how Multi-AZ differs from replication, and how to configure failover for production."
weight: 15
---

# Resilience

Qdrant's fault tolerance is driven by replication and node count. Together, they control whether your data survives a node loss and whether your cluster keeps serving requests when one goes down.

Resilience covers three distinct aspects of a Qdrant cluster, and it's worth keeping them separate since a cluster can have one without the others:

- **Availability for reading and writing data**: whether search and write requests keep succeeding while a node is down. See [Temporary Node Failure](#temporary-node-failure) for exactly how differently-configured clusters behave when a node goes down.
- **Availability for cluster-wide operations**: whether you can still create, edit, or delete collections while a node is down. This requires a majority of nodes to be healthy, regardless of replication factor. See [How many Qdrant nodes should I run?](/documentation/scaling/horizontal-scaling/#how-many-qdrant-nodes-should-i-run) for how this plays out at different cluster sizes.
- **Data integrity**: whether your data survives the permanent loss of a node. This depends on replication factor and node count together, not on either form of availability.

This page covers what determines Qdrant's fault tolerance and how to configure failover in production. For how the underlying replication and consensus mechanics work, see [Horizontal Scaling](/documentation/scaling/horizontal-scaling/).

## Setting Up a Resilient Qdrant Cluster

Two factors determine the resilience of a Qdrant cluster:

- **[Replication factor](/documentation/scaling/distributed_deployment/#replication)** controls how many copies of each shard exist. More copies mean your data survives the loss of more nodes.
- **[Node count](/documentation/scaling/horizontal-scaling/#how-many-qdrant-nodes-should-i-run)** controls how many independent machines those copies can be spread across, and how many nodes can vote in the [Raft consensus](/documentation/scaling/horizontal-scaling/#raft-consensus) that manages collection operations.

These two factors work together:
- A high replication factor on a single node cluster is meaningless: Qdrant won't assign multiple copies of the same shard to a single node. More importantly, it leaves you with a single point of failure. If the node fails, the cluster is unavailable. If the node is unrecoverable, you lose data.
- A large node count with a replication factor of one means a single node failure causes unavailability for any collection that had shards on that node. If the node can't be recovered, the data it held is lost, even though the rest of the cluster keeps running.

Resilience comes from provisioning both together: a highly available cluster consists of three or more nodes, and collections should have a replication factor of two or higher.

## Temporary Node Failure

Running Qdrant in distributed mode makes your cluster resistant to outages when one node fails temporarily. Here's how differently-configured Qdrant clusters respond:

- 1-node clusters: All operations time out or fail for up to a few minutes, depending on how long it takes to restart and load data from disk.
- 2-node clusters where shards **are not** replicated: All operations will time out or fail for up to a few minutes, depending on how long it takes to restart and load data from disk.
- 2-node clusters where all shards **are** replicated to both nodes: All requests except for operations on collections continue to work during the outage.
- 3+-node clusters where all shards are replicated to at least 2 nodes: All requests continue to work during the outage.

For the steps to recover from a permanent node loss, see [Node Failure Recovery](/documentation/scaling/node-failure-recovery/).

## Multi-AZ Deployments

An availability zone (AZ) is an isolated section of a cloud provider's infrastructure, typically a distinct data center or group of data centers within a region, with its own power and networking. A multi-AZ deployment spreads your cluster's nodes across more than one availability zone, so that the loss of a single zone, for example due to a power outage or a network failure, doesn't take down your whole cluster.

Creating a multi-node cluster with replication does not automatically distribute replicas across availability zones: all replicas may land in the same zone, so a single zone outage could take down every replica of a shard at once, even with a replication factor of two or higher.

On the [Qdrant Cloud premium tier](/documentation/cloud-premium/), checking the **Multi AZ** box at cluster creation makes Qdrant zone-aware: it automatically distributes shards across availability zones so that each shard has a replica in another zone, and it routes traffic between zones automatically so the cluster stays available if one zone goes down. See [Creating a Production-Ready Cluster](/documentation/cloud/create-cluster/#creating-a-production-ready-cluster).

Self-hosted Qdrant clusters have no zone awareness and won't automatically distribute replicas across them. You need to spread your nodes across zones yourself, then [move replicas](/documentation/scaling/distributed_deployment/#moving-shards) so that each shard has at least one replica in a different zone.

## Failover Best Practices

How Qdrant responds to a node failure depends entirely on how the cluster is provisioned beforehand:

- **Run at least three nodes with a replication factor of two or more in production.** A single-replica cluster, which is the default, gets none of Qdrant's high-availability guarantees: no automatic failover, no Multi-AZ protection, and no zero-downtime upgrades. All of these depend on having replicated data spread across multiple nodes.
- **Enable Multi-AZ if you need protection against a zone-level outage.** Replication alone doesn't guarantee that your nodes, and therefore your replicas, are spread across separate availability zones. Multi-AZ must be enabled explicitly at cluster creation.
- **Self-hosted Qdrant does not fail over automatically.** If a node fails permanently, you need to remove it from consensus and attach a replacement node yourself. See [Node Failure Recovery](/documentation/scaling/node-failure-recovery/) for the recovery steps.
- **Qdrant Cloud (Managed, Hybrid, and Private) adds automatic failover on top of replication**, so Qdrant Cloud detects and replaces a failed node without manual intervention, provided your cluster has enough replicas to tolerate the loss.
- **Monitor cluster health so you can react before a second failure compounds the first.** See [Monitoring & Telemetry](/documentation/ops-monitoring/) for setting up Prometheus and Grafana against your cluster.

## Where to Go Next

- [Horizontal Scaling](/documentation/scaling/horizontal-scaling/) covers Raft consensus, the replication model, and consistency guarantees.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) covers the practical configuration: enabling distributed mode, sharding, replication, and node failure recovery.
- [Node Failure Recovery](/documentation/scaling/node-failure-recovery/) covers the steps to remove a permanently failed node from consensus and attach a replacement.

