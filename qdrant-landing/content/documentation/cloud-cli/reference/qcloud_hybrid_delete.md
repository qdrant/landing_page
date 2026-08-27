---
title: qcloud hybrid delete
short_description: "Delete a hybrid cloud environment"
description: "Delete a hybrid cloud environment"
weight: 56
---

# qcloud hybrid delete

Delete a hybrid cloud environment

```bash
qcloud hybrid delete <env-id> [flags]
```

## Examples

```bash
# Delete a hybrid cloud environment (prompts for confirmation)
qcloud hybrid delete 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Delete without confirmation
qcloud hybrid delete 7b2ea926-724b-4de2-b73a-8675c42a6ebe --force
```

## Options

```bash
  -f, --force   Skip confirmation prompt
  -h, --help    help for delete
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
