---
title: qcloud backup delete
short_description: "Delete a backup"
description: "Delete a backup"
weight: 11
---

# qcloud backup delete

Delete a backup

```bash
qcloud backup delete <backup-id> [flags]
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

* [qcloud backup](/documentation/cloud-cli/reference/qcloud_backup/)	 - Manage Qdrant Cloud backups
