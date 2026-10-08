---
title: qcloud serverless space backup describe
short_description: "Describe a backup of a serverless space"
description: "Describe a backup of a serverless space"
weight: 98
---

# qcloud serverless space backup describe

Describe a backup of a serverless space

## Synopsis

Describe a backup of a serverless space.

Shows the backup status and statistics together with a snapshot of the space
(name, region and configuration) taken when the backup was created. That snapshot
is used when a new space is created from the backup.

```bash
qcloud serverless space backup describe <backup-id> [flags]
```

## Examples

```bash
# Describe a backup
qcloud serverless space backup describe 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d

# Output as JSON
qcloud serverless space backup describe 9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d --json
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

* [qcloud serverless space backup](/documentation/cloud-cli/reference/qcloud_serverless_space_backup/)	 - Manage backups of serverless spaces


