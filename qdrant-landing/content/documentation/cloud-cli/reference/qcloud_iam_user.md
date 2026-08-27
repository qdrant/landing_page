---
title: qcloud iam user
short_description: "Manage users in Qdrant Cloud"
description: "Manage users in Qdrant Cloud"
weight: 75
---

# qcloud iam user

Manage users in Qdrant Cloud

## Synopsis

Manage users in the Qdrant Cloud account.

Provides commands to list users, view user details and assigned roles, and
manage role assignments.

## Options

```bash
  -h, --help   help for user
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
* [qcloud iam user assign-role](/documentation/cloud-cli/reference/qcloud_iam_user_assign-role/)	 - Assign one or more roles to a user
* [qcloud iam user delete](/documentation/cloud-cli/reference/qcloud_iam_user_delete/)	 - Delete a user
* [qcloud iam user describe](/documentation/cloud-cli/reference/qcloud_iam_user_describe/)	 - Describe a user and their assigned roles
* [qcloud iam user list](/documentation/cloud-cli/reference/qcloud_iam_user_list/)	 - List users in the account
* [qcloud iam user remove-role](/documentation/cloud-cli/reference/qcloud_iam_user_remove-role/)	 - Remove one or more roles from a user
