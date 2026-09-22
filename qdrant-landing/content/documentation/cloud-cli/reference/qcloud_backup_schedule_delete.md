---
title: qcloud backup schedule delete
short_description: "Delete a backup schedule"
description: "Delete a backup schedule"
weight: 19
---

# qcloud backup schedule delete

Delete a backup schedule

```bash
qcloud backup schedule delete <schedule-id> [flags]
```

## Options

```bash
      --delete-backups   Also delete all backups created by this schedule
  -f, --force            Skip confirmation prompt
  -h, --help             help for delete
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


