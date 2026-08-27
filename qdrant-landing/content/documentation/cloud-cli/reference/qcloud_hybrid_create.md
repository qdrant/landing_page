---
title: qcloud hybrid create
short_description: "Create a new hybrid cloud environment"
description: "Create a new hybrid cloud environment"
weight: 55
---

# qcloud hybrid create

Create a new hybrid cloud environment

## Synopsis

Create a new Hybrid Cloud Environment to deploy and manage Qdrant on your own
Kubernetes clusters (on-premises, cloud, or edge) with enterprise-grade
reliability.

Hybrid Cloud access must be enabled for your account by the Qdrant sales team.
If your account does not have access, you will be prompted to contact us.

```bash
qcloud hybrid create [flags]
```

## Examples

```bash
# Create a hybrid cloud environment
qcloud hybrid create --name my-hybrid-env

# Create with a custom namespace
qcloud hybrid create --name my-hybrid-env --namespace qdrant-hybrid

# Create with storage classes
qcloud hybrid create --name my-hybrid-env \
  --database-storage-class premium-rwo --snapshot-storage-class standard
```

## Options

```bash
      --database-storage-class string   Default database storage class (uses cluster default if omitted)
  -h, --help                            help for create
      --log-level string                Log level for deployed components ("debug", "info", "warn", "error")
      --name string                     Name of the hybrid cloud environment (required)
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
