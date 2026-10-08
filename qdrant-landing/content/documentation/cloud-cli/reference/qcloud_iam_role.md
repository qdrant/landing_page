---
title: qcloud iam role
short_description: "Manage roles in Qdrant Cloud"
description: "Manage roles in Qdrant Cloud"
weight: 67
---

# qcloud iam role

Manage roles in Qdrant Cloud

## Synopsis

Manage roles for the Qdrant Cloud account.

Roles define sets of permissions that control access to resources. There are two
types of roles: system roles (immutable, managed by Qdrant) and custom roles
(created and managed by the account). Use these commands to list, inspect, create,
update, and delete custom roles, as well as manage their permissions.

## Options

```bash
  -h, --help   help for role
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

* [qcloud iam](/documentation/cloud-cli/reference/qcloud_iam/)	 - Manage IAM resources in Qdrant Cloud
* [qcloud iam role assign-permission](/documentation/cloud-cli/reference/qcloud_iam_role_assign-permission/)	 - Add permissions to a role
* [qcloud iam role create](/documentation/cloud-cli/reference/qcloud_iam_role_create/)	 - Create a custom role
* [qcloud iam role delete](/documentation/cloud-cli/reference/qcloud_iam_role_delete/)	 - Delete a custom role
* [qcloud iam role describe](/documentation/cloud-cli/reference/qcloud_iam_role_describe/)	 - Describe a role
* [qcloud iam role list](/documentation/cloud-cli/reference/qcloud_iam_role_list/)	 - List all roles
* [qcloud iam role remove-permission](/documentation/cloud-cli/reference/qcloud_iam_role_remove-permission/)	 - Remove permissions from a role
* [qcloud iam role update](/documentation/cloud-cli/reference/qcloud_iam_role_update/)	 - Update a custom role


