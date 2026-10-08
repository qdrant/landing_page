---
title: qcloud account member list
short_description: "List account members"
description: "List account members"
weight: 7
---

# qcloud account member list

List account members

## Synopsis

List all members of the current account.

Each member has an associated user record and an ownership flag. Use
"qcloud iam user list" to see users with their status, or this command to
see who is in the account and who owns it.

```bash
qcloud account member list [flags]
```

## Examples

```bash
# List all members
qcloud account member list

# Output as JSON
qcloud account member list --json
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

* [qcloud account member](/documentation/cloud-cli/reference/qcloud_account_member/)	 - Manage account members


