---
title: qcloud iam user describe
short_description: "Describe a user and their assigned roles"
description: "Describe a user and their assigned roles"
weight: 78
---

# qcloud iam user describe

Describe a user and their assigned roles

## Synopsis

Describe a user and their assigned roles.

Accepts either a user ID (UUID) or an email address. Displays the user's
details and the roles currently assigned to them in the account.

```bash
qcloud iam user describe <user-id-or-email> [flags]
```

## Examples

```bash
# Describe a user by ID
qcloud iam user describe 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Describe a user by email
qcloud iam user describe user@example.com

# Output as JSON
qcloud iam user describe user@example.com --json
```

## Options

```bash
  -h, --help   help for describe
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


