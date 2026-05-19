---
title: Qdrant Cloud CLI
short_description: "Manage Qdrant Cloud from your terminal with qcloud — create clusters, rotate keys, and switch between accounts and environments."
description: "Install and use the qcloud CLI to manage Qdrant Cloud clusters, API keys, and accounts directly from your terminal with scriptable commands."
weight: 250
partition: deploy
---

# Qdrant Cloud CLI

`qcloud` is the official command-line interface for managing Qdrant Cloud. It lets you manage clusters, authentication, and anything the Qdrant Cloud API has to offer—all from your terminal.

## Installation

### From GitHub Releases

Download the latest release from [GitHub Releases](https://github.com/qdrant/qcloud-cli/releases).

Select the archive that matches your OS and CPU architecture, extract it, and place the `qcloud` binary somewhere in your `PATH` (e.g. `~/.local/bin` or `/usr/local/bin`).

> **macOS:** The binary is currently not signed. If macOS blocks it, run `xattr -d com.apple.quarantine qcloud` after extracting.

### From Source

With [Go](https://go.dev/) installed, you can build and install directly from source:

```sh
go install github.com/qdrant/qcloud-cli/cmd/qcloud@latest
```

### Verify the Installation

```sh
qcloud version
```

## Quick Start

Before using `qcloud`, create a [management API](/documentation/cloud-api/) key and note your account ID from the [Qdrant Cloud Console](https://cloud.qdrant.io).

```sh
# 1. Create a context with your credentials
qcloud context set my-cloud \
  --api-key <YOUR_API_KEY> \
  --account-id <YOUR_ACCOUNT_ID>

# 2. List available cloud providers and regions
qcloud cloud-provider list
qcloud cloud-region list --cloud-provider aws

# 3. Create a cluster by specifying resources (waits until healthy)
#    Use --cpu, --ram, --disk to select a matching package automatically.
qcloud cluster create \
  --cloud-provider aws \
  --cloud-region us-east-1 \
  --cpu 2000m \
  --ram 8GiB \
  --disk 50GiB \
  --name my-cluster \
  --wait

# 4. Describe your new cluster
qcloud cluster describe <CLUSTER_ID>

# 5. Create an API key for it
qcloud cluster key create <CLUSTER_ID> --name my-key
```

## Configuration

`qcloud` can be configured in three ways, listed here from lowest to highest precedence:

### Config File

The config file is stored at `~/.config/qcloud/config.yaml` by default. You can override the location with the `--config` flag. It stores named contexts so you can switch between accounts and environments.

### Named Contexts

Named contexts allow you to save and switch between sets of credentials:

```sh
qcloud context set my-cloud --api-key <KEY> --account-id <ID>
qcloud context use my-cloud
qcloud context show
```

### Environment Variables

Environment variables override the active context and take the highest precedence:

| Variable | Description |
|---|---|
| `QDRANT_CLOUD_API_KEY` | API key for authentication |
| `QDRANT_CLOUD_ACCOUNT_ID` | Account ID to operate against |
| `QDRANT_CLOUD_ENDPOINT` | API endpoint URL (defaults to Qdrant Cloud) |
| `QDRANT_CLOUD_CONTEXT` | Name of the context to use |

Pass `--json` to any command for machine-readable output.

## Getting Help

For a full list of available commands, run:

```sh
qcloud --help
```
