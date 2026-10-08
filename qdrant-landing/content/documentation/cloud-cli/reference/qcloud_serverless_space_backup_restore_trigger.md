---
title: qcloud serverless space backup restore trigger
short_description: "Restore a backup into its original space"
description: "Restore a backup into its original space"
weight: 102
---

# qcloud serverless space backup restore trigger

Restore a backup into its original space

## Synopsis

Restore a backup into its original serverless space.

The restore runs asynchronously and replaces the current data of the backed-up
collections in the space. Use "qcloud serverless space backup restore list" to
follow its progress.

```bash
qcloud serverless space backup restore trigger <backup-id> [flags]
```

## Examples

```bash
# Restore a backup (prompts for confirmation)
qcloud serverless space backup restore trigger 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d

# Restore a backup without confirmation
qcloud serverless space backup restore trigger 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for trigger
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

* [qcloud serverless space backup restore](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_restore/)	 - Manage restores of serverless space backups


