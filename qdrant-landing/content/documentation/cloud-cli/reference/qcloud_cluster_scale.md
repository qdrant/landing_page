---
title: qcloud cluster scale
short_description: "Scales the resources of a cluster"
description: "Scales the resources of a cluster"
weight: 40
---

# qcloud cluster scale

Scales the resources of a cluster

## Synopsis

Scales the resources of a cluster.

Use this command to change the resource package for the nodes of a Qdrant cluster, change
the number of nodes in the cluster, and allocate more disk space per node. You can select
one of the pre-defined resource packages to apply for all nodes in the cluster. A package
defines CPU, RAM, GPU, and minimum disk size.

The --cpu, --ram, and --gpu flags specify per-node resources and are used to match a
package. If none of these flags are provided, the current package is preserved. Available
packages can be listed with 'package list' using the --cloud-provider and
--cloud-region flags.

Each package includes a baseline disk size. Requesting more disk than the baseline with
--disk provisions the difference as additional storage. Disk cannot be downscaled. If a
new package has a larger baseline disk than the current total, the disk size increases to
match.

```bash
qcloud cluster scale <cluster-id> [flags]
```

## Examples

```bash
# Scale up CPU and RAM
qcloud cluster scale 7b2ea926-724b-4de2-b73a-8675c42a6ebe --cpu 4 --ram 16Gi

# Add more nodes
qcloud cluster scale 7b2ea926-724b-4de2-b73a-8675c42a6ebe --nodes 3

# Increase disk and wait for completion
qcloud cluster scale 7b2ea926-724b-4de2-b73a-8675c42a6ebe --disk 500Gi --wait
```

## Options

```bash
      --cpu millicores            CPU per node (e.g. "1", "0.5", or "1000m")
      --disk bytes                Total disk size per node (e.g. "200GiB"); if larger than the node's included disk, the difference is provisioned as additional storage
      --disk-performance string   Disk performance tier ("balanced", "cost-optimised", "performance")
  -f, --force                     Skip confirmation prompts
      --gpu millicores            Number of GPUs per node (e.g. "1", "2", or "1000m")
  -h, --help                      help for scale
      --nodes uint32              Number of nodes
      --ram bytes                 RAM per node (e.g. "8", "8G", "8Gi", or "8GiB")
      --wait                      Wait for the cluster to become healthy
      --wait-timeout duration     Maximum time to wait for cluster health (default 10m0s)
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

* [qcloud cluster](/documentation/cloud-cli/reference/qcloud_cluster/)	 - Manage Qdrant Cloud clusters


