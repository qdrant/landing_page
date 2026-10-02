---
title: qcloud inference models list
short_description: "List available inference models"
description: "List available inference models"
weight: 83
---

# qcloud inference models list

List available inference models

## Synopsis

List the inference models globally available for a cloud provider and region.

The listing is global, not account-specific: it shows every model Qdrant Cloud
offers in that region, together with the vector type and modality it produces,
its output dimensionality and per-request token limit, and its price per one
million processed tokens. External models are served by a third-party vendor and
require that vendor's API key to be configured on the cluster.

Inference is only offered on managed cloud, so unlike "qcloud package
list" this command cannot be used with hybrid cloud.

```bash
qcloud inference models list [flags]
```

## Examples

```bash
# List inference models available on AWS in eu-central-1
qcloud inference models list --cloud-provider aws --cloud-region eu-central-1

# List inference models as JSON
qcloud inference models list --cloud-provider gcp --cloud-region us-east4 --json
```

## Options

```bash
      --cloud-provider string   Cloud provider ID (required)
      --cloud-region string     Cloud provider region ID (required)
  -h, --help                    help for list
      --no-headers              Do not print column headers
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

* [qcloud inference models](/documentation/cloud-cli/reference/qcloud_inference_models/)	 - Manage inference models


