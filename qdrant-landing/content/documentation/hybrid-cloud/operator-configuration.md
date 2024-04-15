---
title: Advanced Qdrant Operator configuration
weight: 2
---

# Advanced Qdrant Operator configuration

The Qdrant Operator has several configuration options, which can be configured inthe advanced section of your Hybrid Cloud Environment.

The following YAML shows all configuration options with their default values:

```yaml
# Configuration for the Qdrant operator
settings:
  # Does the operator run inside a Kubernetes cluster (kubernetes) or outside (local)
  app_environment: kubernetes
  # Retention for the backup history of Qdrant clusters
  backupHistoryRetentionDays: 2
  # Timeout configuration for the Qdrant operator operations
  operationTimeout: 7200 # 2 hours
  handlerTimeout: 21600 # 6 hours
  backupTimeout: 12600 # 3.5 hours
  # Incremental backoff configuration for the Qdrant operator operations
  backOff:
    minDelay: 5
    maxDelay: 300
    increment: 5
  # Cluster-manager configuration for a Qdrant cluster (experimental)
  clusterManager:
    image:
      repository: qdrant/qdrant-cloud-cluster-manager
      tag: 0.1.2
    pullInterval: 10
    logSize: 10
    debug: false
    # node_selector: {}
    # tolerations: []
  # Default ingress configuration for a Qdrant cluster
  ingress:
    enabled: false
    provider: KubernetesIngress # or NginxIngress
#    kubernetesIngress:
#      ingressClassName: ""
  # Default storage configuration for a Qdrant cluster
#  storage:
#    # Default VolumeSnapshotClass for a Qdrant cluster
#    snapshot_class: "csi-snapclass"
#    # Default StorageClass for a Qdrant cluster, uses cluster default StorageClass if not set
#    default_storage_class_names:
#      # StorageClass for DB volumes
#      db: ""
#      # StorageClass for snapshot volumes
#      snapshot: ""
  # Default scheduling configuration for a Qdrant cluster
#  scheduling:
#    default_topology_spread_constraints: []
#    default_pod_disruption_budget: {}
  qdrant:
    # Default security context for Qdrant cluster
#    securityContext:
#      enabled: false
#      user: ""
#      fsGroup: ""
#      group: ""
    # Default Qdrant image configuration
#    image:
#      pull_secret: ""
#      pull_policy: IfNotPresent
#      repository: qdrant/qdrant
    # Default Qdrant log_level
#    log_level: INFO
    # Default network policies to create for a qdrant cluster
    networkPolicies:
      ingress:
          ports:
            - protocol: TCP
              port: 6333
            - protocol: TCP
              port: 6334
      # Allow DNS resolution from qdrant pods at Kubernetes internal DNS server
      egress:
        - to:
            - namespaceSelector:
                matchLabels:
                  kubernetes.io/metadata.name: kube-system
          ports:
            - protocol: UDP
              port: 53
```
