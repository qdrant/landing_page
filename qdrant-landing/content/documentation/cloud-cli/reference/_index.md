---
title: Command Reference
short_description: "Qdrant Cloud CLI"
description: "Qdrant Cloud CLI"
weight: 0
---

# qcloud

Qdrant Cloud CLI

## Synopsis

The command-line interface for Qdrant Cloud.

Get started:
  qcloud context set default --api-key <KEY> --account-id <ID>
  qcloud cluster list

Documentation: https://github.com/qdrant/qcloud-cli

## Options

```bash
      --account-id string    Qdrant Cloud Account ID (env: QDRANT_CLOUD_ACCOUNT_ID)
      --api-key string       Management API Key (env: QDRANT_CLOUD_API_KEY)
  -c, --config string        Config file path (env: QDRANT_CLOUD_CONFIG, default ~/.config/qcloud/config.yaml)
      --console-url string   Qdrant Cloud web console base URL (env: QDRANT_CLOUD_CONSOLE_URL, default https://cloud.qdrant.io)
      --context string       Override the active context (env: QDRANT_CLOUD_CONTEXT)
      --debug                Enable debug logging to stderr
      --endpoint string      gRPC API endpoint (env: QDRANT_CLOUD_ENDPOINT, default grpc.cloud.qdrant.io:443)
  -h, --help                 help for qcloud
      --json                 Output as JSON
```

## SEE ALSO

* [qcloud account](/documentation/cloud-cli/reference/qcloud_account/)	 - Manage Qdrant Cloud accounts
* [qcloud backup](/documentation/cloud-cli/reference/qcloud_backup/)	 - Manage Qdrant Cloud backups
* [qcloud cloud-provider](/documentation/cloud-cli/reference/qcloud_cloud-provider/)	 - Manage cloud providers
* [qcloud cloud-region](/documentation/cloud-cli/reference/qcloud_cloud-region/)	 - Manage cloud regions
* [qcloud cluster](/documentation/cloud-cli/reference/qcloud_cluster/)	 - Manage Qdrant Cloud clusters
* [qcloud context](/documentation/cloud-cli/reference/qcloud_context/)	 - Manage named configuration contexts
* [qcloud hybrid](/documentation/cloud-cli/reference/qcloud_hybrid/)	 - Manage hybrid cloud environments
* [qcloud iam](/documentation/cloud-cli/reference/qcloud_iam/)	 - Manage IAM resources in Qdrant Cloud
* [qcloud package](/documentation/cloud-cli/reference/qcloud_package/)	 - Manage packages
* [qcloud self-upgrade](/documentation/cloud-cli/reference/qcloud_self-upgrade/)	 - Upgrade qcloud to the latest version
* [qcloud version](/documentation/cloud-cli/reference/qcloud_version/)	 - Print the qcloud CLI version
