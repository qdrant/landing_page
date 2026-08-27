---
title: qcloud account describe
short_description: "Describe an account"
description: "Describe an account"
weight: 3
---

# qcloud account describe

Describe an account

## Synopsis

Describe an account by its ID.

If no account ID is provided, the current account (from --account-id, the
active context, or the QDRANT_CLOUD_ACCOUNT_ID environment variable) is used.

```bash
qcloud account describe [account-id] [flags]
```

## Examples

```bash
# Describe the current account
qcloud account describe

# Describe a specific account
qcloud account describe a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Output as JSON
qcloud account describe --json
```

## Options

```bash
  -h, --help   help for describe
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

* [qcloud account](/documentation/cloud-cli/reference/qcloud_account/)	 - Manage Qdrant Cloud accounts
