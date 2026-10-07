---
title: qcloud serverless space suggest-name
short_description: "Suggest a name for a new space"
description: "Suggest a name for a new space"
weight: 112
---

# qcloud serverless space suggest-name

Suggest a name for a new space

## Synopsis

Suggest a unique, human-friendly name for a new space.

The suggested name is not reserved: it is only guaranteed to be unused in the
current account at the time of the call. "qcloud serverless space create" uses
the same suggestion automatically when --name is omitted.

```bash
qcloud serverless space suggest-name [flags]
```

## Examples

```bash
# Print a suggested space name
qcloud serverless space suggest-name

# Use the suggestion in a script
qcloud serverless space create --cloud-region eu-central-1 --name "$(qcloud serverless space suggest-name)"
```

## Options

```bash
  -h, --help   help for suggest-name
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


