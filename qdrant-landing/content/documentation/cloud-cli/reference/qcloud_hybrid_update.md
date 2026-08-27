---
title: qcloud hybrid update
short_description: "Update a hybrid cloud environment"
description: "Update a hybrid cloud environment"
weight: 59
---

# qcloud hybrid update

Update a hybrid cloud environment

```bash
qcloud hybrid update <env-id> [flags]
```

## Examples

```bash
# Rename a hybrid cloud environment
qcloud hybrid update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --name new-name

# Update the default storage classes
qcloud hybrid update 7b2ea926-724b-4de2-b73a-8675c42a6ebe \
  --database-storage-class premium-rwo --snapshot-storage-class standard

# Change the log level
qcloud hybrid update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --log-level debug
```

## Options

```bash
      --database-storage-class string   Default database storage class (uses cluster default if omitted)
  -h, --help                            help for update
      --log-level string                Log level for deployed components ("debug", "info", "warn", "error")
      --name string                     New name for the hybrid cloud environment
      --namespace string                Kubernetes namespace where Qdrant components are deployed (read-only after bootstrapping)
      --snapshot-storage-class string   Default snapshot storage class (uses cluster default if omitted)
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

* [qcloud hybrid](/documentation/cloud-cli/reference/qcloud_hybrid/)	 - Manage hybrid cloud environments
