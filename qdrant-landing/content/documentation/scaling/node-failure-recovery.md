---
title: Node Failure Recovery
short_description: "Recover a Qdrant cluster after a node fails, from restarting a replicated node to recreating one from a snapshot."
description: "Step-by-step recovery procedures for Qdrant node failures: restarting with replicated collections, recreating a failed node, and recovering from a snapshot when no replicas remain."
weight: 25
---

# Node Failure Recovery

Sometimes hardware malfunctions might render some nodes of the Qdrant cluster unrecoverable. Several recovery scenarios allow Qdrant to stay available for requests and even avoid performance degradation. Let's walk through them from best to worst.

## Recover with Replicated Collection

If the number of failed nodes is less than the replication factor of the collection, then your cluster should [still be able to perform read, search, and update queries](/documentation/scaling/resilience/).

If the failed node restarts, consensus will trigger the replication process to update the recovering node with any updates it missed.

If the failed node never restarts, you can recover the lost shards if you have a 3+ node cluster. You cannot recover lost shards in smaller clusters because recovery operations go through [Raft](/documentation/scaling/horizontal-scaling/#raft-consensus) which requires >50% of the nodes to be healthy.

## Recreate a Node with Replicated Collections

If a node fails and it's impossible to recover it, you should exclude the dead node from the consensus and create a new node:

1. To exclude failed nodes from the consensus, use [remove peer](https://api.qdrant.tech/master/api-reference/distributed/remove-peer) API. Apply the `force` flag if necessary.
1. Create a new node, make sure to attach it to the existing cluster by specifying `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.
1. Once the new node is ready and synchronized with the cluster, verify that the collection shards are sufficiently replicated.
1. When self-hosting, Qdrant will not automatically balance shards since this is an expensive operation. Use the [Replicate Shard Operation](https://api.qdrant.tech/master/api-reference/distributed/update-collection-cluster) to create new replicas on the newly connected node. On Qdrant Cloud, the system will automatically replicate shards to the new node if the replication factor isn't met.

## Recover from a Snapshot

If shards are unrecoverable and there are no other copies in the cluster, you can still recover from a snapshot.

First, detach the failed node and create a new one:

1. To exclude failed nodes from the consensus, use [remove peer](https://api.qdrant.tech/master/api-reference/distributed/remove-peer) API. Apply the `force` flag if necessary.
1. Create a new node, making sure to attach it to the existing cluster by specifying the `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.
1. Use the [Collection Snapshot Recovery API](/documentation/snapshots/#restore-snapshot) to restore the collection. The service will download the specified snapshot of the collection and recover shards with data from it. Snapshot recovery works differently in distributed mode than in single-node deployments. Consensus manages all collection metadata and doesn't require snapshots to restore it. But you can use snapshots to recover missing shards of the collections.

Once all shards of the collection are recovered, the collection will become operational again.

## Consensus Checkpointing

A cluster uses [Raft consensus](/documentation/scaling/horizontal-scaling/#raft-consensus) to manage cluster metadata and ensure that all nodes have a consistent view of the cluster state. Qdrant keeps a Raft log of operations that have modified the cluster state. When a node joins the cluster, it can replay the log to catch up with the current state.

To keep the Raft log from growing indefinitely, Qdrant uses consensus checkpointing: periodically creating a consistent snapshot of the cluster state that all nodes have agreed on, then truncating the log. Without this, a node that joins a long-running cluster would need to replay the entire log to catch up, which gets slower as the log grows.

To force a checkpoint, call the `/cluster/recover` API on the required node:

```http
POST /cluster/recover
```

This API can be triggered on any non-leader node, it will send a request to the current consensus leader to create a snapshot. The leader will in turn send the snapshot back to the requesting node for application.

In some cases, this API can be used to recover from an inconsistent cluster state by forcing a snapshot creation.
