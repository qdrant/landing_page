---
title: qcloud iam
short_description: "Manage IAM resources in Qdrant Cloud"
description: "Manage IAM resources in Qdrant Cloud"
weight: 60
---

# qcloud iam

Manage IAM resources in Qdrant Cloud

## Synopsis

Manage IAM resources for the Qdrant Cloud account.

## Options

```bash
  -h, --help   help for iam
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
* [qcloud iam key](/documentation/cloud-cli/reference/qcloud_iam_key/)	 - Manage cloud management keys
* [qcloud iam permission](/documentation/cloud-cli/reference/qcloud_iam_permission/)	 - Manage permissions in Qdrant Cloud
* [qcloud iam role](/documentation/cloud-cli/reference/qcloud_iam_role/)	 - Manage roles in Qdrant Cloud
* [qcloud iam user](/documentation/cloud-cli/reference/qcloud_iam_user/)	 - Manage users in Qdrant Cloud
