---
title: qcloud serverless space list
short_description: "List all spaces"
description: "List all spaces"
weight: 111
---

# qcloud serverless space list

List all spaces

## Synopsis

List all serverless spaces in the current account.

By default, all spaces are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination; the next page token is
included in the JSON output when more pages exist.

Use --cloud-region to only list the spaces hosted in a specific region.

```bash
qcloud serverless space list [flags]
```

## Examples

```bash
# List all spaces
qcloud serverless space list

# List spaces in a specific region
qcloud serverless space list --cloud-region eu-central-1

# List spaces in JSON format
qcloud serverless space list --json

# Manual pagination
qcloud serverless space list --page-size 10
```

## Options

```bash
      --cloud-region string   Filter by cloud region ID
  -h, --help                  help for list
      --no-headers            Do not print column headers
      --page-size int32       Maximum number of spaces to return per page (manual pagination mode)
      --page-token string     Page token from a previous response to resume from (manual pagination mode)
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


