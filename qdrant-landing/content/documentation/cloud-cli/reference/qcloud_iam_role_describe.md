---
title: qcloud iam role describe
short_description: "Describe a role"
description: "Describe a role"
weight: 71
---

# qcloud iam role describe

Describe a role

## Synopsis

Display detailed information about a role, including its name, type,
description, and the full list of assigned permissions.

```bash
qcloud iam role describe <role-id> [flags]
```

## Examples

```bash
# Describe a role
qcloud iam role describe 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Output as JSON
qcloud iam role describe 7b2ea926-724b-4de2-b73a-8675c42a6ebe --json
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

* [qcloud iam role](/documentation/cloud-cli/reference/qcloud_iam_role/)	 - Manage roles in Qdrant Cloud
