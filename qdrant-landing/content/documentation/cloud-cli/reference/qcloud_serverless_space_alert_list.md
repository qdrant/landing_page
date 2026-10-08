---
title: qcloud serverless space alert list
short_description: "List alerts of a space"
description: "List alerts of a space"
weight: 94
---

# qcloud serverless space alert list

List alerts of a space

## Synopsis

List the alerts of a serverless space, most recently firing first.

Alerts that are tied to the space as a whole rather than to a single collection
are shown with "(space)" in the COLLECTION column. Use --space-only to list only
those alerts, or --collection / --collection-contains to list only the alerts of
matching collections.

By default, all alerts are fetched automatically across multiple pages. Use
--page-size and --page-token for manual pagination; the next page token is
included in the JSON output when more pages exist.

```bash
qcloud serverless space alert list <space-id> [flags]
```

## Examples

```bash
# List all alerts of a space
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60

# List only the alerts that are currently firing
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --state firing

# List the alerts of a single collection
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --collection products

# List alerts that concern the space as a whole
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --space-only

# Show the alert descriptions as JSON
qcloud serverless space alert list 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --json
```

## Options

```bash
      --collection string            Only include the collection with this exact name
      --collection-contains string   Only include collections whose name contains this substring
  -h, --help                         help for list
      --no-headers                   Do not print column headers
      --page-size int32              Maximum number of alerts to return per page (manual pagination mode)
      --page-token string            Page token from a previous response to resume from (manual pagination mode)
      --space-only                   Only include entries that are not tied to a collection
      --state string                 Only list alerts in this state (firing, resolved)
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

* [qcloud serverless space alert](/documentation/cloud-cli/reference/qcloud_serverless_space_alert/)	 - Show alerts of serverless spaces


