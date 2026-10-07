---
title: qcloud serverless space backup schedule delete
short_description: "Delete a backup schedule of a serverless space"
description: "Delete a backup schedule of a serverless space"
weight: 99
---

# qcloud serverless space backup schedule delete

Delete a backup schedule of a serverless space

## Synopsis

Delete a backup schedule of a serverless space.

The schedule stops creating backups. Backups it already created are kept by
default; pass --delete-backups to remove them as well.

```bash
qcloud serverless space backup schedule delete <schedule-id> [flags]
```

## Examples

```bash
# Delete a schedule (prompts for confirmation)
qcloud serverless space backup schedule delete 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c

# Delete a schedule and all backups it created, without confirmation
qcloud serverless space backup schedule delete 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c --delete-backups --force
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

* [qcloud serverless space backup schedule](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule/)	 - Manage backup schedules of serverless spaces


