---
title: qcloud auth token
short_description: "Print a fresh OAuth access token (sensitive)"
description: "Print a fresh OAuth access token (sensitive)"
weight: 14
---

# qcloud auth token

Print a fresh OAuth access token (sensitive)

## Synopsis

Print a fresh OAuth access token for the current endpoint.

An access token that has expired, or is about to, is refreshed first. The token
is a credential: it is meant for tools that need a Bearer token, such as the
Terraform provider with auth = "cli", and should not be logged or shared.

```bash
qcloud auth token [flags]
```

## Examples

```bash
# Print the access token
qcloud auth token

# Keep the token in a variable for a script
TOKEN=$(qcloud auth token)

# Print the token with its type, scope, and expiry
qcloud auth token --json
```

## Options

```bash
  -h, --help   help for token
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

* [qcloud auth](/documentation/cloud-cli/reference/qcloud_auth/)	 - Log in to Qdrant Cloud with a browser


