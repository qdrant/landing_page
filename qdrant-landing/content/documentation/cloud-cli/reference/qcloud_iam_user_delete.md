---
title: qcloud iam user delete
short_description: "Delete a user"
description: "Delete a user"
weight: 77
---

# qcloud iam user delete

Delete a user

## Synopsis

Delete a user from Qdrant Cloud.

Accepts either a user ID (UUID) or an email address to identify the user.
Deleting a user is permanent and cannot be undone. Deletion fails if the user
still owns any accounts; ownership of those accounts must be transferred first.

A confirmation prompt is shown unless --force is passed.

```bash
qcloud iam user delete <user-id-or-email> [flags]
```

## Examples

```bash
# Delete a user by email (with confirmation prompt)
qcloud iam user delete user@example.com

# Delete a user by ID
qcloud iam user delete 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Delete without confirmation
qcloud iam user delete user@example.com --force
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

* [qcloud iam user](/documentation/cloud-cli/reference/qcloud_iam_user/)	 - Manage users in Qdrant Cloud


