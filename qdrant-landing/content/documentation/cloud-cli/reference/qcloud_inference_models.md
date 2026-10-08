---
title: qcloud inference models
short_description: "Manage inference models"
description: "Manage inference models"
weight: 82
---

# qcloud inference models

Manage inference models

## Synopsis

Inspect the individual inference models offered by Qdrant Cloud.

A model is identified by its name (for example "cohere/*"), and describes the
vectors it produces: the vector type, the modality of the input it accepts, and
the dimensionality of its output.

## Examples

```bash
# List the inference models available in a region
qcloud inference models list --cloud-provider aws --cloud-region eu-central-1
```

## Options

```bash
  -h, --help   help for models
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

* [qcloud inference](/documentation/cloud-cli/reference/qcloud_inference/)	 - Manage inference resources
* [qcloud inference models list](/documentation/cloud-cli/reference/qcloud_inference_models_list/)	 - List available inference models


