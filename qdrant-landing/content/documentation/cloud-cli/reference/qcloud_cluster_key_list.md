---
title: qcloud cluster key list
short_description: "List API keys for a cluster"
description: "List API keys for a cluster"
weight: 36
---

# qcloud cluster key list

List API keys for a cluster

```bash
qcloud cluster key list <cluster-id> [flags]
```

## Examples

```bash
# List API keys for a cluster
qcloud cluster key list 7b2ea926-724b-4de2-b73a-8675c42a6ebe
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

* [qcloud cluster key](/documentation/cloud-cli/reference/qcloud_cluster_key/)	 - Manage API keys for a cluster


