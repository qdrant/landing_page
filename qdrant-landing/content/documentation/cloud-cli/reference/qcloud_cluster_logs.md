---
title: qcloud cluster logs
short_description: "Retrieve logs for a cluster"
description: "Retrieve logs for a cluster"
weight: 38
---

# qcloud cluster logs

Retrieve logs for a cluster

```bash
qcloud cluster logs <cluster-id> [flags]
```

## Examples

```bash
# Get logs for a cluster
qcloud cluster logs abc-123

# Get logs since a specific date
qcloud cluster logs abc-123 --since 2024-01-01

# Get logs in a specific time range
qcloud cluster logs abc-123 --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z

# Get logs in JSON format
qcloud cluster logs abc-123 --json
```

## Options

```bash
  -h, --help           help for logs
  -s, --since string   Start time for logs (RFC3339 or YYYY-MM-DD, default: 3 days ago)
  -t, --timestamps     Prepend each log line with its timestamp
  -u, --until string   End time for logs (RFC3339 or YYYY-MM-DD, default: now)
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


