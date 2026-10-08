---
title: qcloud serverless space update
short_description: "Update an existing space"
description: "Update an existing space"
weight: 122
---

# qcloud serverless space update

Update an existing space

## Synopsis

Update an existing serverless space.

Use this command to rename a space or change its labels, network restrictions,
per-collection size limit and search-worker settings. The cloud region cannot be
changed after creation.

Labels are merged with existing labels. Use 'key=value' to add or overwrite a
label, and 'key-' (with a trailing dash) to remove one. Allowed IPs and allowed
origins are merged the same way: specify a value to add it, or append '-' to
remove it (e.g. '10.0.0.0/8-').

```bash
qcloud serverless space update <space-id> [flags]
```

## Examples

```bash
# Rename a space
qcloud serverless space update 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --name my-renamed-space

# Add a label and remove another one
qcloud serverless space update 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --label env=prod --label team-

# Allow a new origin and remove an old IP range
qcloud serverless space update 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --allowed-origin https://app.example.com --allowed-ip 10.0.0.0/8-

# Tune the search workers
qcloud serverless space update 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --searcher-idle-timeout 10m --searcher-max-workers 4
```

## Options

```bash
      --allowed-ip stringArray           Allowed client IP CIDR range (e.g. "10.0.0.0/8"); append '-' to remove; IPv4 only
      --allowed-origin stringArray       Allowed browser origin for CORS (e.g. "https://app.example.com"); append '-' to remove; max 10
      --cost-allocation-label string     Label for billing reports
  -h, --help                             help for update
      --label stringArray                Label ('key=value') to add/overwrite; append '-' to remove ('key-'), can be specified multiple times
      --max-collection-size string       Maximum size per collection (e.g. 10GiB, 512MiB); must not exceed the platform limit
      --name string                      New name of the space
      --searcher-idle-timeout duration   Idle timeout after which search workers may be scaled down (1m to 15m)
      --searcher-max-workers uint        Maximum number of search workers per collection
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


