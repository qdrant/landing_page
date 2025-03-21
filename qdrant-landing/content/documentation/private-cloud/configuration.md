---
title: Configuration
weight: 2
---

# Private Cloud Configuration

The Qdrant Private Cloud helm chart has several configuration options. The following YAML shows all configuration options with their default values:

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

  # Optional image pull secrets
  imagePullSecrets:
    - name: qdrant-registry-creds

  nameOverride: ""
  fullnameOverride: "operator"

  # Service account configuration
  serviceAccount:
    create: true
    annotations: {}

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
        # Qdrant config contains settings specific for the database
        qdrant:
          # The config where to find the image for qdrant
          image:
            # The repository where to find the image for qdrant
            # Default is "qdrant/qdrant"
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
          # InvocationInterval is the interval between calls (started after the previous call is retured)
          # Default is 10 seconds
          invocationInterval: 10s
          # Timeout is the duration a single call to the cluster manager is allowed to take.
          # Default is 30 seconds
          timeout: 30s
          # Specifies overrides for the manage rules
          manageRulesOverrides:
            #dry_run:
            #max_transfers:
            #max_transfers_per_collection:
            #rebalance:
            #replicate:
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