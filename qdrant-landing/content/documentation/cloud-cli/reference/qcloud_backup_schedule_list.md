---
title: qcloud backup schedule list
short_description: "List backup schedules"
description: "List backup schedules"
weight: 21
---

# qcloud backup schedule list

List backup schedules

## Synopsis

List backup schedules in the current account.

Schedules can be filtered by cluster. The NEXT RUN column is computed locally
from the cron expression.

By default, all schedules are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination; the next page token is
included in the JSON output when more pages exist.

```bash
qcloud backup schedule list [flags]
```

## Examples

```bash
# List all backup schedules in the account
qcloud backup schedule list

# List schedules of a cluster
qcloud backup schedule list --cluster-id 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Manual pagination
qcloud backup schedule list --page-size 10 --json
```

## Options

```bash
      --cluster-id string   Filter by cluster ID
  -h, --help                help for list
      --no-headers          Do not print column headers
      --page-size int32     Maximum number of schedules to return per page (manual pagination mode)
      --page-token string   Page token from a previous response to resume from (manual pagination mode)
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


