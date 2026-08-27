---
title: qcloud cluster wait
short_description: "Wait for a cluster to become healthy"
description: "Wait for a cluster to become healthy"
weight: 46
---

# qcloud cluster wait

Wait for a cluster to become healthy

```bash
qcloud cluster wait <cluster-id> [flags]
```

## Examples

```bash
# Wait for a cluster to become healthy
qcloud cluster wait 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Wait with a custom timeout
qcloud cluster wait 7b2ea926-724b-4de2-b73a-8675c42a6ebe --timeout 30m
```

## Options

```bash
  -h, --help               help for wait
      --timeout duration   Maximum time to wait for the cluster to become healthy (default 10m0s)
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
