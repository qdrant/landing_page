---
title: qcloud iam role list
short_description: "List all roles"
description: "List all roles"
weight: 72
---

# qcloud iam role list

List all roles

## Synopsis

List all roles for the account, including both system and custom roles.

System roles are managed by Qdrant and cannot be modified. Custom roles are
created and managed by the account administrator.

```bash
qcloud iam role list [flags]
```

## Examples

```bash
# List all roles
qcloud iam role list

# Output as JSON
qcloud iam role list --json
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

* [qcloud iam role](/documentation/cloud-cli/reference/qcloud_iam_role/)	 - Manage roles in Qdrant Cloud
