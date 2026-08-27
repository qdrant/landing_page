---
title: qcloud account
short_description: "Manage Qdrant Cloud accounts"
description: "Manage Qdrant Cloud accounts"
weight: 2
---

# qcloud account

Manage Qdrant Cloud accounts

## Synopsis

Manage Qdrant Cloud accounts and their members.

Use these commands to list, inspect, and update accounts that the current
management key has access to. Account member commands show who belongs to the
current account and whether they are the owner.

## Options

```bash
  -h, --help   help for account
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

* [qcloud](/documentation/cloud-cli/reference/)	 - Qdrant Cloud CLI
* [qcloud account describe](/documentation/cloud-cli/reference/qcloud_account_describe/)	 - Describe an account
* [qcloud account list](/documentation/cloud-cli/reference/qcloud_account_list/)	 - List accounts
* [qcloud account member](/documentation/cloud-cli/reference/qcloud_account_member/)	 - Manage account members
* [qcloud account update](/documentation/cloud-cli/reference/qcloud_account_update/)	 - Update an account
