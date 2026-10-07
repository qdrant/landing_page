---
title: qcloud serverless space key list
short_description: "List API keys for a space"
description: "List API keys for a space"
weight: 110
---

# qcloud serverless space key list

List API keys for a space

## Synopsis

List the API keys of a serverless space.

The ACCESS column shows the global access type of a key, or the per-collection
access rules as "collection:ACCESS" pairs. Secret key values are never listed;
use the POSTFIX column to identify a key.

```bash
qcloud serverless space key list <space-id> [flags]
```

## Examples

```bash
# List API keys for a space
qcloud serverless space key list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Output as JSON
qcloud serverless space key list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --json
```

## Options

```bash
  -h, --help         help for list
      --no-headers   Do not print column headers
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

* [qcloud serverless space key](/documentation/cloud-cli/reference/qcloud_serverless_space_key/)	 - Manage API keys for a space


