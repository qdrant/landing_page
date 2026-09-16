---
title: qcloud cluster create-from-backup
short_description: "Create a new cluster from a backup"
description: "Create a new cluster from a backup"
weight: 28
---

# qcloud cluster create-from-backup

Create a new cluster from a backup

## Synopsis

Create a new Qdrant Cloud cluster seeded with the data from an existing backup.

The new cluster is provisioned using the same configuration as the original cluster
at the time the backup was taken. The backup must belong to the current account.

```bash
qcloud cluster create-from-backup [flags]
```

## Examples

```bash
# Create a cluster from a backup
qcloud cluster create-from-backup --backup-id <backup-id> --name my-restored-cluster

# Create a cluster from a backup and wait until it is healthy
qcloud cluster create-from-backup --backup-id <backup-id> --name my-restored-cluster --wait

# Create with a custom wait timeout
qcloud cluster create-from-backup --backup-id <backup-id> --name my-restored-cluster --wait --wait-timeout 20m
```

## Options

```bash
      --backup-id string        ID of the backup to restore from (required)
  -h, --help                    help for create-from-backup
      --name string             Name for the new cluster (required)
      --wait                    Wait for the cluster to become healthy
      --wait-timeout duration   Maximum time to wait for cluster health (default 10m0s)
```

## Options inherited from parent commands

```bash
      --account-id string    Qdrant Cloud Account ID (env: QDRANT_CLOUD_ACCOUNT_ID)
      --api-key string       Management API Key (env: QDRANT_CLOUD_API_KEY)
  -c, --config string        Config file path (env: QDRANT_CLOUD_CONFIG, default ~/.config/qcloud/config.yaml)
      --console-url string   Qdrant Cloud web console base URL (env: QDRANT_CLOUD_CONSOLE_URL, default https://cloud.qdrant.io)
      --context string       Override the active context (env: QDRANT_CLOUD_CONTEXT)
      --debug                Enable debug logging to stderr
      --endpoint string      gRPC API endpoint (env: QDRANT_CLOUD_ENDPOINT, default grpc.cloud.qdrant.io:443)
      --json                 Output as JSON
```

## SEE ALSO

* [qcloud cluster](/documentation/cloud-cli/reference/qcloud_cluster/)	 - Manage Qdrant Cloud clusters


