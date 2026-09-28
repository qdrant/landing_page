---
title: qcloud cluster key create
short_description: "Create an API key for a cluster"
description: "Create an API key for a cluster"
weight: 34
---

# qcloud cluster key create

Create an API key for a cluster

```bash
qcloud cluster key create <cluster-id> [flags]
```

## Examples

```bash
# Create an API key
qcloud cluster key create 7b2ea926-724b-4de2-b73a-8675c42a6ebe --name my-key

# Create a read-only key with expiration
qcloud cluster key create 7b2ea926-724b-4de2-b73a-8675c42a6ebe \
  --name read-key --access-type read-only --expires 2025-12-31

# Create a key and wait for it to become active on the cluster
qcloud cluster key create 7b2ea926-724b-4de2-b73a-8675c42a6ebe \
  --name my-key --wait
```

## Options

```bash
      --access-type string      Access type: manage or read-only (default: server assigns manage)
      --expires string          Expiration date in YYYY-MM-DD format
  -h, --help                    help for create
      --name string             Name of the API key (required)
      --wait                    Wait for the API key to become active on the cluster
      --wait-timeout duration   Maximum time to wait for the API key to become active (default 1m0s)
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


