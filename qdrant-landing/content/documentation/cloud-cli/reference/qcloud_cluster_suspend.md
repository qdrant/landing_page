---
title: qcloud cluster suspend
short_description: "Suspend a cluster"
description: "Suspend a cluster"
weight: 41
---

# qcloud cluster suspend

Suspend a cluster

```bash
qcloud cluster suspend <cluster-id> [flags]
```

## Examples

```bash
# Suspend a cluster
qcloud cluster suspend 7b2ea926-724b-4de2-b73a-8675c42a6ebe --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for suspend
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


