---
title: qcloud context list
short_description: "List all contexts"
description: "List all contexts"
weight: 49
---

# qcloud context list

List all contexts

```bash
qcloud context list [flags]
```

## Examples

```bash
# List all contexts
qcloud context list
```

## Options

```bash
  -h, --help   help for list
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

* [qcloud context](/documentation/cloud-cli/reference/qcloud_context/)	 - Manage named configuration contexts


