---
title: qcloud cluster create
short_description: "Create a new cluster"
description: "Create a new cluster"
weight: 29
---

# qcloud cluster create

Create a new cluster

```bash
qcloud cluster create [flags]
```

## Examples

```bash
# Create a free-tier cluster
qcloud cluster create --cloud-provider aws --cloud-region eu-central-1 --package free

# Create a cluster with specific resources
qcloud cluster create --cloud-provider aws --cloud-region eu-central-1 --cpu 0.5 --ram 4Gi

# Create a cluster and wait for it to become healthy
qcloud cluster create --cloud-provider aws --cloud-region eu-central-1 --cpu 2 --ram 8Gi --wait

# Create with labels and extra disk
qcloud cluster create --cloud-provider aws --cloud-region eu-central-1 --cpu 4 --ram 32Gi \
  --disk 200Gi --label env=production --label team=search

# Create a hybrid cloud cluster with a load balancer service type
qcloud cluster create --cloud-provider hybrid --cloud-region my-env --cpu 2 --ram 8Gi \
  --service-type load-balancer

# Create a hybrid cluster with node selectors and tolerations
qcloud cluster create --cloud-provider hybrid --cloud-region my-env --cpu 2 --ram 8Gi \
  --node-selector disktype=ssd --toleration "dedicated=qdrant:NoSchedule"

# Create a hybrid cluster with custom storage classes
qcloud cluster create --cloud-provider hybrid --cloud-region my-env --cpu 4 --ram 16Gi \
  --database-storage-class fast-ssd --snapshot-storage-class standard
```

## Options

```bash
      --allowed-ip stringArray                   Allowed client IP CIDR range (e.g. "10.0.0.0/8"); append '-' to remove; max 20
      --annotation stringArray                   (cloud-provider: hybrid) Pod annotation ('key=value'); append '-' to remove, can be specified multiple times
      --api-key-secret string                    (cloud-provider: hybrid) API key Kubernetes secret ('secretName:key')
      --async-scorer                             Enable async scorer (uses io_uring on Linux)
      --audit-log-max-files uint32               Maximum number of audit log files (1-1000)
      --audit-log-rotation string                Audit log rotation ("daily", "hourly")
      --audit-log-trust-forwarded-headers        Trust forwarded headers in audit logs
      --audit-logging                            Enable audit logging
      --cloud-provider string                    Cloud provider ID (required, see 'cloud-provider list)
      --cloud-region string                      Cloud provider region ID (required, see 'cloud-region list --cloud-provider <provider_id>)
      --cost-allocation-label string             Label for billing reports
      --cpu millicores                           CPU to select a package (e.g. "1", "0.5", or "1000m")
      --database-storage-class string            (cloud-provider: hybrid) Kubernetes storage class for database volumes
      --db-log-level string                      Database log level ("trace", "debug", "info", "warn", "error", "off")
      --disk bytes                               Total disk size (e.g. "200GiB"); if larger than the package's included disk, the difference is provisioned as additional storage
      --disk-performance string                  Disk performance tier ("balanced", "cost-optimised", "performance")
      --enable-tls                               (cloud-provider: hybrid) Enable TLS for the database service
      --gpu millicores                           Number of GPUs to select a package (e.g. "1", "2", or "1000m")
  -h, --help                                     help for create
      --label stringArray                        Label ('key=value') to add/overwrite; append '-' to remove ('key-'), can be specified multiple times
      --multi-az                                 Require a multi-AZ package
      --name string                              Cluster name (auto-generated if not provided)
      --node-selector stringArray                (cloud-provider: hybrid) Node selector label ('key=value'); append '-' to remove, can be specified multiple times
      --nodes uint32                             Number of nodes (default 1)
      --optimizer-cpu-budget int32               CPU threads for optimization (0=auto, negative=subtract from available CPUs, positive=exact count)
      --package string                           Booking package name or ID (see 'cluster package list')
      --pod-label stringArray                    (cloud-provider: hybrid) Pod label ('key=value'); append '-' to remove, can be specified multiple times
      --ram bytes                                RAM to select a package (e.g. "8", "8G", "8Gi", or "8GiB")
      --read-only-api-key-secret string          (cloud-provider: hybrid) Read-only API key Kubernetes secret ('secretName:key')
      --rebalance-strategy string                Shard rebalance strategy ("by-count", "by-size", "by-count-and-size")
      --replication-factor uint32                Default replication factor for new collections
      --reserved-cpu-percentage uint32           (cloud-provider: hybrid) Percentage of CPU reserved for system components, 1-80 (default 20)
      --reserved-memory-percentage uint32        (cloud-provider: hybrid) Percentage of memory reserved for system components, 1-80 (default 20)
      --restart-mode string                      Restart policy ("rolling", "parallel", "automatic")
      --service-annotation stringArray           (cloud-provider: hybrid) Service annotation ('key=value'); append '-' to remove, can be specified multiple times
      --service-type string                      (cloud-provider: hybrid) Kubernetes service type ("cluster-ip", "node-port", "load-balancer")
      --snapshot-storage-class string            (cloud-provider: hybrid) Kubernetes storage class for snapshot volumes
      --tls-cert-secret string                   (cloud-provider: hybrid) TLS certificate Kubernetes secret ('secretName:key')
      --tls-key-secret string                    (cloud-provider: hybrid) TLS private key Kubernetes secret ('secretName:key')
      --toleration stringArray                   (cloud-provider: hybrid) Toleration ('key=value:Effect' or 'key:Exists:Effect'); use 'key-' to remove by key, can be specified multiple times
      --topology-spread-constraint stringArray   (cloud-provider: hybrid) Topology spread constraint ('topologyKey[:maxSkew[:whenUnsatisfiable]]'); use 'topologyKey-' to remove, can be specified multiple times
      --vectors-on-disk                          Store vectors in memmap storage for new collections
      --version string                           Qdrant version (e.g. "v1.17.0" or "latest")
      --volume-attributes-class string           (cloud-provider: hybrid) Kubernetes volume attributes class
      --volume-snapshot-class string             (cloud-provider: hybrid) Kubernetes volume snapshot class
      --wait                                     Wait for the cluster to become healthy
      --wait-timeout duration                    Maximum time to wait for cluster health (default 10m0s)
      --write-consistency-factor int32           Default write consistency factor for new collections
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


