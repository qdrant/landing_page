---
title: qcloud inference
short_description: "Manage inference resources"
description: "Manage inference resources"
weight: 81
---

# qcloud inference

Manage inference resources

## Synopsis

Inspect the inference models offered by Qdrant Cloud.

Inference models turn text or images into dense, sparse or multi vectors directly
inside Qdrant Cloud, so a cluster can embed documents and queries without a
separate embedding service. Which models are offered depends on the cloud
provider and region a cluster runs in.

## Examples

```bash
# List the inference models available in a region
qcloud inference models list --cloud-provider aws --cloud-region eu-central-1
```

## Options

```bash
  -h, --help   help for inference
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
* [qcloud inference models](/documentation/cloud-cli/reference/qcloud_inference_models/)	 - Manage inference models


