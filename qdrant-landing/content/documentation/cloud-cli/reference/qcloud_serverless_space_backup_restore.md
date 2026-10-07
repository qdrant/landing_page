---
title: qcloud serverless space backup restore
short_description: "Manage restores of serverless space backups"
description: "Manage restores of serverless space backups"
weight: 94
---

# qcloud serverless space backup restore

Manage restores of serverless space backups

## Synopsis

Manage restores of serverless space backups.

A restore writes the data of a backup back into the space it was taken from,
replacing the current data of the backed-up collections. To restore into a new
space instead, use "qcloud serverless space create-from-backup".

## Examples

```bash
# Restore a backup into its original space
qcloud serverless space backup restore trigger 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d

# Track the progress of restores for a space
qcloud serverless space backup restore list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60
```

## Options

```bash
  -h, --help   help for restore
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

* [qcloud serverless space backup](/documentation/cloud-cli/reference/qcloud_serverless_space_backup/)	 - Manage backups of serverless spaces
* [qcloud serverless space backup restore list](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_restore_list/)	 - List restores of serverless space backups
* [qcloud serverless space backup restore trigger](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_restore_trigger/)	 - Restore a backup into its original space


