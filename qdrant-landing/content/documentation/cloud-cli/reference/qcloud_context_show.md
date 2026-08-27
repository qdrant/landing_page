---
title: qcloud context show
short_description: "Show the active context configuration"
description: "Show the active context configuration"
weight: 51
---

# qcloud context show

Show the active context configuration

```bash
qcloud context show [flags]
```

## Examples

```bash
# Show the active context
qcloud context show
```

## Options

```bash
  -h, --help   help for show
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
