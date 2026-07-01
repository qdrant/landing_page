---
title: "Migration and Recovery"
short_description: "Compare the migration tool, core snapshots, and cloud backups to choose the right approach for moving or recovering your Qdrant data."
description: "Decide between Qdrant's three data movement options — migration tool, collection snapshots, and cloud backups — based on use case, resource requirements, and operational trade-offs."
partition: deploy
weight: 130
---

# Migration and Recovery Options

Qdrant gives you three mechanisms for moving or recovering data, each suited to a different scenario. The right choice depends on what you're migrating from, whether you need to change the shard count, and whether you're on Qdrant Cloud.

**Quick guide:**

- Use the **[Qdrant Migration Tool](#qdrant-migration-tool)** when moving data from other vector search engines (for example, from Pinecone, Weaviate, or Chroma) to Qdrant, when you need to change shard counts, or migrate a subset of data.
- Use **[Snapshots](#snapshots)** when moving a Qdrant collection between environments (for example, self-hosted to Cloud) and you want to skip re-indexing by transferring the existing index.
- Use **[Cloud Backups](#cloud-backups)** for full cluster failure recovery or reverting a cluster to a previous state. This is the fastest restore option when you're on Qdrant Cloud.

## Qdrant Migration Tool

The [Qdrant Migration Tool](/documentation/migrate-to-qdrant/) streams points from a source database directly to a target Qdrant cluster over the network. Because data arrives as individual upserts, Qdrant builds the HNSW index from scratch. This is the slowest option for indexing but the most flexible in terms of source system and target shape.

**When to use it:** Migrating from any of the [supported sources](/documentation/migrate-to-qdrant/#supported-sources), including other Qdrant clusters; changing the number of shards; or migrating a filtered subset of vectors.

<aside role="alert">
During migration, the target cluster needs <strong>twice the RAM and disk</strong> of the source collection. You can scale RAM back down once the migration is complete.
</aside>

See the [Data Migration tutorial](/documentation/tutorials-operations/migration/) for step-by-step instructions.

## Snapshots

[Snapshots](/documentation/snapshots/) are `tar` archives of a collection's data and its pre-built index. Restoring a snapshot to a new cluster skips the indexing phase entirely, which can save hours on large collections.

**When to use it:** Moving a Qdrant collection between environments (for example, self-hosted to Cloud, or Managed Cloud to Private Cloud). Snapshots also let you restore collections to a known-good state after accidental deletion, data corruption, or a failed data update.

The target cluster still needs approximately two times the collection's disk size during the restore window, because the snapshot file and the restored collection exist simultaneously on disk until the restore is complete.

The target cluster must match the source cluster's minor version, or be at most one minor version higher. For example, you can restore a 1.17.1 snapshot to a 1.18.1 cluster, but not a 1.16.0 snapshot.

See [Snapshots](/documentation/snapshots/) for API reference and storage options, or the [Backup & Restore Qdrant with Snapshots](/documentation/tutorials-operations/create-snapshot/) for a walkthrough.

## Cloud Backups

Cloud Backups work at the disk level: the storage volumes your Qdrant cluster runs on are snapshotted, without Qdrant reading or transferring any data. This makes it the fastest option.

**When to use it:** Recovering from a full cluster failure, or reverting a cluster to a known-good state after a bad deployment or data corruption. The restore is constrained to the same cloud provider, same region, same Qdrant version, and same cluster shape.

See [Backing up Qdrant Cloud Clusters](/documentation/cloud/backups/) for setup and restore instructions.

## Comparison

The following tables compare the three options across key dimensions to help you choose the right approach for your migration or recovery needs.

### Overview & Use Case

A high-level look at what each option does, the scenario it's designed for, and the granularity at which it operates.

| | Migration Tool | Snapshots | Cloud Backups |
|---|---|---|---|
| **Description** | Streams collection data to target | Captures collection data/state | Backs up volumes using CSI snapshots |
| **When to use** | Migrations from other systems, shard changes | Collection migrations, recovery | Full failure recovery, cluster reversion |
| **Scope** | Per collection (optional filter) | Per collection or shard | Entire volume |

### Performance & Cost

How each option handles indexing on the target, data transfer speed, network cost, and load placed on the source cluster.

| | Migration Tool | Snapshots | Cloud Backups |
|---|---|---|---|
| **Indexing on target** | Full re-index (slow) | None (index transfers with data) | None (direct disk clone) |
| **Speed** | Moderate | Fast | Very fast |
| **Network cost** | Medium (potential cloud egress from streamed data) | High (potential cloud egress) | High / None (stays within region) |
| **Impact on source** | Medium-High (CPU/IO intensive) | Moderate (CPU/IO) | Minimal (handled by storage) |

### Operations & Mechanics

How much effort each option requires, which APIs or tools you'll use, and where data lands during the operation.

| | Migration Tool | Snapshots | Cloud Backups |
|---|---|---|---|
| **Operational effort** | Moderate (CLI setup) | High (per-node API scripting) | Low (automated, cluster-wide) |
| **API / tooling** | CLI Tool | Qdrant REST API | Cloud infrastructure|
| **Source availability** | Must be online throughout | Online during snapshot creation only; not required for upload or restore | Not required |
| **Snapshot location** | N/A | External (S3 or compatible) | Cloud infrastructure |
| **Restore target** | Any existing cluster | Any existing cluster | Restore within same region |


### Infrastructure Limits

Constraints on source system, target cloud, cluster shape, and Qdrant version compatibility.

| | Migration Tool | Snapshots | Cloud Backups |
|---|---|---|---|
| **Flexibility** | High | Moderate | Low |
| **Source system** | [Supported Sources](/documentation/migrate-to-qdrant/#supported-sources) | Qdrant cluster | Qdrant on compatible cloud infra |
| **Target cloud** | Any | Any | Same cloud provider only |
| **Target cluster shape** | Flexible | Moderate: same shard count | Strict: same config & node count |
| **Target Qdrant version** | Any | Same or newer | Exact same version |

### Resource Requirements

Disk and RAM headroom needed on the target cluster, and how each option handles an interrupted operation.

| | Migration Tool | Snapshots | Cloud Backups |
|---|---|---|---|
| **Target disk headroom** | 2× source | 2× source | ≥ source size |
| **Target RAM headroom** | 2× source | Same as source | Same as source |
| **Resilience to interruption** | Checkpoint resume | Atomic restore | Atomic clone |

"Source" refers to actual collection usage, not provisioned capacity. Check your current usage in the [Web UI](/documentation/ops-monitoring/memory-usage/) or via the [API](/documentation/ops-monitoring/memory-usage/#api).

## Related Pages

- [Capacity Planning](/documentation/capacity-planning/): size your target cluster before migrating
- [Migration Tool documentation](/documentation/migrate-to-qdrant/): step-by-step Migration Tool walkthrough
- [Snapshots](/documentation/snapshots/): snapshot API reference
- [Backing up Qdrant Cloud Clusters](/documentation/cloud/backups/): Cloud Backup setup and restore
