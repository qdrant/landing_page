---
title: qcloud serverless space backup delete
short_description: "Delete a backup of a serverless space"
description: "Delete a backup of a serverless space"
weight: 91
---

# qcloud serverless space backup delete

Delete a backup of a serverless space

## Synopsis

Delete a backup of a serverless space.

Deletion cannot be undone; the backup can no longer be restored or used to
create a new space.

```bash
qcloud serverless space backup delete <backup-id> [flags]
```

## Examples

```bash
# Delete a backup (prompts for confirmation)
qcloud serverless space backup delete 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d

# Delete a backup without confirmation
qcloud serverless space backup delete 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for delete
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


