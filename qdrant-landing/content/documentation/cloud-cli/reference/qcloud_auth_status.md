---
title: qcloud auth status
short_description: "Show OAuth login status for the current endpoint"
description: "Show OAuth login status for the current endpoint"
weight: 13
---

# qcloud auth status

Show OAuth login status for the current endpoint

## Synopsis

Show whether you are logged in to the current endpoint, as whom, and with what access.

It also shows the account commands use and where it comes from, and the access
token's expiry. An expired access token is refreshed by the next command. The
token itself is never printed; use "qcloud auth token" for that.

```bash
qcloud auth status [flags]
```

## Examples

```bash
# Show the login of the current endpoint
qcloud auth status

# Check from a script whether you are logged in
qcloud auth status --json | jq .logged_in
```

## Options

```bash
  -h, --help   help for status
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


