---
title: qcloud iam role remove-permission
short_description: "Remove permissions from a role"
description: "Remove permissions from a role"
weight: 73
---

# qcloud iam role remove-permission

Remove permissions from a role

## Synopsis

Remove permissions from a custom role.

Fetches the role's current permissions, removes the specified ones, and updates
the role. A role must retain at least one permission.

```bash
qcloud iam role remove-permission <role-id> [flags]
```

## Examples

```bash
# Remove a single permission
qcloud iam role remove-permission 7b2ea926-724b-4de2-b73a-8675c42a6ebe --permission read:clusters

# Remove multiple permissions
qcloud iam role remove-permission 7b2ea926-724b-4de2-b73a-8675c42a6ebe \
  --permission read:clusters --permission read:backups
```

## Options

```bash
  -h, --help                 help for remove-permission
      --permission strings   Permission to remove (repeatable)
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

* [qcloud iam role](/documentation/cloud-cli/reference/qcloud_iam_role/)	 - Manage roles in Qdrant Cloud


