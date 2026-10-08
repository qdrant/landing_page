---
title: qcloud serverless cloud-region describe
short_description: "Describe a cloud region for serverless spaces"
description: "Describe a cloud region for serverless spaces"
weight: 89
---

# qcloud serverless cloud-region describe

Describe a cloud region for serverless spaces

## Synopsis

Describe a cloud region in which serverless spaces can be created.

Shows the region's display name, whether it currently accepts new spaces, and
its geographical location.

```bash
qcloud serverless cloud-region describe <region-id> [flags]
```

## Examples

```bash
# Describe a region
qcloud serverless cloud-region describe eu-central-1

# Output as JSON
qcloud serverless cloud-region describe eu-central-1 --json
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

* [qcloud serverless cloud-region](/documentation/cloud-cli/reference/qcloud_serverless_cloud-region/)	 - Explore cloud regions for serverless spaces


