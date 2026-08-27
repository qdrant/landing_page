---
title: qcloud account update
short_description: "Update an account"
description: "Update an account"
weight: 8
---

# qcloud account update

Update an account

## Synopsis

Update an account's name or company information.

If no account ID is provided, the current account (from --account-id, the
active context, or the QDRANT_CLOUD_ACCOUNT_ID environment variable) is used.

Only flags that are explicitly set are applied. Unset flags leave the existing
values unchanged.

```bash
qcloud account update [account-id] [flags]
```

## Examples

```bash
# Rename the current account
qcloud account update --name "Production Account"

# Update company information on a specific account
qcloud account update a1b2c3d4-e5f6-7890-abcd-ef1234567890 --company-name "Acme Corp" --company-domain acme.com

# Output as JSON
qcloud account update --name "New Name" --json
```

## Options

```bash
      --company-domain string   Company domain
      --company-name string     Company name
  -h, --help                    help for update
      --name string             New account name
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
