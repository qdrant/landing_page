---
title: qcloud iam role create
short_description: "Create a custom role"
description: "Create a custom role"
weight: 69
---

# qcloud iam role create

Create a custom role

## Synopsis

Create a new custom role for the account.

Custom roles allow fine-grained access control by combining specific permissions.
Use "qcloud iam permission list" to see available permissions.

```bash
qcloud iam role create [flags]
```

## Examples

```bash
# Create a role with specific permissions
qcloud iam role create --name "Cluster Viewer" --permission read:clusters --permission read:cluster-endpoints

# Create a role with a description
qcloud iam role create --name "Backup Manager" --description "Can manage backups" \
  --permission read:clusters --permission read:backups --permission write:backups
```

## Options

```bash
      --description string   Description of the role
  -h, --help                 help for create
      --name string          Name of the role (4-64 characters)
      --permission strings   Permission to assign (repeatable)
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
