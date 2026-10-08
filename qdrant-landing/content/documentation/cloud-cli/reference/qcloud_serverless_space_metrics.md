---
title: qcloud serverless space metrics
short_description: "Show metrics of a space's collections"
description: "Show metrics of a space's collections"
weight: 118
---

# qcloud serverless space metrics

Show metrics of a space's collections

## Synopsis

Show metrics of the collections in a serverless space.

Metrics are reported per collection: request rates, search latency, point
counts, storage usage and the number of search workers. The summary command
gives a current overview, while the usage command reports time series over a
chosen period. Both also report the space's quota so that usage can be compared
against the limits.

## Examples

```bash
# Show a current overview of all collections in a space
qcloud serverless space metrics summary 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Show usage over the last 24 hours
qcloud serverless space metrics usage 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --since 24h
```

## Options

```bash
  -h, --help   help for metrics
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

* [qcloud serverless space](/documentation/cloud-cli/reference/qcloud_serverless_space/)	 - Manage serverless spaces
* [qcloud serverless space metrics summary](/documentation/cloud-cli/reference/qcloud_serverless_space_metrics_summary/)	 - Show a metrics overview of a space's collections
* [qcloud serverless space metrics usage](/documentation/cloud-cli/reference/qcloud_serverless_space_metrics_usage/)	 - Show usage metrics of a space's collections over time


