---
title: qcloud iam user assign-role
short_description: "Assign one or more roles to a user"
description: "Assign one or more roles to a user"
weight: 76
---

# qcloud iam user assign-role

Assign one or more roles to a user

## Synopsis

Assign one or more roles to a user in the account.

Accepts either a user ID (UUID) or an email address to identify the user.
Each role accepts either a role UUID or a role name, which is
resolved to an ID via the IAM service. Prints the user's resulting roles
after the assignment.

```bash
qcloud iam user assign-role <user-id-or-email> [flags]
```

## Examples

```bash
# Assign a role by name
qcloud iam user assign-role user@example.com --role admin

# Assign a role by ID
qcloud iam user assign-role user@example.com --role 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Assign multiple roles at once
qcloud iam user assign-role user@example.com --role admin --role viewer

# Assign multiple roles at once using comma separated values
qcloud iam user assign-role user@example.com --role admin,viewer
```

## Options

```bash
  -h, --help           help for assign-role
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


