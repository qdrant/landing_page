---
title: qcloud serverless space describe
short_description: "Describe a space"
description: "Describe a space"
weight: 112
---

# qcloud serverless space describe

Describe a space

## Synopsis

Describe a serverless space.

Shows the space's phase, region and endpoint together with its configuration:
network restrictions, per-collection size limits and search-worker settings.
Limits prefixed with "platform" are derived from the account's quota and cannot
be changed directly.

```bash
qcloud serverless space describe <space-id> [flags]
```

## Examples

```bash
# Describe a space
qcloud serverless space describe 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Output as JSON
qcloud serverless space describe 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --json
```

## Options

```bash
  -h, --help   help for describe
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


