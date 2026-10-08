---
title: qcloud serverless space backup create
short_description: "Create a backup of a serverless space"
description: "Create a backup of a serverless space"
weight: 96
---

# qcloud serverless space backup create

Create a backup of a serverless space

## Synopsis

Create an on-demand backup of a serverless space.

By default the whole space is backed up; use --collection to back up a single
collection. Without --retention-days the backup is kept until it is deleted.
The backup runs asynchronously; use "qcloud serverless space backup describe" to
follow its status and progress.

```bash
qcloud serverless space backup create [flags]
```

## Examples

```bash
# Back up a whole space
qcloud serverless space backup create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Back up a single collection and keep the backup for 7 days
qcloud serverless space backup create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --collection products --retention-days 7
```

## Options

```bash
      --collection string       Only back up this collection (default: the whole space)
  -h, --help                    help for create
      --retention-days uint32   Retention period in days (1-365) (default: keep indefinitely)
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

* [qcloud serverless space backup](/documentation/cloud-cli/reference/qcloud_serverless_space_backup/)	 - Manage backups of serverless spaces


