---
title: qcloud serverless space backup schedule
short_description: "Manage backup schedules of serverless spaces"
description: "Manage backup schedules of serverless spaces"
weight: 103
---

# qcloud serverless space backup schedule

Manage backup schedules of serverless spaces

## Synopsis

Manage backup schedules of serverless spaces.

A backup schedule creates backups of a space, or of a single collection, on a
cron schedule (in UTC). Every backup created by a schedule inherits its retention
period. A schedule can be paused and resumed without deleting it.

## Examples

```bash
# List the backup schedules of a space
qcloud serverless space backup schedule list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Create a nightly schedule that keeps backups for 14 days
qcloud serverless space backup schedule create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name nightly --schedule "0 2 * * *" --retention-days 14

# Pause a schedule
qcloud serverless space backup schedule update 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c \
  --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --pause
```

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

* [qcloud serverless space backup](/documentation/cloud-cli/reference/qcloud_serverless_space_backup/)	 - Manage backups of serverless spaces
* [qcloud serverless space backup schedule create](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule_create/)	 - Create a backup schedule for a serverless space
* [qcloud serverless space backup schedule delete](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule_delete/)	 - Delete a backup schedule of a serverless space
* [qcloud serverless space backup schedule describe](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule_describe/)	 - Describe a backup schedule of a serverless space
* [qcloud serverless space backup schedule list](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule_list/)	 - List backup schedules of serverless spaces
* [qcloud serverless space backup schedule update](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule_update/)	 - Update a backup schedule of a serverless space


