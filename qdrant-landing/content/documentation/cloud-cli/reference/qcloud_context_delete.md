---
title: qcloud context delete
short_description: "Delete a context"
description: "Delete a context"
weight: 48
---

# qcloud context delete

Delete a context

```bash
qcloud context delete <name> [flags]
```

## Examples

```bash
# Delete a context
qcloud context delete staging

# Delete without confirmation
qcloud context delete staging --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for delete
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
