---
title: qcloud iam key delete
short_description: "Delete a cloud management key"
description: "Delete a cloud management key"
weight: 63
---

# qcloud iam key delete

Delete a cloud management key

## Synopsis

Delete a cloud management key from the account.

Deleting a key immediately revokes its access to the Qdrant Cloud API. Any client
using the deleted key will receive authentication errors. This action cannot be undone.

A confirmation prompt is shown unless --force is passed.

```bash
qcloud iam key delete <key-id> [flags]
```

## Examples

```bash
# Delete a management key (with confirmation prompt)
qcloud iam key delete a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Delete without confirmation
qcloud iam key delete a1b2c3d4-e5f6-7890-abcd-ef1234567890 --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for delete
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

* [qcloud iam key](/documentation/cloud-cli/reference/qcloud_iam_key/)	 - Manage cloud management keys
