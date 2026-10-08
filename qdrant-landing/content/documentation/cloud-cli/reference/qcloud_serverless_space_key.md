---
title: qcloud serverless space key
short_description: "Manage API keys for a space"
description: "Manage API keys for a space"
weight: 113
---

# qcloud serverless space key

Manage API keys for a space

## Synopsis

Manage API keys for a serverless space.

Space API keys authenticate requests to the space endpoint. A key either grants
global access to the whole space (manage, read-only or metrics-read-only) or
per-collection access (read-only or read-write) to a set of named collections.
The secret value of a key is only returned once, when the key is created.

## Examples

```bash
# List API keys for a space
qcloud serverless space key list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# Create an API key with manage access
qcloud serverless space key create 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --name my-key

# Delete an API key
qcloud serverless space key delete 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Options

```bash
  -h, --help   help for key
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
* [qcloud serverless space key create](/documentation/cloud-cli/reference/qcloud_serverless_space_key_create/)	 - Create an API key for a space
* [qcloud serverless space key delete](/documentation/cloud-cli/reference/qcloud_serverless_space_key_delete/)	 - Delete an API key from a space
* [qcloud serverless space key list](/documentation/cloud-cli/reference/qcloud_serverless_space_key_list/)	 - List API keys for a space


