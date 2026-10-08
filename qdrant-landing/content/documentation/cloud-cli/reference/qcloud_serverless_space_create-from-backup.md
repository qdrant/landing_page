---
title: qcloud serverless space create-from-backup
short_description: "Create a new space from a backup"
description: "Create a new space from a backup"
weight: 109
---

# qcloud serverless space create-from-backup

Create a new space from a backup

## Synopsis

Create a new serverless space seeded with the data from an existing backup.

The new space is provisioned in the same region and with the same configuration
as the original space at the time the backup was taken. The backup must belong
to the current account. To restore a backup into its original space instead, use
"qcloud serverless space backup restore trigger".

```bash
qcloud serverless space create-from-backup [flags]
```

## Examples

```bash
# Create a space from a backup
qcloud serverless space create-from-backup --backup-id 9d8c7b6a-5e4f-4a3b-8c2d-1e0f9a8b7c6d --name my-restored-space

# Create a space from a backup and wait until it is ready
qcloud serverless space create-from-backup --backup-id 9d8c7b6a-5e4f-4a3b-8c2d-1e0f9a8b7c6d --name my-restored-space --wait
```

## Options

```bash
      --backup-id string        ID of the backup to restore from (required)
  -h, --help                    help for create-from-backup
      --name string             Name for the new space (required)
      --wait                    Wait for the space to become ready
      --wait-timeout duration   Maximum time to wait for the space to become ready (default 10m0s)
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

* [qcloud serverless space](/documentation/cloud-cli/reference/qcloud_serverless_space/)	 - Manage serverless spaces


