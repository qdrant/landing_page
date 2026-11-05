---
title: qcloud account member describe
short_description: "Describe an account member"
description: "Describe an account member"
weight: 6
---

# qcloud account member describe

Describe an account member

## Synopsis

Describe a member of the current account by their user ID.

Shows the member's user details and whether they are the account owner.

```bash
qcloud account member describe <user-id> [flags]
```

## Examples

```bash
# Describe a member
qcloud account member describe a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Output as JSON
qcloud account member describe a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json
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

* [qcloud account member](/documentation/cloud-cli/reference/qcloud_account_member/)	 - Manage account members


