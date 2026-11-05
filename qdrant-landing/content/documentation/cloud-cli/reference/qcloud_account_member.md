---
title: qcloud account member
short_description: "Manage account members"
description: "Manage account members"
weight: 5
---

# qcloud account member

Manage account members

## Synopsis

Manage members of the current Qdrant Cloud account.

Members are users who have been added to the account. Each member has an
associated user record and an ownership flag indicating whether they are the
account owner.

## Options

```bash
  -h, --help   help for member
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

* [qcloud account](/documentation/cloud-cli/reference/qcloud_account/)	 - Manage Qdrant Cloud accounts
* [qcloud account member describe](/documentation/cloud-cli/reference/qcloud_account_member_describe/)	 - Describe an account member
* [qcloud account member list](/documentation/cloud-cli/reference/qcloud_account_member_list/)	 - List account members


