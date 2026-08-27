---
title: qcloud backup create
short_description: "Create a backup for a cluster"
description: "Create a backup for a cluster"
weight: 10
---

# qcloud backup create

Create a backup for a cluster

```bash
qcloud backup create [flags]
```

## Options

```bash
      --cluster-id string       Cluster ID to back up (required)
  -h, --help                    help for create
      --retention-days uint32   Retention period in days (1-365) (required)
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
