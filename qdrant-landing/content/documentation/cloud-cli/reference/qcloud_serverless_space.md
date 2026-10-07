---
title: qcloud serverless space
short_description: "Manage serverless spaces"
description: "Manage serverless spaces"
weight: 88
---

# qcloud serverless space

Manage serverless spaces

## Synopsis

Manage serverless spaces.

A space is the unit of deployment in Qdrant Cloud Serverless. It lives in a single
cloud region, exposes one endpoint for the REST and gRPC APIs, and holds any number
of collections up to the account's quota. Spaces are configured with network
restrictions (allowed IP ranges and browser origins), per-collection size limits
and search-worker settings.

## Examples

```bash
# List all spaces
qcloud serverless space list

# Create a space with a generated name
qcloud serverless space create --cloud-region eu-central-1

# Show the details of a space
qcloud serverless space describe 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60
```

## Options

```bash
  -h, --help   help for space
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

* [qcloud serverless](/documentation/cloud-cli/reference/qcloud_serverless/)	 - Manage Qdrant Cloud Serverless resources
* [qcloud serverless space backup](/documentation/cloud-cli/reference/qcloud_serverless_space_backup/)	 - Manage backups of serverless spaces
* [qcloud serverless space create](/documentation/cloud-cli/reference/qcloud_serverless_space_create/)	 - Create a new space
* [qcloud serverless space create-from-backup](/documentation/cloud-cli/reference/qcloud_serverless_space_create-from-backup/)	 - Create a new space from a backup
* [qcloud serverless space delete](/documentation/cloud-cli/reference/qcloud_serverless_space_delete/)	 - Delete a space
* [qcloud serverless space describe](/documentation/cloud-cli/reference/qcloud_serverless_space_describe/)	 - Describe a space
* [qcloud serverless space key](/documentation/cloud-cli/reference/qcloud_serverless_space_key/)	 - Manage API keys for a space
* [qcloud serverless space list](/documentation/cloud-cli/reference/qcloud_serverless_space_list/)	 - List all spaces
* [qcloud serverless space suggest-name](/documentation/cloud-cli/reference/qcloud_serverless_space_suggest-name/)	 - Suggest a name for a new space
* [qcloud serverless space update](/documentation/cloud-cli/reference/qcloud_serverless_space_update/)	 - Update an existing space
* [qcloud serverless space wait](/documentation/cloud-cli/reference/qcloud_serverless_space_wait/)	 - Wait for a space to become ready


