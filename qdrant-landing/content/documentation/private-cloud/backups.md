---
title: Backups
short_description: "Back up and restore Qdrant Private Cloud clusters with CSI volume snapshots: requirements, one-time and scheduled snapshots, retention, restore options and side effects, and what happens when you delete a schedule or a cluster."
description: "How Qdrant Private Cloud backups work with Kubernetes CSI volume snapshots, how to create one-time and recurring snapshots with Kubernetes resources, how retention works, and how to restore into the same cluster or a new one."
weight: 20
---

# Backing up and Restoring Qdrant Private Cloud Clusters

Backups in Private Cloud use the same Operator and the same CSI volume snapshot mechanism as [Hybrid Cloud](/documentation/hybrid-cloud/backup-restore/). The difference is the control surface. Private Cloud has no Console, CLI, or Cloud API, so you create snapshots, schedules, and restores as Kubernetes resources. Each backup is a volume snapshot in your own Kubernetes cluster and cloud account. Qdrant has no access to it.

## Requirements

- A CSI driver that supports volume snapshots, with a `VolumeSnapshotClass` for the `StorageClass` that your clusters use. Create the class before you create the cluster. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for your platform.
- The `VolumeSnapshotClass` name set in the Operator configuration. The default is `csi-snapclass`. Set `operator.settings.features.backupManagement.snapshots.volumeSnapshotClass` in your Helm values if your class has another name. See [Configuration](/documentation/private-cloud/configuration/).

## How Backups Work

When a backup runs, the Operator creates `VolumeSnapshot` resources, and your cloud provider snapshots the volumes. The snapshots are stored in your account, and they follow the encryption rules of your `StorageClass`.

Backups are on by default. The `backupManagement` block of the Helm values turns the snapshot, scheduled snapshot, and restore features on or off, and sets how long failed snapshots are kept.

These backups are different from the [Qdrant snapshots](https://api.qdrant.tech/api-reference/snapshots/create-snapshot) that you create with the database API. A backup copies the volumes of the whole cluster. It does not use the snapshot storage of [Ephemeral Snapshot Volumes](/documentation/private-cloud/qdrant-cluster-management/#ephemeral-snapshot-volumes).

## Resources

All three resources are namespaced, and they must be in the same namespace as the cluster they refer to. The `cluster-id` and `customer-id` labels must be set to the values of the corresponding `QdrantCluster` resource. See the [API Reference](/documentation/private-cloud/api-reference/) for every field.

| Resource | Use it to |
|---|---|
| `QdrantClusterSnapshot` | Take one backup now |
| `QdrantClusterScheduledSnapshot` | Take backups on a cron schedule |
| `QdrantClusterRestore` | Restore a backup into a cluster |

### One-Time Backup

To create a one-time backup, create a `QdrantClusterSnapshot` resource:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantClusterSnapshot
metadata:
  name: "qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-snapshot-timestamp"
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  retention: 168h
```

Check the result in the `status` of the resource. The phase is one of `Running`, `Succeeded`, `Failed`, or `Skipped`:

```bash
kubectl get qdrantclustersnapshot -n qdrant-private-cloud
```

### Scheduled Backups

To create a recurring backup, create a `QdrantClusterScheduledSnapshot` resource. For example, to back up every day at 02:00 UTC and keep each backup for 7 days:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantClusterScheduledSnapshot
metadata:
  name: "qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-daily"
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  scheduleShortId: a7d8d973
  cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  # every day at 02:00 UTC
  schedule: "0 2 * * *"
  retention: 168h
```

- `schedule` is a cron expression, and it is always in UTC.
- `scheduleShortId` is a short identifier for the schedule, up to 8 characters.
- `retention` is a number of hours, written like `168h`. Days are not accepted.

## Retention

| Snapshots | How long they are kept |
|---|---|
| Successful backups with a `retention` | Until the retention expires. Then the Operator deletes the backup, and its volume snapshots go with it |
| Backups with no `retention` | Forever. Set a retention on every schedule, so that snapshots do not pile up and cost storage |
| Failed or skipped snapshots | `retainUnsuccessful` in the Operator configuration, 72 hours by default |

## Restore

| Goal | How | Result |
|---|---|---|
| Roll the cluster back | A `QdrantClusterRestore` with `destination.create` unset or `false` | See [what a restore does](#what-a-restore-does) |
| Test a restore, or recover without touching the source | A `QdrantClusterRestore` with `destination.create: true`, a new cluster name, and a new `cluster-id` label | A new cluster in the same Kubernetes cluster and namespace as the backup |
| Restore into another namespace | Not supported | The snapshot resource, its volume snapshots, and the destination cluster must be in the same namespace. A persistent volume claim can only use a volume snapshot from its own namespace |
| Move to another Kubernetes cluster or region | Not supported | A restore uses the volume snapshot in your Kubernetes cluster as its data source. It cannot cross Kubernetes clusters or regions, because snapshots are not copied between them |

To restore from a backup, create a `QdrantClusterRestore` resource. `source` names the snapshot and its namespace, and `destination` names the cluster. Both namespaces must be the namespace of the snapshot:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantClusterRestore
metadata:
  name: "qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-snapshot-restore-01"
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  source:
    snapshotName: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-snapshot-timestamp
    namespace: qdrant-private-cloud
  destination:
    name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
    namespace: qdrant-private-cloud
```

To restore into a new cluster, set the destination to a name that does not exist yet, add `create: true`, and set the `cluster-id` label to the ID of the new cluster:

```yaml
metadata:
  labels:
    cluster-id: "restore-test"
    customer-id: "acme-industries"
spec:
  destination:
    name: qdrant-restore-test
    namespace: qdrant-private-cloud
    create: true
```

The restore phase is one of `Pending`, `Running`, `Succeeded`, `Failed`, or `Skipped`. Read it from the `status` of the resource.

### What a Restore Does

A restore into the same cluster runs these steps:

1. The cluster is suspended, so it is unavailable during the restore.
2. The cluster configuration is replaced by the one captured in the backup. CPU, memory, storage, node count, and Qdrant version revert to their values at backup time.
3. The persistent volume claims are deleted and recreated from the volume snapshots.
4. The cluster is unsuspended.

Data written after the backup is lost.

Restoring into a new cluster is the way to test your recovery plan without touching the running cluster. It needs node capacity for a second cluster.

Because a backup can only be restored in the Kubernetes cluster that holds it, the loss of that cluster or of its region is not covered by backups. Plan high availability and disaster recovery for the Kubernetes cluster and its storage separately.

## Delete a Schedule or a Cluster

| Action | What happens to the backups |
|---|---|
| Delete a schedule | The schedule stops. Existing backups stay until their retention expires |
| Delete a cluster | The schedules of the cluster go away with it. The snapshot resources are not owned by the cluster, so they stay until their retention expires, `retainUnsuccessful` expires, or you delete them. You can restore them into a new cluster in the same namespace |

The snapshots live in your cloud account, so your provider bills you for their storage until they are deleted.
