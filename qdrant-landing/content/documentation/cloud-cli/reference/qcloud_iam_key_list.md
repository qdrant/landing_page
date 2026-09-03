---
title: qcloud iam key list
short_description: "List cloud management keys"
description: "List cloud management keys"
weight: 64
---

# qcloud iam key list

List cloud management keys

## Synopsis

List all cloud management keys for the account.

Management keys grant access to the Qdrant Cloud API and are used to authenticate CLI
and API requests. Each key is identified by its ID and a prefix — the prefix represents
the first bytes of the key value and is safe to display.

```bash
qcloud iam key list [flags]
```

## Examples

```bash
# List all management keys for the account
qcloud iam key list

# Output as JSON
qcloud iam key list --json
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

* [qcloud iam key](/documentation/cloud-cli/reference/qcloud_iam_key/)	 - Manage cloud management keys


