---
title: qcloud serverless space backup
short_description: "Manage backups of serverless spaces"
description: "Manage backups of serverless spaces"
weight: 89
---

# qcloud serverless space backup

Manage backups of serverless spaces

## Synopsis

Manage backups of serverless spaces.

A backup captures either a whole space or a single collection of a space. Backups
are created on demand or by a backup schedule, and are kept for their retention
period (indefinitely when no retention is set). A backup can be restored in place
into its original space, or used to create a new space with
"qcloud serverless space create-from-backup".

## Examples

```bash
# List all backups of a space
qcloud serverless space backup list --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Back up a space and keep the backup for 30 days
qcloud serverless space backup create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --retention-days 30

# Create a daily backup schedule
qcloud serverless space backup schedule create --space-id 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name nightly --schedule "0 2 * * *"
```

## Options

```bash
  -h, --help   help for backup
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
* [qcloud serverless space backup create](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_create/)	 - Create a backup of a serverless space
* [qcloud serverless space backup delete](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_delete/)	 - Delete a backup of a serverless space
* [qcloud serverless space backup describe](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_describe/)	 - Describe a backup of a serverless space
* [qcloud serverless space backup list](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_list/)	 - List backups of serverless spaces
* [qcloud serverless space backup restore](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_restore/)	 - Manage restores of serverless space backups
* [qcloud serverless space backup schedule](/documentation/cloud-cli/reference/qcloud_serverless_space_backup_schedule/)	 - Manage backup schedules of serverless spaces


