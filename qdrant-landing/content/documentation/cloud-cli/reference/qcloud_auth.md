---
title: qcloud auth
short_description: "Log in to Qdrant Cloud with a browser"
description: "Log in to Qdrant Cloud with a browser"
weight: 9
---

# qcloud auth

Log in to Qdrant Cloud with a browser

## Synopsis

Log in to Qdrant Cloud with a browser (or a device code) instead of pasting an API key.

The login server is not configured separately: it follows from the API endpoint.
grpc.cloud.qdrant.io:443 logs in at login.cloud.qdrant.io. When the API
advertises its login server in its protected-resource metadata, that one is used.

After the login, commands send the access token instead of an API key, and
refresh it when it expires. An API key set with --api-key or QDRANT_CLOUD_API_KEY
still takes precedence over the login.

## Examples

```bash
# Show which login server the current endpoint uses
qcloud auth discover

# Log in with the browser
qcloud auth login

# Log in read-only on a machine without a browser
qcloud auth login --device --scope read-only

# Check whether you are logged in, and as whom
qcloud auth status
```

## Options

```bash
  -h, --help   help for auth
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
* [qcloud auth discover](/documentation/cloud-cli/reference/qcloud_auth_discover/)	 - Show the OAuth login URL inferred from the API endpoint
* [qcloud auth login](/documentation/cloud-cli/reference/qcloud_auth_login/)	 - Log in with a browser or device code
* [qcloud auth logout](/documentation/cloud-cli/reference/qcloud_auth_logout/)	 - Log out and drop stored OAuth tokens
* [qcloud auth status](/documentation/cloud-cli/reference/qcloud_auth_status/)	 - Show OAuth login status for the current endpoint
* [qcloud auth token](/documentation/cloud-cli/reference/qcloud_auth_token/)	 - Print a fresh OAuth access token (sensitive)


