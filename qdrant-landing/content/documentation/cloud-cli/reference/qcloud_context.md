---
title: qcloud context
short_description: "Manage named configuration contexts"
description: "Manage named configuration contexts"
weight: 47
---

# qcloud context

Manage named configuration contexts

## Options

```bash
  -h, --help   help for context
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
* [qcloud context delete](/documentation/cloud-cli/reference/qcloud_context_delete/)	 - Delete a context
* [qcloud context list](/documentation/cloud-cli/reference/qcloud_context_list/)	 - List all contexts
* [qcloud context set](/documentation/cloud-cli/reference/qcloud_context_set/)	 - Create or update a context
* [qcloud context show](/documentation/cloud-cli/reference/qcloud_context_show/)	 - Show the active context configuration
* [qcloud context use](/documentation/cloud-cli/reference/qcloud_context_use/)	 - Set the active context
