---
title: qcloud iam user remove-role
short_description: "Remove one or more roles from a user"
description: "Remove one or more roles from a user"
weight: 80
---

# qcloud iam user remove-role

Remove one or more roles from a user

## Synopsis

Remove one or more roles from a user in the account.

Accepts either a user ID (UUID) or an email address to identify the user.
Each role accepts either a role UUID or a role name, which is
resolved to an ID via the IAM service. Prints the user's resulting roles
after the removal.

```bash
qcloud iam user remove-role <user-id-or-email> [flags]
```

## Examples

```bash
# Remove a role by name
qcloud iam user remove-role user@example.com --role admin

# Remove a role by ID
qcloud iam user remove-role user@example.com --role 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Remove multiple roles at once
qcloud iam user remove-role user@example.com --role admin --role viewer
```

## Options

```bash
  -h, --help           help for remove-role
  -r, --role strings   A role ID or name
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


