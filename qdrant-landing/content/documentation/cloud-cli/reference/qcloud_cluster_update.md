---
title: qcloud cluster update
short_description: "Update an existing cluster"
description: "Update an existing cluster"
weight: 43
---

# qcloud cluster update

Update an existing cluster

## Synopsis

Updates the configuration of a cluster.

Use this command to modify cluster settings such as the Qdrant version, labels,
database defaults, IP restrictions, restart mode, rebalance strategy, and hybrid
cluster configuration.

Version upgrades (--version) will trigger a rolling restart of the cluster.

Database configuration changes (--replication-factor, --write-consistency-factor,
--async-scorer, --optimizer-cpu-budget, --vectors-on-disk, --db-log-level,
--audit-logging and related flags, --enable-tls, --api-key-secret,
--read-only-api-key-secret, --tls-cert-secret, --tls-key-secret) will trigger a
rolling restart of the cluster. The cluster remains available during the restart,
but individual nodes will be briefly unavailable as they cycle.

Hybrid cluster configuration changes (--service-type, --node-selector,
--toleration, --topology-spread-constraint, --annotation, --pod-label,
--service-annotation, --reserved-cpu-percentage, --reserved-memory-percentage,
and storage class flags) will also trigger a rolling restart.

Cluster configuration changes (--allowed-ip, --restart-mode, --rebalance-strategy,
--disk-performance, --cost-allocation-label) and label changes take effect without
a restart.

Labels are merged with existing labels by default. Use 'key=value' to add or
overwrite a label, and 'key-' (with a trailing dash) to remove one.

Allowed IPs are merged with existing IPs by default. Specify an IP CIDR to add
it, or append '-' (e.g. '10.0.0.0/8-') to remove one.

Node selectors, annotations, pod labels, and service annotations support the same
'key=value' / 'key-' merge syntax as labels.

Tolerations are merged with existing tolerations. Use 'key-' to remove all
tolerations matching that key.

Topology spread constraints are merged by topologyKey. Use 'topologyKey-' to
remove a constraint.

```bash
qcloud cluster update <cluster-id> [flags]
```

## Examples

```bash
# Add a label to a cluster
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --label env=staging

# Remove a label
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --label env-

# Restrict access to specific IPs
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --allowed-ip 10.0.0.0/8

# Upgrade the Qdrant version
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --version v1.17.0

# Change replication factor (triggers rolling restart)
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --replication-factor 3 --force

# Set service type to load balancer (hybrid only, triggers rolling restart)
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --service-type load-balancer

# Add a node selector and toleration (hybrid only, triggers rolling restart)
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe \
  --node-selector disktype=ssd --toleration "dedicated=qdrant:NoSchedule"

# Remove a node selector (hybrid only)
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --node-selector disktype-

# Change database storage class (hybrid only, triggers rolling restart)
qcloud cluster update 7b2ea926-724b-4de2-b73a-8675c42a6ebe --database-storage-class fast-ssd
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
      --cost-allocation-label string             Label for billing reports
      --database-storage-class string            (cloud-provider: hybrid) Kubernetes storage class for database volumes
      --db-log-level string                      Database log level ("trace", "debug", "info", "warn", "error", "off")
      --disk-performance string                  Disk performance tier ("balanced", "cost-optimised", "performance")
      --enable-tls                               (cloud-provider: hybrid) Enable TLS for the database service
  -f, --force                                    Skip confirmation prompt
  -h, --help                                     help for update
      --label stringArray                        Label ('key=value') to add/overwrite; append '-' to remove ('key-'), can be specified multiple times
      --node-selector stringArray                (cloud-provider: hybrid) Node selector label ('key=value'); append '-' to remove, can be specified multiple times
      --optimizer-cpu-budget int32               CPU threads for optimization (0=auto, negative=subtract from available CPUs, positive=exact count)
      --pod-label stringArray                    (cloud-provider: hybrid) Pod label ('key=value'); append '-' to remove, can be specified multiple times
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
