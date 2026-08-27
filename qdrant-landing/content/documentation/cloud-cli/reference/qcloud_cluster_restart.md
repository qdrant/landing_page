---
title: qcloud cluster restart
short_description: "Restart a cluster"
description: "Restart a cluster"
weight: 39
---

# qcloud cluster restart

Restart a cluster

```bash
qcloud cluster restart <cluster-id> [flags]
```

## Examples

```bash
# Restart a cluster (prompts for confirmation)
qcloud cluster restart 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Restart without confirmation and wait for healthy status
qcloud cluster restart 7b2ea926-724b-4de2-b73a-8675c42a6ebe --force --wait
```

## Options

```bash
  -f, --force                   Skip confirmation prompt
  -h, --help                    help for restart
      --wait                    Wait for the cluster to restart to a healthy status
      --wait-timeout duration   Maximum time to wait for cluster the cluster to restart to healthy status (default 10m0s)
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
