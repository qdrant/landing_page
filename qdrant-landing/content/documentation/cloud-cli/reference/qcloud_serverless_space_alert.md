---
title: qcloud serverless space alert
short_description: "Show alerts of serverless spaces"
description: "Show alerts of serverless spaces"
weight: 93
---

# qcloud serverless space alert

Show alerts of serverless spaces

## Synopsis

Show alerts of serverless spaces.

Alerts are raised when a space or one of its collections needs attention, for
example when a collection is close to its storage limit, the space is close to
its collection limit, an API key is about to expire, or the space is unhealthy.
An alert is either firing or resolved, and is tied either to a single collection
or to the space as a whole.

## Examples

```bash
# List all alerts of a space
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# List only the alerts that are currently firing
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --state firing
```

## Options

```bash
  -h, --help   help for alert
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
* [qcloud serverless space alert list](/documentation/cloud-cli/reference/qcloud_serverless_space_alert_list/)	 - List alerts of a space


