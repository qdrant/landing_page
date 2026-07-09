---
title: Scaling
short_description: "Scale Qdrant vertically or horizontally as your data and traffic grow, and configure failover for production resilience."
description: "Learn when to scale Qdrant vertically versus horizontally, and how to configure replication, node count, and Multi-AZ for production-grade failover."
weight: 115
partition: deploy
---

# Scaling

Qdrant supports two ways to scale: vertically, by giving existing nodes more resources, and horizontally, by adding more nodes to a cluster. Most deployments start vertically and move to horizontal scaling once a single node can no longer keep up.

## Vertical vs. Horizontal Scaling

Scale vertically first. Resizing CPU, RAM, or disk on your existing nodes is simpler than distributing data across a cluster, avoids network overhead, and is easy to reverse. A single node can typically hold up to about 100 million vectors, depending on dimensionality and quantization, and RAM usage approaching 80% is the main signal that it's time to resize. See [Vertical Scaling](/documentation/scaling/vertical-scaling/) for RAM sizing guidelines and resize steps for Qdrant Cloud and self-hosted deployments.

Scale horizontally once vertical scaling isn't enough. That's the case when your data no longer fits on a single node even with quantization, when you're bottlenecked on disk I/O, when you need to isolate tenants onto dedicated shards, or when you need fault tolerance, which requires spreading replicated data across multiple machines. A minimal fault-tolerant cluster has three nodes with a `replication_factor` of two or more, since three nodes are the minimum needed to form a majority for Qdrant's Raft consensus. See [Horizontal Scaling](/documentation/scaling/horizontal-scaling/) for how sharding and replication work, [Resilience](/documentation/scaling/resilience/) for what that buys you in fault tolerance and failover, and [Distributed Deployment](/documentation/scaling/distributed_deployment/) for the configuration steps.

If you're running in Qdrant Cloud, [Scale Clusters](/documentation/cloud/cluster-scaling/) covers the Cloud Console steps for both directions.

## Failover Best Practices

How Qdrant responds to a node failure depends entirely on how the cluster is provisioned beforehand:

- **Run at least three nodes with a `replication_factor` of two or more in production.** A single-replica cluster, which is the default, gets none of Qdrant's high-availability guarantees: no automatic failover, no Multi-AZ protection, and no zero-downtime upgrades. All of these depend on having replicated data spread across multiple nodes.
- **Enable Multi-AZ if you need protection against a zone-level outage.** Replication alone doesn't guarantee that your nodes, and therefore your replicas, are spread across separate availability zones. Multi-AZ must be enabled explicitly at cluster creation. See [Multi-AZ vs. replication factor](/documentation/scaling/horizontal-scaling/#multi-az-vs-replication-factor) for how the two settings differ.
- **Self-hosted Qdrant does not fail over automatically.** If a node fails permanently, you need to remove it from consensus and attach a replacement node yourself. See [Node Failure Recovery](/documentation/scaling/distributed_deployment/#node-failure-recovery) for the recovery steps.
- **Qdrant Cloud (Managed, Hybrid, and Private) adds automatic failover on top of replication**, so a failed node is detected and replaced without manual intervention, provided your cluster has enough replicas to tolerate the loss.
- **Monitor cluster health so you can react before a second failure compounds the first.** See [Monitoring & Telemetry](/documentation/ops-monitoring/) for setting up Prometheus and Grafana against your cluster.

## Where to Go Next

- [Vertical Scaling](/documentation/scaling/vertical-scaling/) — resize existing nodes.
- [Horizontal Scaling and Resilience](/documentation/scaling/horizontal-scaling/) — how Qdrant's distributed model achieves scale and fault tolerance.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) — configure sharding, replication, and node recovery.
