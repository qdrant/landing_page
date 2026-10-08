---
title: qcloud serverless space backup list
short_description: "List backups of serverless spaces"
description: "List backups of serverless spaces"
weight: 99
---

# qcloud serverless space backup list

List backups of serverless spaces

## Synopsis

List backups of serverless spaces in the current account.

Backups can be filtered by space, by the schedule that created them, and by
collection. The COLLECTION column shows "(all)" for backups of a whole space.

By default, all backups are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination; the next page token is
included in the JSON output when more pages exist.

```bash
qcloud serverless space backup list [flags]
```

## Examples

```bash
# List all backups in the account
qcloud serverless space backup list

# List backups of a space
qcloud serverless space backup list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# List backups of a single collection created by a schedule
qcloud serverless space backup list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --schedule-id 3f1c2b4a-8d7e-4f6a-9b0c-1d2e3f4a5b6c --collection products
```

## Options

```bash
      --collection string    Filter by collection name
  -h, --help                 help for list
      --no-headers           Do not print column headers
      --page-size int32      Maximum number of backups to return per page (manual pagination mode)
      --page-token string    Page token from a previous response to resume from (manual pagination mode)
      --schedule-id string   Filter by the ID of the backup schedule that created the backups
      --space-id string      Filter by space ID
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


