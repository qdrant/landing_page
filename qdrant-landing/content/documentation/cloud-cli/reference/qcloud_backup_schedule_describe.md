---
title: qcloud backup schedule describe
short_description: "Describe a backup schedule"
description: "Describe a backup schedule"
weight: 20
---

# qcloud backup schedule describe

Describe a backup schedule

## Synopsis

Describe a backup schedule.

The --cluster-id flag is required because the API requires the cluster ID to look up a schedule by ID.

```bash
qcloud backup schedule describe <schedule-id> [flags]
```

## Options

```bash
      --cluster-id string   Cluster ID (required)
  -h, --help                help for describe
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

* [qcloud backup schedule](/documentation/cloud-cli/reference/qcloud_backup_schedule/)	 - Manage backup schedules


