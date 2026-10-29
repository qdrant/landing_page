---
title: Qdrant Cloud CLI
short_description: "Manage Qdrant Cloud from your terminal with qcloud: create clusters, rotate keys, and switch between accounts and environments."
description: "Install and use the qcloud CLI to manage Qdrant Cloud clusters, API keys, and accounts directly from your terminal with scriptable commands."
weight: 250
partition: deploy
---

# Qdrant Cloud CLI

`qcloud` is the official command-line interface for managing Qdrant Cloud. It lets you manage clusters, authentication, and anything the Qdrant Cloud API has to offer, all from your terminal.

## Installation

### With Homebrew

On macOS and Linux, install from the Qdrant tap:

```sh
brew install qdrant/tap/qcloud
```

Homebrew also installs shell completions for bash, zsh, and fish. Update with `brew upgrade qcloud`.

### From the install script

For systems without Homebrew, such as CI runners, containers, and sandboxed agents:

```sh
curl -fsSL https://raw.githubusercontent.com/qdrant/qcloud-cli/main/install.sh | sh
```

The script installs the latest release for your OS and CPU architecture to `~/.local/bin`, after checking the archive against the release's `checksums.txt`. Set `QCLOUD_VERSION` (for example `v0.32.0`) to pin a release, or `QCLOUD_INSTALL_DIR` to install somewhere else. It needs `curl` or `wget`, `sha256sum` or `shasum`, and `tar`.

### From GitHub Releases

Download the latest release from [GitHub Releases](https://github.com/qdrant/qcloud-cli/releases). Releases are available for macOS and Linux on x86-64 and ARM64, and for Windows on x86-64. The macOS binaries are signed and notarized.

Select the archive that matches your OS and CPU architecture, extract it, and place the `qcloud` binary somewhere in your `PATH` (e.g. `~/.local/bin` or `/usr/local/bin`). Each release includes a `checksums.txt` file with the SHA-256 of every archive.

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

## Command Groups

| Command | Manages |
|---|---|
| `qcloud cluster` | Clusters: create, describe, list, scale, update, restart, suspend, delete, logs, alerts, API keys, and Qdrant versions |
| `qcloud backup` | Backups, backup schedules, and restores |
| `qcloud account` | Accounts |
| `qcloud iam` | Identity and access management resources |
| `qcloud inference` | Inference resources |
| `qcloud hybrid` | Hybrid Cloud environments |
| `qcloud cloud-provider`, `qcloud cloud-region`, `qcloud package` | The providers, regions, and node packages you can choose from |
| `qcloud context` | Named configuration contexts |

Run `qcloud <command> --help` for the flags of each command.

## Common Tasks

```sh
# Scale: more RAM and nodes, plus extra disk
qcloud cluster scale <CLUSTER_ID> --ram 16Gi --nodes 3 --disk 100Gi

# Upgrade the Qdrant version (a rolling restart)
qcloud cluster version list
qcloud cluster update <CLUSTER_ID> --version <VERSION>

# Restrict client IP ranges (takes effect without a restart)
qcloud cluster update <CLUSTER_ID> --allowed-ip 10.0.0.0/8

# Create a read-only key that expires at the end of a day (UTC)
qcloud cluster key create <CLUSTER_ID> --name read-key \
  --access-type read-only --expires 2027-06-30

# Create a new cluster from a backup, and wait until it is healthy
qcloud cluster create-from-backup --backup-id <BACKUP_ID> --name restored --wait

# Check what needs attention
qcloud cluster alert list <CLUSTER_ID>
qcloud cluster logs <CLUSTER_ID> --since 6h
```

Reducing RAM is allowed, but `qcloud cluster scale` warns you first if the cluster's memory usage does not fit the smaller package. For the same workflow in every tool, see [Automate Qdrant Cloud](/documentation/cloud-automation/).

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
| `QDRANT_CLOUD_ENDPOINT` | gRPC API endpoint (defaults to `grpc.cloud.qdrant.io:443`) |
| `QDRANT_CLOUD_CONTEXT` | Name of the context to use |

Pass `--json` to any command for machine-readable output.

## Getting Help

For a full list of available commands, run:

```sh
qcloud --help
```
