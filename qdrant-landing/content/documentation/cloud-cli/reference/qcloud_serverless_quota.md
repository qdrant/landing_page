---
title: qcloud serverless quota
short_description: "Show the serverless quota of the account"
description: "Show the serverless quota of the account"
weight: 91
---

# qcloud serverless quota

Show the serverless quota of the account

## Synopsis

Show the serverless quota of the current account.

The quota caps how many spaces the account can create and sets the platform
limits that are copied into every space it owns: the maximum number of
collections per space, the maximum size of a collection and the maximum number
of search workers per collection. A limit of 0 is shown as "unlimited".

```bash
qcloud serverless quota [flags]
```

## Examples

```bash
# Show the serverless quota
qcloud serverless quota

# Output as JSON
qcloud serverless quota --json
```

## Options

```bash
  -h, --help   help for quota
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

* [qcloud serverless](/documentation/cloud-cli/reference/qcloud_serverless/)	 - Manage Qdrant Cloud Serverless resources


