---
title: qcloud hybrid bootstrap
short_description: "Generate bootstrap commands for a hybrid cloud environment"
description: "Generate bootstrap commands for a hybrid cloud environment"
weight: 54
---

# qcloud hybrid bootstrap

Generate bootstrap commands for a hybrid cloud environment

## Synopsis

Generate the commands needed to bootstrap a Kubernetes cluster into a hybrid cloud environment.

Each command in the output is ready to copy-paste or pipe to a shell. The credentials
printed to stderr are sensitive and should be treated as secrets.

Note: each invocation creates new Qdrant Cloud access tokens and registry credentials.
Only run this if the Kubernetes cluster is not yet registered to the environment.

```bash
qcloud hybrid bootstrap <env-id> [flags]
```

## Examples

```bash
# Generate bootstrap commands for an environment
qcloud hybrid bootstrap 7b2ea926-724b-4de2-b73a-8675c42a6ebe

# Pipe directly to a shell
qcloud hybrid bootstrap 7b2ea926-724b-4de2-b73a-8675c42a6ebe | bash
```

## Options

```bash
  -h, --help   help for bootstrap
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
