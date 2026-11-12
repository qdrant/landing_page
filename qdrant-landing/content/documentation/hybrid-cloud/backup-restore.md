---
title: Backup & Restore
short_description: "Back up and restore Qdrant Hybrid Cloud clusters with CSI volume snapshots: requirements, schedules and retention, restore options and side effects, and what happens to snapshots on delete."
description: "How Qdrant Hybrid Cloud backups work with Kubernetes CSI volume snapshots, how to schedule them, how retention works, which restore options exist, and what happens to snapshots when you delete a schedule or a cluster."
weight: 20
---

# Backing up and Restoring Qdrant Hybrid Cloud Clusters

Backups in Hybrid Cloud work like backups in [Managed Cloud](/documentation/cloud/backups/). You create schedules and restores in the Qdrant Cloud Console, with the [`qcloud` CLI](/documentation/cloud-cli/), the [Cloud API](/documentation/cloud-api/), or [Terraform](/documentation/cloud-tools/terraform/). The difference is where the data lives: each backup is a volume snapshot in your own Kubernetes cluster and cloud account. Qdrant has no access to it.

## Requirements

- A CSI driver that supports volume snapshots, with a `VolumeSnapshotClass` for the `StorageClass` that your clusters use. Create the class before you create the cluster. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for your platform.
- A **Volume Snapshot Class** set on the cluster. The Operator default is `csi-snapclass`. If you set it to `None` when you create the cluster, backups are disabled.

## How Backups Work

When a backup runs, the Operator creates `VolumeSnapshot` resources, and your cloud provider snapshots the volumes. The snapshots are stored in your account, and they follow the encryption rules of your `StorageClass`.

Backups are on by default. The `backupManagement` block of the [Operator configuration](/documentation/hybrid-cloud/operator-configuration/) turns the snapshot, scheduled snapshot, and restore features on or off.

## Schedule Backups

Use the **Backups** tab on the cluster detail page, or the CLI. For example, to back up every day at 02:00 UTC and keep each backup for 7 days:

```sh
qcloud backup schedule create \
  --cluster-id <CLUSTER_ID> --schedule '0 2 * * *' --retention-days 7
```

## Retention

| Snapshots | How long they are kept |
|---|---|
| Successful scheduled backups | The **Days of Retention** you set on the schedule. When it expires, the Operator deletes the backup, and its volume snapshots go with it |
| Failed or skipped snapshots | `retainUnsuccessful` in the Operator configuration, 72 hours by default |

## Restore

| Goal | How | Result |
|---|---|---|
| Roll the cluster back | Restore a backup into the same cluster | See [what a restore does](#what-a-restore-does) |
| Test a restore, or recover without touching the source | **Create New Cluster From Backup** in the Console, or `qcloud cluster create-from-backup --backup-id <BACKUP_ID> --name <NAME>` | A new cluster in the same Hybrid Cloud environment as the source backup. You choose only the name |
| Move to another region or Hybrid Cloud environment | Not supported | A restore uses the volume snapshot in your Kubernetes cluster as its data source. It cannot cross Kubernetes clusters or regions, because the product does not copy snapshots between them |

### What a Restore Does

A restore into the same cluster runs these steps:

1. The cluster is suspended, so it is unavailable during the restore.
2. The cluster configuration is replaced by the one captured in the backup. CPU, memory, storage, node count, and Qdrant version revert to their values at backup time.
3. The persistent volume claims are deleted and recreated from the volume snapshots.
4. The cluster is unsuspended.

The Console warns that this reverts your cluster data and configuration. Data written after the backup is lost.

Restoring into a new cluster is the way to test your recovery plan without touching the running cluster. It needs node capacity for a second cluster.

Because a backup can only be restored in the Kubernetes cluster that holds it, the loss of that cluster or of its region is not covered by backups. Plan high availability and disaster recovery for the Kubernetes cluster and its storage separately.

## Delete a Schedule or a Cluster

| Action | What happens to the backups |
|---|---|
| Delete a schedule | The schedule stops. Existing backups stay until their retention expires |
| Delete a schedule and choose the option to also delete its backups | The backups, and the restores related to them, are deleted |
| Delete a cluster | The schedules go away with the cluster. The backups can outlive it, so that you can restore them into a new cluster. They stay until their retention expires or you delete them |

The snapshots live in your cloud account, so your provider bills you for their storage until they are deleted.
