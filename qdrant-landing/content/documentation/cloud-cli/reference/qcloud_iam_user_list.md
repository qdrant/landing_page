---
title: qcloud iam user list
short_description: "List users in the account"
description: "List users in the account"
weight: 79
---

# qcloud iam user list

List users in the account

## Synopsis

List users in the account.

Lists all users who are members of the current account. Requires the read:users
permission.

```bash
qcloud iam user list [flags]
```

## Examples

```bash
# List all users in the account
qcloud iam user list

# Output as JSON
qcloud iam user list --json
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

* [qcloud iam user](/documentation/cloud-cli/reference/qcloud_iam_user/)	 - Manage users in Qdrant Cloud
