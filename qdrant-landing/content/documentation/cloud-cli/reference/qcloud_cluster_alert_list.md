---
title: qcloud cluster alert list
short_description: "List alerts of a cluster"
description: "List alerts of a cluster"
weight: 29
---

# qcloud cluster alert list

List alerts of a cluster

## Synopsis

List the alerts of a cluster, most recently firing first.

By default, only the alerts that are currently firing are listed. Use
--show-resolved to also list the alerts that have been resolved.

Long descriptions wrap onto multiple lines; use
--json to get each alert on a single record.

```bash
qcloud cluster alert list <cluster-id> [flags]
```

## Examples

```bash
# List the alerts of a cluster that are currently firing
qcloud cluster alert list 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# List both firing and resolved alerts
qcloud cluster alert list 7b2ea926-724b-4de2-b73a-8675c42a6ebe --show-resolved

# Output the alerts as JSON
qcloud cluster alert list 7b2ea926-724b-4de2-b73a-8675c42a6ebe --json
```

## Options

```bash
  -h, --help            help for list
      --no-headers      Do not print column headers
      --show-resolved   Also list alerts that have been resolved
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

* [qcloud cluster alert](/documentation/cloud-cli/reference/qcloud_cluster_alert/)	 - Show alerts of clusters


