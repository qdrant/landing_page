---
title: qcloud serverless space backup schedule create
short_description: "Create a backup schedule for a serverless space"
description: "Create a backup schedule for a serverless space"
weight: 98
---

# qcloud serverless space backup schedule create

Create a backup schedule for a serverless space

## Synopsis

Create a backup schedule for a serverless space.

The --schedule flag takes a standard cron expression evaluated in UTC (for example
"0 2 * * *" for every day at 02:00), or a descriptor such as "@daily". By default
the whole space is backed up; use --collection to back up a single collection.
Without --retention-days, created backups are kept until they are deleted.

```bash
qcloud serverless space backup schedule create [flags]
```

## Examples

```bash
# Back up a space every night at 02:00 UTC
qcloud serverless space backup schedule create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name nightly --schedule "0 2 * * *"

# Back up a single collection every hour and keep backups for 7 days
qcloud serverless space backup schedule create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name products-hourly --schedule @hourly --collection products --retention-days 7
```

## Options

```bash
      --collection string       Only back up this collection (default: the whole space)
  -h, --help                    help for create
      --name string             Name of the schedule (required)
      --retention-days uint32   Retention period of created backups in days (1-365) (default: keep indefinitely)
      --schedule string         Cron schedule expression in UTC, e.g. '0 2 * * *' (required)
      --space-id string         ID of the space to back up (required)
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


