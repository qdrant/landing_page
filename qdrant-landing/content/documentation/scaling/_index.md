---
title: Scaling & Resilience
short_description: "Scale Qdrant vertically or horizontally as your data and traffic grow, and configure replication, node count, and Multi-AZ for production resilience."
description: "Learn when to scale Qdrant vertically versus horizontally, and how to configure replication, node count, Multi-AZ, and failover for production-ready resilience."
weight: 115
partition: deploy
---

# Scaling & Resilience

Qdrant supports two ways to scale: vertically, by giving existing nodes more resources, and horizontally, by adding more nodes to a cluster. Most deployments start by scaling vertically and move to horizontal scaling once a single node can no longer keep up.

Horizontal scaling also provides resilience: deployments with multiple nodes and replicas remain available for reads and writes, even when individual nodes fail.

<aside role="status">Before adding capacity, consider whether your existing cluster can be optimized first. Quantization, moving vector storage to disk, and other techniques can significantly reduce resource usage. See <a href="/documentation/ops-optimization/optimize/">Optimization</a> for a full overview.</aside>

## Vertical vs. Horizontal Scaling

Vertical scaling means adding more CPU, RAM, or disk to an existing node. A single node can typically hold up to about 100 million vectors, depending on dimensionality and quantization. RAM usage approaching 80% is the main signal that it's time to resize. See [Vertical Scaling](/documentation/scaling/vertical-scaling/) for RAM sizing guidelines and resize steps for Qdrant Cloud and self-hosted deployments.

Horizontal scaling means adding more nodes to a cluster instead of resizing existing ones. It's necessary when your data no longer fits on a single node even with quantization, when you're bottlenecked on disk I/O, or when you need to isolate tenants onto dedicated shards. See [Horizontal Scaling](/documentation/scaling/horizontal-scaling/) for how sharding and replication work, and [Distributed Deployment](/documentation/scaling/distributed_deployment/) for the configuration steps.

Scale vertically first: it's simpler than distributing data across a cluster, avoids network overhead, and is easy to reverse. Move to horizontal scaling once vertical scaling isn't enough. If you're running in Qdrant Cloud, [Scale Clusters](/documentation/cloud/cluster-scaling/) covers the steps for both directions.

## Resilience

Resilience comes from replicating data across multiple nodes. A single node, or a single copy of your data, has no protection against failure: if you lose it, you lose both the data and the ability to serve it. A minimal fault-tolerant cluster needs three nodes and a replication factor of two or more. Three nodes are the minimum to form a majority for Qdrant's Raft consensus, and two or more replicas ensure a single node failure won't take your data or availability down with it.

See [Resilience](/documentation/scaling/resilience/) for how replication factor and node count determine fault tolerance and failover best practices.

When a node fails, the recovery path depends on whether the lost shards have replicas on surviving nodes. A node that restarts rejoins consensus and catches up automatically. A permanently lost node can be replaced by provisioning a new one and rebalancing shards. See [Distributed Deployment](/documentation/scaling/distributed_deployment/) for node failure recovery steps.

## Where to Go Next

- [Vertical Scaling](/documentation/scaling/vertical-scaling/): resize existing nodes.
- [Horizontal Scaling](/documentation/scaling/horizontal-scaling/): how Qdrant's distributed model achieves scale.
- [Resilience](/documentation/scaling/resilience/): fault tolerance, Multi-AZ, and failover best practices.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/): configure sharding, replication, and node recovery.
- [Node Failure Recovery](/documentation/scaling/node-failure-recovery/): step-by-step procedures for recovering from a failed node.
