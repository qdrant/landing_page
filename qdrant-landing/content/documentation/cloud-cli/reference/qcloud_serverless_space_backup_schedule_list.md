---
title: qcloud serverless space backup schedule list
short_description: "List backup schedules of serverless spaces"
description: "List backup schedules of serverless spaces"
weight: 101
---

# qcloud serverless space backup schedule list

List backup schedules of serverless spaces

## Synopsis

List backup schedules of serverless spaces in the current account.

The PAUSED column shows "scheduled" for schedules with a pause set in the future.
By default, all schedules are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination.

```bash
qcloud serverless space backup schedule list [flags]
```

## Examples

```bash
# List all backup schedules in the account
qcloud serverless space backup schedule list

# List the backup schedules of a space
qcloud serverless space backup schedule list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60
```

## Options

```bash
  -h, --help                help for list
      --no-headers          Do not print column headers
      --page-size int32     Maximum number of schedules to return per page (manual pagination mode)
      --page-token string   Page token from a previous response to resume from (manual pagination mode)
      --space-id string     Filter by space ID
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


