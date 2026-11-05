---
title: qcloud auth login
short_description: "Log in with a browser or device code"
description: "Log in with a browser or device code"
weight: 11
---

# qcloud auth login

Log in with a browser or device code

## Synopsis

Log in to Qdrant Cloud and store a session that refreshes itself, for the current endpoint.

By default the login opens a browser and waits for it on 127.0.0.1; use
--device on a machine without a browser (over SSH, for example). Either way the
login ends on the Qdrant Cloud consent page, where you choose the accounts and
the access (read only or manage) the CLI gets.

After the login, qcloud creates a context for every account you granted, named
after the account and prefixed with the environment (dev-my-account on
development), that uses this login instead of an API key. Unless a context is
already current, the first one becomes current. A later login updates these
contexts, and "qcloud auth logout" removes them. Contexts with an API key are
never changed.

The access and refresh tokens are kept in the OS keychain (macOS Keychain,
Windows Credential Manager, or the Secret Service on Linux), and the rest of the
session in credentials.yaml next to the config file. Without a keychain, the
tokens go to credentials.yaml (mode 0600) too; QDRANT_CLOUD_TOKEN_STORE=keychain
makes that an error, and QDRANT_CLOUD_TOKEN_STORE=file skips the keychain.

```bash
qcloud auth login [flags]
```

## Examples

```bash
# Log in with the browser
qcloud auth login

# Log in with read-only access
qcloud auth login --scope read-only

# Log in on a machine without a browser
qcloud auth login --device

# Log in from a script and use the context it selected
qcloud auth login --json | jq -r .current_context
```

## Options

```bash
      --client-id string   OAuth client id, for a login server without a built-in one (env: QDRANT_CLOUD_OAUTH_CLIENT_ID)
      --device             Log in with a device code (prints a code to confirm in any browser) instead of opening a browser here
  -h, --help               help for login
      --login-url string   Login server URL, instead of the one discovered from the endpoint (for debugging)
      --scope string       Access to ask for: read-only or manage (the consent page can narrow it) (default "manage")
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

* [qcloud auth](/documentation/cloud-cli/reference/qcloud_auth/)	 - Log in to Qdrant Cloud with a browser


