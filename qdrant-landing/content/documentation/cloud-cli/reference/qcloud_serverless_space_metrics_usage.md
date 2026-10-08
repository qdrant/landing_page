---
title: qcloud serverless space metrics usage
short_description: "Show usage metrics of a space's collections over time"
description: "Show usage metrics of a space's collections over time"
weight: 120
---

# qcloud serverless space metrics usage

Show usage metrics of a space's collections over time

## Synopsis

Show usage metrics of the collections in a serverless space over a period.

The server returns a time series per collection for the search rate, write
rate, search latency, point count, storage usage and number of search workers.
The table condenses each series: point count, storage and workers show the
latest value, while request rates and latency show the average and maximum over
the period. Use --json to get the full time series.

When --since is omitted, the period covers the last hour.

By default, all collections are fetched automatically across multiple pages.
Use --page-size and --page-token for manual pagination.

```bash
qcloud serverless space metrics usage <space-id> [flags]
```

## Examples

```bash
# Show usage over the last hour
qcloud serverless space metrics usage 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Show usage over the last 24 hours
qcloud serverless space metrics usage 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --since 24h

# Show usage of a single collection on a specific day
qcloud serverless space metrics usage 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --collection products --since 2026-10-01 --until 2026-10-01

# Export the full time series as JSON
qcloud serverless space metrics usage 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --since 7d --json
```

## Options

```bash
      --aggregator string            Aggregation function applied to the time series (sum, avg, max, min; default sum)
      --collection string            Only include the collection with this exact name
      --collection-contains string   Only include collections whose name contains this substring
  -h, --help                         help for usage
      --page-size int32              Maximum number of collections to return per page (manual pagination mode)
      --page-token string            Page token from a previous response to resume from (manual pagination mode)
      --since string                 Start of the period (RFC3339, YYYY-MM-DD, or a duration ago such as 6h or 7d; default 1h ago)
      --until string                 End of the period (RFC3339, YYYY-MM-DD, or a duration ago such as 1h; default now)
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


