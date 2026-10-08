---
title: qcloud serverless
short_description: "Manage Qdrant Cloud Serverless resources"
description: "Manage Qdrant Cloud Serverless resources"
weight: 87
---

# qcloud serverless

Manage Qdrant Cloud Serverless resources

## Synopsis

Manage Qdrant Cloud Serverless resources.

Qdrant Cloud Serverless runs collections in spaces instead of dedicated clusters.
A space is hosted in a single cloud region and scales its search workers
automatically, so there are no nodes, packages or disks to size. Use the
commands in this group to manage spaces together with their API keys and
backups, to explore the regions spaces can be created in, and to inspect the
account's serverless quota.

## Examples

```bash
# List the regions in which spaces can be created
qcloud serverless cloud-region list

# Show how many spaces the account can still create
qcloud serverless quota

# List all serverless spaces
qcloud serverless space list

# Create a space in a region and wait until it is ready
qcloud serverless space create --cloud-region eu-central-1 --wait
```

## Options

```bash
  -h, --help   help for serverless
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
* [qcloud serverless cloud-region](/documentation/cloud-cli/reference/qcloud_serverless_cloud-region/)	 - Explore cloud regions for serverless spaces
* [qcloud serverless quota](/documentation/cloud-cli/reference/qcloud_serverless_quota/)	 - Show the serverless quota of the account
* [qcloud serverless space](/documentation/cloud-cli/reference/qcloud_serverless_space/)	 - Manage serverless spaces


