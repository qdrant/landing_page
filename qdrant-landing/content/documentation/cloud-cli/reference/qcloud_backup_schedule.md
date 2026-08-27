---
title: qcloud backup schedule
short_description: "Manage backup schedules"
description: "Manage backup schedules"
weight: 17
---

# qcloud backup schedule

Manage backup schedules

## Options

```bash
  -h, --help   help for schedule
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
* [qcloud backup schedule create](/documentation/cloud-cli/reference/qcloud_backup_schedule_create/)	 - Create a backup schedule for a cluster
* [qcloud backup schedule delete](/documentation/cloud-cli/reference/qcloud_backup_schedule_delete/)	 - Delete a backup schedule
* [qcloud backup schedule describe](/documentation/cloud-cli/reference/qcloud_backup_schedule_describe/)	 - Describe a backup schedule
* [qcloud backup schedule list](/documentation/cloud-cli/reference/qcloud_backup_schedule_list/)	 - List backup schedules
* [qcloud backup schedule update](/documentation/cloud-cli/reference/qcloud_backup_schedule_update/)	 - Update a backup schedule
