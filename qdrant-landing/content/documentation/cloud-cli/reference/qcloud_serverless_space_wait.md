---
title: qcloud serverless space wait
short_description: "Wait for a space to become ready"
description: "Wait for a space to become ready"
weight: 114
---

# qcloud serverless space wait

Wait for a space to become ready

## Synopsis

Wait for a serverless space to become ready.

Polls the space until its phase is READY and prints the endpoint. The command
fails as soon as the space is DISABLED or DELETING, printing the reason reported
by the server, or when the timeout expires.

```bash
qcloud serverless space wait <space-id> [flags]
```

## Examples

```bash
# Wait for a space to become ready
qcloud serverless space wait 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Wait with a custom timeout
qcloud serverless space wait 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --timeout 20m
```

## Options

```bash
  -h, --help               help for wait
      --timeout duration   Maximum time to wait for the space to become ready (default 10m0s)
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

* [qcloud serverless space](/documentation/cloud-cli/reference/qcloud_serverless_space/)	 - Manage serverless spaces


