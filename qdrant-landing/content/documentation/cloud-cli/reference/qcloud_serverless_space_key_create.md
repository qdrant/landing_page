---
title: qcloud serverless space key create
short_description: "Create an API key for a space"
description: "Create an API key for a space"
weight: 114
---

# qcloud serverless space key create

Create an API key for a space

## Synopsis

Create an API key for a serverless space.

A key grants either global access to the whole space (--access-type) or access to
individual collections (--collection, repeatable). The two kinds of rules cannot be
combined in one key. When neither flag is given, the server assigns global manage
access.

An expiration date given with --expires is inclusive: the key stays valid until
the end of that day (23:59:59 UTC).

The secret key value is printed only once. Store it securely; it cannot be
retrieved later. If --wait fails after the key was created, the secret is still
printed before the error is returned.

```bash
qcloud serverless space key create <space-id> [flags]
```

## Examples

```bash
# Create an API key with manage access
qcloud serverless space key create 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --name my-key

# Create a read-only key that expires at the end of the year
qcloud serverless space key create 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name read-key --access-type read-only --expires 2026-12-31

# Create a key scoped to two collections
qcloud serverless space key create 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 \
  --name app-key --collection products=read-write --collection reviews=read-only

# Create a key and wait for it to become ready
qcloud serverless space key create 0e7a3c1d-5f2b-4c8e-9a6d-1b2c3d4e5f60 --name my-key --wait
```

## Options

```bash
      --access-type string       Global access type: manage, read-only or metrics-read-only (default: server assigns manage)
      --collection stringArray   Collection access rule as 'name=read-only|read-write'; can be specified multiple times
      --expires string           Expiration date in YYYY-MM-DD format; the key is valid until the end of that day (UTC)
  -h, --help                     help for create
      --name string              Name of the API key (required)
      --wait                     Wait for the API key to become ready
      --wait-timeout duration    Maximum time to wait for the API key to become ready (default 1m0s)
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

* [qcloud serverless space key](/documentation/cloud-cli/reference/qcloud_serverless_space_key/)	 - Manage API keys for a space


