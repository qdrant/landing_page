---
title: qcloud cluster scale
short_description: "Scales the resources of a cluster"
description: "Scales the resources of a cluster"
weight: 42
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
--disk provisions the difference as additional storage. If a new package has a larger
baseline disk than the current total, the disk size increases to match.

Lowering the disk below the current total needs --allow-disk-decrease, also with --force.
A --disk below the baseline of the package is raised to the baseline. Each node is
replaced by a smaller one and its shard data is transferred. This deletes the local
snapshots of the cluster, so copy any you need first. A warning is printed before the
scale; --force skips the confirmation but not the warning. The disk can only be lowered
on a cluster running Qdrant v1.19.2 or later. On a hybrid cloud cluster, the operator
must support it too.

Reducing RAM is always allowed, but a cluster whose memory usage does not fit the smaller
package can run out of memory and become unavailable. A warning is printed before the
scale when that is the case, or when the usage could not be determined; --force skips the
confirmation but not the warning.

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

# Lower the disk (deletes the local snapshots of the cluster)
qcloud cluster scale 7b2ea926-724b-4de2-b73a-8675c42a6ebe --disk 100Gi --allow-disk-decrease --wait
```

## Options

```bash
      --allow-disk-decrease       Allow --disk to lower the disk below the current total; this deletes the local snapshots of the cluster
      --cpu millicores            CPU per node (e.g. "1", "0.5", or "1000m")
      --disk bytes                Total disk size per node (e.g. "200GiB"); if larger than the node's included disk, the difference is provisioned as additional storage
      --disk-performance string   Disk performance tier ("balanced", "cost-optimised", "performance")
  -f, --force                     Skip confirmation prompts
      --gpu millicores            Number of GPUs per node (e.g. "1", "2", or "1000m")
  -h, --help                      help for scale
      --nodes uint32              Number of nodes
      --ram bytes                 RAM per node (e.g. "8", "8G", "8Gi", or "8GiB")
      --wait                      Wait for the cluster to become healthy
      --wait-timeout duration     Maximum time to wait for the cluster to become healthy (default 10m0s)
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


