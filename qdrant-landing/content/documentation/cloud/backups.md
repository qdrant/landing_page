---
title: Backup Clusters
short_description: "Schedule backups of Qdrant Cloud clusters in the Console, CLI, API, or Terraform, and restore them in place, into a new cluster, or per collection."
description: "Set up scheduled and on-demand backups for Qdrant Cloud clusters with the Console, qcloud CLI, Cloud API, or Terraform, and choose the right restore method for your recovery goal."
weight: 40
---

# Backing up Qdrant Cloud Clusters

Backups protect a cluster against application or system failure. Replication keeps a highly available cluster running while a node is down, but it does not protect against bad writes or deletes. You can also reindex from your own source of truth, but that takes time. Backups cover disaster recovery.

## Create a Backup Schedule

You can schedule backups on a daily, weekly, or monthly basis and keep as many as you need. Free clusters do not have scheduled backups. Use [snapshots](#backups-with-a-snapshot) instead.

In the [Qdrant Cloud Dashboard](https://cloud.qdrant.io):

1. Open the **Cluster Detail Page** and select the **Backups** tab.
2. Set up a backup schedule. **Days of Retention** is the number of days after which a backup is deleted.
3. Or select **Backup now** to take an immediate backup.

![Configure a cluster backup](/documentation/cloud/backup-schedule.png)

You can create multiple schedules for one cluster.

### Schedule With the CLI

With the [`qcloud` CLI](/documentation/cloud-cli/), the schedule is a cron expression in UTC, and the retention is between 1 and 365 days:

```sh
# Back up every day at 02:00 UTC and keep each backup for 7 days
qcloud backup schedule create \
  --cluster-id <CLUSTER_ID> \
  --schedule '0 2 * * *' \
  --retention-days 7

# Take a one-off backup now
qcloud backup create --cluster-id <CLUSTER_ID> --retention-days 7

# List backups and schedules
qcloud backup list
qcloud backup schedule list
```

### Schedule With the Cloud API

The [Cloud API](/documentation/cloud-api/) creates a schedule with a `POST` request. The `retentionPeriod` is a duration in seconds, from `86400s` (1 day) to `31536000s` (365 days). If you leave it out, backups are kept indefinitely.

```sh
curl -X POST \
  "https://api.cloud.qdrant.io/api/cluster/backup/v1/accounts/<ACCOUNT_ID>/backup_schedules" \
  -H "Authorization: apikey <CLOUD_MANAGEMENT_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "backupSchedule": {
      "clusterId": "<CLUSTER_ID>",
      "schedule": "0 2 * * *",
      "retentionPeriod": "604800s"
    }
  }'
```

| Operation | Method and path under `/api/cluster/backup/v1/accounts/<ACCOUNT_ID>` | Permission |
|---|---|---|
| Create a backup | `POST /backups` | `write:backups` |
| List backups | `GET /backups` | `read:backups` |
| Delete a backup | `DELETE /backups/<BACKUP_ID>` | `delete:backups` |
| Restore a backup | `POST /backups/<BACKUP_ID>/restore` | `restore:backups` |
| Create a schedule | `POST /backup_schedules` | `write:backup_schedules` |
| List schedules | `GET /backup_schedules` | `read:backup_schedules` |
| Update a schedule | `PUT /backup_schedules/<SCHEDULE_ID>` | `write:backup_schedules` |
| Delete a schedule | `DELETE /backup_schedules/<SCHEDULE_ID>` | `delete:backup_schedules` |

### Schedule With Terraform

With the [Terraform provider](/documentation/cloud-tools/terraform/), a schedule is a resource that refers to a cluster:

```terraform
resource "qdrant-cloud_accounts_backup_schedule" "daily" {
  cluster_id       = qdrant-cloud_accounts_cluster.example.id
  cron_expression  = "0 2 * * *" // Daily at 02:00
  retention_period = "168h"      // Keep for 7 days
}
```

Use `qdrant-cloud_accounts_manual_backup` for a one-off backup. Set `delete_backups_on_destroy` on the schedule if destroying it should also delete its backups.

## Restore a Backup

Choose the restore method from your recovery goal:

| Goal | Method | Effect on the cluster |
|---|---|---|
| Roll the cluster back to a point in time | Restore into the **same cluster** in the Console, with `qcloud backup restore trigger <backup-id>`, or with the API | The cluster is unavailable while the restore runs. Data written after the backup is lost, and CPU, memory, node count, and Qdrant version revert to their values at backup time |
| Test a restore, or recover without touching the source | Restore into a **new cluster** in the Console, or run `qcloud cluster create-from-backup --backup-id <backup-id> --name <new-name>` | The source cluster stays untouched. The new cluster gets the configuration the source had at backup time |
| Recover a single collection | A [snapshot](#backups-with-a-snapshot) of that collection | Only that collection is affected |
| Replace a cluster with no downtime | [Blue-green deployment](/documentation/tutorials-operations/blue-green-deployment/) | Traffic switches to the new cluster once you have tested it |

You can manage backups in the list of **Available Backups** on the **Backups** tab, where you can restore or delete each one.

![Restore or delete a cluster backup](/documentation/cloud/restore-delete.png)

## Backups With a Snapshot

Qdrant also offers a snapshot API, which creates a snapshot of a specific collection or of your entire cluster. Snapshots are the way to back up free clusters, which only support manual snapshots and restores through the API. For the full API, see [Snapshots](/documentation/snapshots/).

To take a snapshot and recover a collection:

1. Take a snapshot:
   - For a single node cluster, call the snapshot endpoint on the cluster URL.
   - For a multi-node cluster, take a snapshot on each node of the collection. Prepend `node-<N>-` to your cluster URL, as in [Node-Specific Endpoints](/documentation/cloud/cluster-access/#node-specific-endpoints), and call the [snapshot endpoint](/documentation/snapshots/#create-snapshot) on each host. Start with node 0.
   - The response contains the name of the snapshot.
2. Delete and recreate the collection.
3. Recover the snapshot: call the [recover endpoint](/documentation/snapshots/#recover-from-a-url-or-local-file) on each host, with a location that points to the snapshot file, `file:///qdrant/snapshots/{collection_name}/{snapshot_file_name}`.

## Backup Considerations

- Backups are incremental for AWS and GCP clusters. For example, backup number 2 contains only the data that changed since backup number 1, which reduces the total cost of your backups.
- For Azure clusters, backups are based on total disk usage. The cost is half of the disk usage at the time of the backup.
- Restoring into the same cluster resets any change you made to the cluster setup after the backup was taken.
- Before an [upgrade](/documentation/cloud/cluster-upgrades/), take a backup. Restoring it is the way to roll back, because the restore reverts the Qdrant version.
- Restoring is a way to test your recovery plan. Restore into a new cluster and check the data.
