---
title: qcloud self-upgrade
short_description: "Upgrade qcloud to the latest version"
description: "Upgrade qcloud to the latest version"
weight: 83
---

# qcloud self-upgrade

Upgrade qcloud to the latest version

```bash
qcloud self-upgrade [flags]
```

## Options

```bash
      --check   Only check for a new version without installing
  -f, --force   Skip confirmation prompt
  -h, --help    help for self-upgrade
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
