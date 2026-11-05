---
title: qcloud auth discover
short_description: "Show the OAuth login URL inferred from the API endpoint"
description: "Show the OAuth login URL inferred from the API endpoint"
weight: 10
---

# qcloud auth discover

Show the OAuth login URL inferred from the API endpoint

## Synopsis

Show the OAuth API resource and login server for the current endpoint.

The gRPC endpoint (default grpc.cloud.qdrant.io:443) is turned into the API URL
https://api.cloud.qdrant.io, whose protected-resource metadata
(/.well-known/oauth-protected-resource) is read without credentials. When it
names a login server, that one is used; otherwise login.cloud.qdrant.io is
inferred from the endpoint, and the output says why the metadata was not used.
Nothing is stored and no login is needed.

```bash
qcloud auth discover [flags]
```

## Examples

```bash
# Show the login server of the current endpoint
qcloud auth discover

# Show it for another endpoint
qcloud auth discover --endpoint grpc.cloud.qdrant.io:443

# Read the login server from a script
qcloud auth discover --json | jq -r .issuer
```

## Options

```bash
  -h, --help   help for discover
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


