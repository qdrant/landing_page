---
title: Configuration
short_description: "Configure the Qdrant Private Cloud Helm chart for the Operator, networking, scheduling, ingress, and backup management."
description: "Configure the Qdrant Private Cloud Helm chart with Operator settings, networking, scheduling, ingress, and backup management options for Kubernetes."
weight: 15
---

# Private Cloud Configuration

The Qdrant Private Cloud Helm chart has several configuration options. These configure the Operator itself and the fleet-wide defaults it applies to every Qdrant database it manages, such as the database image, log level and storage performance settings.

Settings that differ per cluster are not set here. API keys, TLS and [audit logging](/documentation/private-cloud/qdrant-cluster-management/#audit-logging) (`spec.config.audit`) belong on the `QdrantCluster` resource; see [Managing a Cluster](/documentation/private-cloud/qdrant-cluster-management/) and the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/#auditconfig). Audit logging has no Helm-level default and must be enabled on each cluster.

## Settings by Topic

Most installations change only a few values. These are the settings that most often matter, and where each one is explained. Paths are relative to the Helm values file.

| Topic | Values | Details |
|---|---|---|
| Images, pull secrets, and a registry mirror | `operator.image`, `qdrant-cluster-manager.image`, `qdrant-cluster-exporter.image`, `operator.settings.features.clusterManagement.qdrant.image` | [Mirroring Images and Charts](/documentation/private-cloud/private-cloud-setup/#mirroring-images-and-charts) |
| Namespaces the Operator watches | `operator.watch.onlyReleaseNamespace`, `operator.watch.namespaces` | [Scope of the Operator](/documentation/private-cloud/private-cloud-setup/#scope-of-the-operator) |
| Storage classes and snapshot classes | `operator.settings.features.clusterManagement.storageClass`, `operator.settings.features.backupManagement.snapshots.volumeSnapshotClass` | [Configuring Private Cloud](/documentation/private-cloud/private-cloud-setup/#configuring-private-cloud) |
| Volume expansion and disk scale-down | `operator.settings.features.clusterManagement.volumeExpansionMode`, `...diskScaleDown.enable` | [Settings That Affect Scaling](#settings-that-affect-scaling) |
| Network policies | `operator.settings.features.clusterManagement.qdrant.networkPolicies` | [Network Policies](/documentation/private-cloud/security-exposure/#network-policies) |
| Ingress provider | `operator.settings.features.clusterManagement.ingress` | [Ingress](/documentation/private-cloud/security-exposure/#ingress) |
| Backups | `operator.settings.features.backupManagement` | [Backups](/documentation/private-cloud/backups/) |
| Log levels and Prometheus scraping | `operator.settings.logLevel`, `qdrant-cluster-exporter.config.logLevel`, and the `serviceMonitor` values of both | [Logging & Monitoring](/documentation/private-cloud/logging-monitoring/) |
| Shard rebalancing and the cluster manager | `operator.settings.features.clusterManagement.clusterManager`, `qdrant-cluster-manager` | [Automatic Shard Rebalancing](/documentation/private-cloud/qdrant-cluster-management/#automatic-shard-rebalancing) |

The chart sets no `resources` for the Operator, the cluster manager, or the exporter. Set requests and limits for them yourself.

## Settings That Affect Scaling

Two operator settings change how cluster resources are scaled. See [Scaling a Cluster](/documentation/private-cloud/qdrant-cluster-management/#scaling-a-cluster).

| Setting | Default | Effect |
|---|---|---|
| `operator.settings.features.clusterManagement.volumeExpansionMode` | `Online` | `Online` expands volumes without a restart. Set it to `Offline` if your storage provider needs a restart to resize a volume, as some Azure disks do. |
| `operator.settings.features.clusterManagement.diskScaleDown.enable` | `false` | Lets the Operator reduce the disk size of a cluster by replacing its nodes. See [Scaling Down Disk Space](/documentation/private-cloud/qdrant-cluster-management/#scaling-down-disk-space). |

## All Settings

The following YAML shows all Helm chart configuration options with their default values. It has one block for each component that the chart installs.

### Operator

The `operator` block configures the Operator. Its `settings.features` section turns the Operator features on and off, and holds the defaults that it applies to every database cluster: `clusterManagement` for the databases, and `backupManagement` for snapshots and restores.

```yaml
operator:
  # Amount of replicas for the Qdrant operator (v2)
  replicaCount: 1

  image:
    # Image repository for the qdrant operator
    repository: registry.cloud.qdrant.io/qdrant/operator
    # Image pullPolicy
    pullPolicy: IfNotPresent
    # Overrides the image tag whose default is the chart appVersion.
    tag: ""

  imagePullSecrets:
    - name: qdrant-registry-creds

  nameOverride: ""
  fullnameOverride: "operator"

  # Service account configuration
  serviceAccount:
    create: true
    annotations: {}

  ## Additional labels to add to all resources
  customLabels: {}
  
  # Additional pod annotations
  podAnnotations: {}

  # pod security context
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 20001
    fsGroup: 30001

  # container security context
  securityContext:
    capabilities:
      drop:
      - ALL
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 20001
    allowPrivilegeEscalation: false
    seccompProfile:
      type: RuntimeDefault

  # Configuration for the Qdrant operator service to expose metrics
  service:
    enabled: true
    type: ClusterIP
    metricsPort: 9290

  # Configuration for the Qdrant operator service monitor to scrape metrics
  serviceMonitor:
    enabled: false

  # Resource requests and limits for the Qdrant operator
  resources: {}

  # Node selector for the Qdrant operator
  nodeSelector: {}

  # Tolerations for the Qdrant operator
  tolerations: []

  # Affinity configuration for the Qdrant operator
  affinity: {}

  watch:
    # If true, watches only the namespace where the Qdrant operator is deployed, otherwise watches the namespaces in watch.namespaces
    onlyReleaseNamespace: true
    # an empty list watches all namespaces.
    namespaces: []

  limitRBAC: true

  # Configuration for the Qdrant operator (v2)
  settings:
    # Does the operator run inside of a Kubernetes cluster (kubernetes) or outside (local)
    appEnvironment: kubernetes
    # The log level for the operator
    # Available options: DEBUG | INFO | WARN | ERROR
    logLevel: INFO
    # Metrics contains the operator config related the metrics
    metrics:
      # The port used for metrics
      port: 9290
    # Health contains the operator config related the health probe
    healthz:
      # The port used for the health probe
      port: 8285
    # Controller related settings
    controller:
      # The period a forced recync is done by the controller (if watches are missed / nothing happened)
      forceResyncPeriod: 10h
      # QPS indicates the maximum QPS to the master from this client.
      # Default is 200
      qps: 200
      # Maximum burst for throttle.
      # Default is 500.
      burst: 500
    # Features contains the settings for enabling / disabling the individual features of the operator
    features:
      # ClusterManagement contains the settings for qdrant (database) cluster management
      clusterManagement:
        # Whether or not the Qdrant cluster features are enabled.
        # If disabled, all other properties in this struct are disregarded. Otherwise, the individual features will be inspected.
        # Default is true.
        enable: true
        # The StorageClass used to make database and snapshot PVCs.
        # Default is nil, meaning the default storage class of Kubernetes.
        storageClass:
          # The StorageClass used to make database PVCs.
          # Default is nil, meaning the default storage class of Kubernetes.
          #database:
          # The StorageClass used to make snapshot PVCs.
          # Default is nil, meaning the default storage class of Kubernetes.
          #snapshot:
        #volumeAttributesClass:
        #  driverName: ebs.csi.aws.com
        #  default:
        #    name: balanced
        #    parameters:
        #      iops: 3000
        #      throughput: 125
        #  template:
        #    prefix: qdrant-vac
        #    parameters: {}
        # Qdrant config contains settings specific for the database
        qdrant:
          # The config where to find the image for qdrant
          image:
            # The repository where to find the image for qdrant
            # Default is "registry.cloud.qdrant.io/qdrant/qdrant"
            repository: registry.cloud.qdrant.io/qdrant/qdrant
            # Docker image pull policy
            # Default "IfNotPresent", unless the tag is dev, master or latest. Then "Always"
            #pullPolicy:
            # Docker image pull secret name
            # This secret should be available in the namespace where the cluster is running
            # Default not set
            pullSecretName: qdrant-registry-creds
          # storage contains the settings for the storage of the Qdrant cluster
          storage:
            performance:
              # CPU budget, how many CPUs (threads) to allocate for an optimization job.
              # If 0 - auto selection, keep 1 or more CPUs unallocated depending on CPU size
              # If negative - subtract this number of CPUs from the available CPUs.
              # If positive - use this exact number of CPUs.
              optimizerCpuBudget: 0
              # Enable async scorer which uses io_uring when rescoring.
              # Only supported on Linux, must be enabled in your kernel.
              # See: <https://qdrant.tech/articles/io_uring/#and-what-about-qdrant>
              asyncScorer: false
              # Async I/O mode, overrides asyncScorer. Available options: auto, disabled
              # Supported from Qdrant v1.19.0. Clusters on Qdrant v1.20.0 or later default to auto when not set.
              # Default is not set
              #ioUring: auto
          # Qdrant DB log level
          # Available options: DEBUG | INFO | WARN | ERROR
          # Default is "INFO"
          logLevel: INFO
          # Default Qdrant security context configuration
          securityContext:
            # Enable default security context
            # Default is false
            enabled: false
            # Default user for qdrant container
            # Default not set
            #user: 1000
            # Default fsGroup for qdrant container
            # Default not set
            #fsUser: 2000
            # Default group for qdrant container
            # Default not set
            #group: 3000
          # Network policies configuration for the Qdrant databases
          networkPolicies:
            # Whether or not NetworkPolicy management is enabled.
            # If set to false, no NetworkPolicies will be created.
            # Default is true.
            enable: true
            ingress:
              - ports:
                  - protocol: TCP
                    port: 6333
                  - protocol: TCP
                    port: 6334
            # Allow DNS resolution from qdrant pods at Kubernetes internal DNS server
            egress:
              - ports:
                  - protocol: UDP
                    port: 53
          # the settings for cloud inference proxy
          inference:
            # inference proxy endpoint
            # when set, the value is passed to Qdrant cluster config as `inference.address` config param
            # if QdrantCluster instance has `.spec.config.inference.enabled` field set
            address: ~
        # Scheduling config contains the settings specific for scheduling
        scheduling:
          # Default topology spread constraints (list from type corev1.TopologySpreadConstraint)
          # Default is an empty list
          topologySpreadConstraints: []
          # Default pod disruption budget (object from type policyv1.PodDisruptionBudgetSpec)
          # Default is not set
          podDisruptionBudget:  {}
        # ClusterManager config contains the settings specific for cluster manager
        clusterManager:
          # Whether or not the cluster manager (on operator level).
          # If disabled, all other properties in this struct are disregarded. Otherwise, the individual features will be inspected.
          # Default is false.
          enable: true
          # The endpoint address where the cluster manager can be reached
          endpointAddress: "http://qdrant-cluster-manager"
          # InvocationInterval is the interval between calls (started after the previous call is returned)
          # Default is 10 seconds
          invocationInterval: 10s
          # SyncClustersInterval is the interval between sync-clusters calls (started after the previous call is returned)
          # Default is 10 seconds
          syncClustersInterval: 10s
          # Timeout is the duration a single call to the cluster manager is allowed to take.
          # Default is 30 seconds
          timeout: 30s
          # syncClustersTimeout is the duration a single call to the cluster manager to sync clusters is allowed to take.
          # Default is 10 seconds
          syncClustersTimeout: 10s
          # Specifies overrides for the manage rules
          manageRulesOverrides:
            #dry_run:
            #max_transfers:
            #max_transfers_per_collection:
            #rebalance:
            #replicate:
          # Specifies overrides for the manage rules
          syncClustersRulesOverrides:
            #dry_run:
            #max_downtime_sec:
            #sync_interval_sec:
        # Ingress config contains the settings specific for ingress
        ingress:
          # Whether or not the Ingress feature is enabled.
          # Default is true.
          enable: false
          # Which specific ingress provider should be used
          # Default is KubernetesIngress
          provider: KubernetesIngress
          # The specific settings when the Provider is QdrantCloudTraefik
          qdrantCloudTraefik:
            # Enable tls
            # Default is false
            tls: false
            # Secret with TLS certificate
            # Default is None
            secretName: ""
            # List of Traefik middlewares to apply
            # Default is an empty list
            middlewares: []
            # IP Allowlist Strategy for Traefik
            # Default is None
            ipAllowlistStrategy:
            # Enable body validator plugin and matching ingressroute rules
            # Default is false
            enableBodyValidatorPlugin: false
            # EntryPoints is the list of traefik entry points to use for the ingress route
            # Default is ["web"] or ["websecure"] depending on the TLS setting
            entryPoints: []
          # The specific settings when the Provider is KubernetesIngress
          kubernetesIngress:
            # Name of the ingress class
            # Default is None
            #ingressClassName:
        # TelemetryTimeout is the duration a single call to the cluster telemetry endpoint is allowed to take.
        # Default is 3 seconds
        telemetryTimeout: 3s
        # MaxConcurrentReconciles is the maximum number of concurrent Reconciles which can be run. Defaults to 20.
        maxConcurrentReconciles: 20
        # VolumeExpansionMode specifies the expansion mode, which can be online or offline (e.g. in case of Azure).
        # Available options: Online, Offline
        # Default is Online
        volumeExpansionMode: Online
        # Disk scale-down shrinks storage by replacing a node with a smaller volume.
        # Requires the cluster manager (enabled by default) and Qdrant v1.19.2 or later.
        diskScaleDown:
          # Whether the operator may start a disk scale-down when the desired storage is smaller than an existing database volume.
          # Default is false.
          enable: false
      # BackupManagementConfig contains the settings for backup management
      backupManagement:
        # Whether or not the backup features are enabled.
        # If disabled, all other properties in this struct are disregarded. Otherwise, the individual features will be inspected.
        # Default is true.
        enable: true
        # Snapshots contains the settings for snapshots as part of backup management.
        snapshots:
          # Whether or not the Snapshot feature is enabled.
          # Default is true.
          enable: true
          # The VolumeSnapshotClass used to make VolumeSnapshots.
          # Default is "csi-snapclass".
          volumeSnapshotClass: "csi-snapclass"
          # The duration a snapshot is retained when the phase becomes Failed or Skipped
          # Default is 72h (3d).
          retainUnsuccessful: 72h
          # MaxConcurrentReconciles is the maximum number of concurrent Reconciles which can be run. Defaults to 1.
          maxConcurrentReconciles: 1
        # ScheduledSnapshots contains the settings for scheduled snapshot as part of backup management.
        scheduledSnapshots:
          # Whether or not the ScheduledSnapshot feature is enabled.
          # Default is true.
          enable: true
          # MaxConcurrentReconciles is the maximum number of concurrent Reconciles which can be run. Defaults to 1.
          maxConcurrentReconciles: 1
        # Restores contains the settings for restoring (a snapshot) as part of backup management.
        restores:
          # Whether or not the Restore feature is enabled.
          # Default is true.
          enable:  true
          # MaxConcurrentReconciles is the maximum number of concurrent Reconciles which can be run. Defaults to 1.
          maxConcurrentReconciles: 1
```

### Cluster Manager

The `qdrant-cluster-manager` block configures the cluster manager, which moves shards between nodes.

```yaml
qdrant-cluster-manager:
  replicaCount: 1

  image:
    repository: registry.cloud.qdrant.io/qdrant/cluster-manager
    pullPolicy: IfNotPresent
    # Overrides the image tag whose default is the chart appVersion.
    tag: ""

  imagePullSecrets:
    - name: qdrant-registry-creds
  nameOverride: ""
  fullnameOverride: "qdrant-cluster-manager"

  serviceAccount:
    # Specifies whether a service account should be created
    create: true
    # Automatically mount a ServiceAccount's API credentials?
    automount: true
    # Annotations to add to the service account
    annotations: {}
    # The name of the service account to use.
    # If not set and create is true, a name is generated using the fullname template
    name: ""

  podAnnotations: {}
  podLabels: {}

  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 20001
    fsGroup: 30001

  securityContext:
    capabilities:
      drop:
        - ALL
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 20001
    allowPrivilegeEscalation: false
    seccompProfile:
      type: RuntimeDefault

  service:
    type: ClusterIP

  networkPolicy:
    create: true

  resources: {}
    # We usually recommend not to specify default resources and to leave this as a conscious
    # choice for the user. This also increases chances charts run on environments with little
    # resources, such as Minikube. If you do want to specify resources, uncomment the following
    # lines, adjust them as necessary, and remove the curly braces after 'resources:'.
    # limits:
    #   cpu: 100m
    #   memory: 128Mi
    # requests:
    #   cpu: 100m
    #   memory: 128Mi

  nodeSelector: {}

  tolerations: []

  affinity: {}
```

### Cluster Exporter

The `qdrant-cluster-exporter` block configures the exporter, which exposes metrics about your Qdrant clusters in Prometheus format.

```yaml
qdrant-cluster-exporter:
  image:
    repository: registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter
    pullPolicy: Always
    # Overrides the image tag. Defaults to the chart appVersion.
    tag: ""

  imagePullSecrets:
    - name: qdrant-registry-creds

  nameOverride: ""
  fullnameOverride: ""

  serviceAccount:
    # Specifies whether a service account should be created
    create: true
    # Annotations to add to the service account
    annotations: {}
    # The name of the service account to use.
    # If not set and create is true, a name is generated using the fullname template
    name: ""

  rbac:
    create: true

  ## Additional labels to add to all resources
  customLabels: {}
  
  podAnnotations: {}

  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 65534
    runAsGroup: 65534
    fsGroup: 65534

  securityContext:
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    runAsUser: 65534
    runAsGroup: 65534

  service:
    enabled: true
    type: ClusterIP
    port: 9090
    portName: metrics

  strategy:
    # Prevents double-scraping by terminating the old pod before creating a new one
    # The pod scrapes a large volume of metrics with high cardinality
    type: Recreate

  resources: {}
    # We usually recommend not setting default resources and to leave this as a conscious
    # choice for the user. This allows charts to run on environments with fewer
    # resources, such as Minikube. If you do want to specify resources, uncomment the following
    # lines, adjust them as necessary, and remove the curly braces after 'resources:'.
    # limits:
    #   cpu: 100m
    #   memory: 128Mi
    # requests:
    #   cpu: 100m
    #   memory: 128Mi

  nodeSelector: {}

  tolerations: []

  affinity: {}

  serviceMonitor:
    enabled: false
    honorLabels: true
    scrapeInterval: 60s
    scrapeTimeout: 55s

  # Limit RBAC to the release namespace
  limitRBAC: true

  # Watched Namespaces Configuration
  watch:
    # If true, only the namespace where the exporter is deployed is watched, otherwise it watches the namespaces defined in watch.namespaces
    onlyReleaseNamespace: true
    # an empty list watches all namespaces
    namespaces: []

  # Configuration for the qdrant cluster exporter
  config:
    # The log level for the cluster-exporter
    # Available options: DEBUG | INFO | WARN | ERROR
    logLevel: INFO
    # Controller related settings
    controller:
      # Schedule for the controller to do a forced resync (if watches are missed / nothing happened)
      forceResyncPeriod: 10h
      # Indicates the maximum QPS from this client to the master
      # Default is 200
      qps: 200
      # Maximum burst for throttle.
      # Default is 500.
      burst: 500
      # Maximum number of concurrent reconciliations
      maxConcurrentReconciles: 20
      # Controller's object requeueing interval
      requeueInterval: 30s
    # Exporter Metrics Configuration
    metrics:
      # The port on which the metrics are exposed
      port: 9090
      # The path on which the metrics are exposed
      path: /metrics
    # Exporter Health Check Configuration
    healthz:
      # The port used for the health probe
      port: 8085
    # Qdrant Telemetry and Metrics Cache Configuration
    cache:
      # The period after which the cache is invalidated
      ttl: 60s
    # Qdrant Rest Client Configuration
    qdrant:
      restAPI:
        # The qdrant rest api port
        port: 6333
        # Qdrant API Request Timeout after which requests to Qdrant are canceled if not completed
        timeout: 20s
      # Path where qdrant exposes metrics
      metricsPath: "metrics"
      # Qdrant Telemetry Configuration
      telemetry:
        # Path where qdrant exposes telemetry
        path: "telemetry"
        # The level of details for telemetry
        detailsLevel: 6
        # Whether to anonymize the telemetry data
        anonymize: true
```
