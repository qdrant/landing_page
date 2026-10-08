---
title: qcloud serverless space delete
short_description: "Delete a space"
description: "Delete a space"
weight: 111
---

# qcloud serverless space delete

Delete a space

## Synopsis

Delete a serverless space and all of its collections.

Deletion cannot be undone. Backups of the space are kept by default so that the
data can still be restored into a new space with "create-from-backup"; pass
--delete-backups to remove them as well.

```bash
qcloud serverless space delete <space-id> [flags]
```

## Examples

```bash
# Delete a space (prompts for confirmation)
qcloud serverless space delete 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Delete a space and its backups without confirmation
qcloud serverless space delete 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --delete-backups --force
```

## Options

```bash
      --delete-backups   Also delete all backups of the space
  -f, --force            Skip confirmation prompt
  -h, --help             help for delete
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

* [qcloud serverless space](/documentation/cloud-cli/reference/qcloud_serverless_space/)	 - Manage serverless spaces


