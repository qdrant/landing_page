---
title: qcloud serverless space backup schedule describe
short_description: "Describe a backup schedule of a serverless space"
description: "Describe a backup schedule of a serverless space"
weight: 106
---

# qcloud serverless space backup schedule describe

Describe a backup schedule of a serverless space

## Synopsis

Describe a backup schedule of a serverless space.

Shows the cron expression together with the next time it fires, the retention
period applied to created backups, and whether the schedule is paused. The
--space-id flag is required because the API looks up schedules within a space.

```bash
qcloud serverless space backup schedule describe <schedule-id> [flags]
```

## Examples

```bash
# Describe a backup schedule
qcloud serverless space backup schedule describe 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c \
  --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60
```

## Options

```bash
  -h, --help              help for describe
      --space-id string   ID of the space the schedule belongs to (required)
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


