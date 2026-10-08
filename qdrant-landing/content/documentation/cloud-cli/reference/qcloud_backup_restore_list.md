---
title: qcloud backup restore list
short_description: "List backup restores"
description: "List backup restores"
weight: 15
---

# qcloud backup restore list

List backup restores

## Synopsis

List backup restore operations in the current account.

Restores can be filtered by cluster.

By default, all restores are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination; the next page token is
included in the JSON output when more pages exist.

```bash
qcloud backup restore list [flags]
```

## Examples

```bash
# List all backup restores in the account
qcloud backup restore list

# List restores of a cluster
qcloud backup restore list --cluster-id 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Manual pagination
qcloud backup restore list --page-size 10 --json
```

## Options

```bash
      --cluster-id string   Filter by cluster ID
  -h, --help                help for list
      --no-headers          Do not print column headers
      --page-size int32     Maximum number of restores to return per page (manual pagination mode)
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

* [qcloud backup restore](/documentation/cloud-cli/reference/qcloud_backup_restore/)	 - Manage backup restores


