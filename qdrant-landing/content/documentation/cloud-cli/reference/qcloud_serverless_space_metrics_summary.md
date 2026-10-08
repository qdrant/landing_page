---
title: qcloud serverless space metrics summary
short_description: "Show a metrics overview of a space's collections"
description: "Show a metrics overview of a space's collections"
weight: 119
---

# qcloud serverless space metrics summary

Show a metrics overview of a space's collections

## Synopsis

Show a metrics overview of the collections in a serverless space.

For every collection, the overview reports the current point count, storage
usage and number of search workers, together with the search rate, write rate
and average search latency. The server averages the rates and latency over
several intervals; the table shows the shortest one, which is named above the
table. Use --json to get the averages for all intervals.

The space's quota is shown above the table so that storage and worker usage
can be compared against the per-collection limits.

By default, all collections are fetched automatically across multiple pages.
Use --page-size and --page-token for manual pagination.

```bash
qcloud serverless space metrics summary <space-id> [flags]
```

## Examples

```bash
# Show an overview of all collections in a space
qcloud serverless space metrics summary 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Only show a single collection
qcloud serverless space metrics summary 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --collection products

# Only show collections whose name contains "staging"
qcloud serverless space metrics summary 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --collection-contains staging

# Output all interval averages as JSON
qcloud serverless space metrics summary 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --json
```

## Options

```bash
      --collection string            Only include the collection with this exact name
      --collection-contains string   Only include collections whose name contains this substring
  -h, --help                         help for summary
      --page-size int32              Maximum number of collections to return per page (manual pagination mode)
      --page-token string            Page token from a previous response to resume from (manual pagination mode)
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

* [qcloud serverless space metrics](/documentation/cloud-cli/reference/qcloud_serverless_space_metrics/)	 - Show metrics of a space's collections


