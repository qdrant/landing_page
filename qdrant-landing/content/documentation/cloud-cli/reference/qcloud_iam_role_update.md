---
title: qcloud iam role update
short_description: "Update a custom role"
description: "Update a custom role"
weight: 74
---

# qcloud iam role update

Update a custom role

## Synopsis

Update the name or description of a custom role.

Only custom roles can be updated. System roles are managed by Qdrant and cannot
be modified. To change a role's permissions, use the assign-permission and
remove-permission subcommands.

```bash
qcloud iam role update <role-id> [flags]
```

## Examples

```bash
# Rename a role
qcloud iam role update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --name "New Name"

# Update the description
qcloud iam role update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --description "Updated description"
```

## Options

```bash
      --description string   New description for the role
  -h, --help                 help for update
      --name string          New name for the role
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


