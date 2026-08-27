---
title: qcloud iam role delete
short_description: "Delete a custom role"
description: "Delete a custom role"
weight: 70
---

# qcloud iam role delete

Delete a custom role

## Synopsis

Delete a custom role from the account.

Only custom roles can be deleted. System roles are managed by Qdrant and cannot
be removed.

```bash
qcloud iam role delete <role-id> [flags]
```

## Examples

```bash
# Delete a role (with confirmation prompt)
qcloud iam role delete 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Delete without confirmation
qcloud iam role delete 7b2ea926-724b-4de2-b73a-8675c42a6ebe --force
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

* [qcloud iam role](/documentation/cloud-cli/reference/qcloud_iam_role/)	 - Manage roles in Qdrant Cloud
