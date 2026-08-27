---
title: qcloud iam permission list
short_description: "List all available permissions"
description: "List all available permissions"
weight: 66
---

# qcloud iam permission list

List all available permissions

## Synopsis

List all permissions known in the system for the account.

Permissions are the individual access rights that can be assigned to roles.
Each permission has a value (e.g. "read:clusters") and a category
(e.g. "Cluster").

```bash
qcloud iam permission list [flags]
```

## Examples

```bash
# List all available permissions
qcloud iam permission list

# Output as JSON
qcloud iam permission list --json
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

* [qcloud iam permission](/documentation/cloud-cli/reference/qcloud_iam_permission/)	 - Manage permissions in Qdrant Cloud
