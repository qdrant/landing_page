---
title: qcloud serverless space backup schedule update
short_description: "Update a backup schedule of a serverless space"
description: "Update a backup schedule of a serverless space"
weight: 102
---

# qcloud serverless space backup schedule update

Update a backup schedule of a serverless space

## Synopsis

Update a backup schedule of a serverless space.

Only the fields whose flags are given are changed. --pause stops the schedule from
creating new backups immediately and --resume starts it again; the schedule and
its existing backups are kept while paused. Pausing an already paused schedule
keeps its original pause time, while a pause scheduled for the future is brought
forward to now. The --space-id flag is required
because the API looks up schedules within a space.

```bash
qcloud serverless space backup schedule update <schedule-id> [flags]
```

## Examples

```bash
# Change the schedule to run every 6 hours
qcloud serverless space backup schedule update 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c \
  --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --schedule "0 */6 * * *"

# Pause a schedule
qcloud serverless space backup schedule update 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c \
  --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --pause

# Resume a schedule and change its retention
qcloud serverless space backup schedule update 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c \
  --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --resume --retention-days 30
```

## Options

```bash
  -h, --help                    help for update
      --name string             New name of the schedule
      --pause                   Pause the schedule
      --resume                  Resume a paused schedule
      --retention-days uint32   New retention period of created backups in days (1-365)
      --schedule string         New cron schedule expression in UTC, e.g. '0 2 * * *'
      --space-id string         ID of the space the schedule belongs to (required)
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


