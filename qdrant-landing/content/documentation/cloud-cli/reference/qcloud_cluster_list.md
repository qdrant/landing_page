---
title: qcloud cluster list
short_description: "List all clusters"
description: "List all clusters"
weight: 37
---

# qcloud cluster list

List all clusters

## Synopsis

List all clusters in the current account.

By default, all clusters are fetched automatically across multiple pages.

Use --page-size and --page-token for manual pagination:
  --page-size limits how many clusters are returned per call.
  --page-token resumes from a specific page (token is printed when more pages exist).
  If --page-token is omitted, listing starts from the beginning.

Use --cloud-provider and --cloud-region to filter results server-side:
  --cloud-provider filters clusters by cloud provider ID (e.g. aws, gcp).
  --cloud-region filters clusters by cloud provider region ID (e.g. us-east-1).

```bash
qcloud cluster list [flags]
```

## Examples

```bash
# List all clusters
qcloud cluster list

# List clusters in JSON format
qcloud cluster list --json

# Filter by cloud provider and region
qcloud cluster list --cloud-provider aws --cloud-region eu-central-1

# Manual pagination
qcloud cluster list --page-size 10
```

## Options

```bash
      --cloud-provider string   Filter by cloud provider ID
      --cloud-region string     Filter by cloud provider region ID
  -h, --help                    help for list
      --no-headers              Do not print column headers
      --page-size int32         Maximum number of clusters to return per page (manual pagination mode)
      --page-token string       Page token from a previous response to resume from (manual pagination mode)
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

* [qcloud cluster](/documentation/cloud-cli/reference/qcloud_cluster/)	 - Manage Qdrant Cloud clusters


