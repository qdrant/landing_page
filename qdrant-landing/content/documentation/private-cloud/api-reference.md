---
title: API Reference
weight: 5
---

# API Reference

## Packages
- [qdrant.io/v1](#qdrantiov1)


## qdrant.io/v1

Package v1 contains API Schema definitions for the qdrant.io v1 API group

### Resource Types
- [QdrantCloudRegion](#qdrantcloudregion)
- [QdrantCloudRegionList](#qdrantcloudregionlist)
- [QdrantCluster](#qdrantcluster)
- [QdrantClusterList](#qdrantclusterlist)
- [QdrantClusterRestore](#qdrantclusterrestore)
- [QdrantClusterRestoreList](#qdrantclusterrestorelist)
- [QdrantClusterScheduledSnapshot](#qdrantclusterscheduledsnapshot)
- [QdrantClusterScheduledSnapshotList](#qdrantclusterscheduledsnapshotlist)
- [QdrantClusterSnapshot](#qdrantclustersnapshot)
- [QdrantClusterSnapshotList](#qdrantclustersnapshotlist)
- [QdrantRelease](#qdrantrelease)
- [QdrantReleaseList](#qdrantreleaselist)





#### ClusterPhase

_Underlying type:_ _string_





_Appears in:_
- [QdrantClusterStatus](#qdrantclusterstatus)



#### ComponentPhase

_Underlying type:_ _string_





_Appears in:_
- [ComponentStatus](#componentstatus)



#### ComponentStatus







_Appears in:_
- [QdrantCloudRegionStatus](#qdrantcloudregionstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name specifies the name of the component |  |  |
| `namespace` _string_ | Namespace specifies the namespace of the component |  |  |
| `version` _string_ | Version specifies the version of the component |  |  |
| `phase` _[ComponentPhase](#componentphase)_ | Phase specifies the current phase of the component |  |  |
| `message` _string_ | Message specifies the info explaining the current phase of the component |  |  |


#### HelmRelease







_Appears in:_
- [QdrantCloudRegionSpec](#qdrantcloudregionspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `markedForDeletionAt` _string_ | MarkedForDeletionAt specifies the time when the helm release was marked for deletion |  |  |
| `object` _[HelmRelease](#helmrelease)_ | Object specifies the helm release object |  | EmbeddedResource: {} <br /> |


#### HelmRepository







_Appears in:_
- [QdrantCloudRegionSpec](#qdrantcloudregionspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `markedForDeletionAt` _string_ | MarkedForDeletionAt specifies the time when the helm repository was marked for deletion |  |  |
| `object` _[HelmRepository](#helmrepository)_ | Object specifies the helm repository object |  | EmbeddedResource: {} <br /> |


#### Ingress







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `enabled` _boolean_ | Enabled specifies whether to enable ingress for the cluster or not. |  |  |
| `annotations` _object (keys:string, values:string)_ | Annotations specifies annotations for the ingress. |  |  |
| `ingressClassName` _string_ | IngressClassName specifies the name of the ingress class |  |  |
| `host` _string_ | Host specifies the host for the ingress. |  |  |
| `tls` _boolean_ | TLS specifies whether to enable tls for the ingress.<br />The default depends on the ingress provider:<br />- KubernetesIngress: False<br />- NginxIngress: False<br />- QdrantCloudTraefik: Depending on the config.tls setting of the operator. |  |  |
| `tlsSecretName` _string_ | TLSSecretName specifies the name of the secret containing the tls certificate. |  |  |
| `nginx` _[NGINXConfig](#nginxconfig)_ | NGINX specifies the nginx ingress specific configurations. |  |  |
| `traefik` _[TraefikConfig](#traefikconfig)_ | Traefik specifies the traefik ingress specific configurations. |  |  |


#### KubernetesDistribution

_Underlying type:_ _string_





_Appears in:_
- [QdrantCloudRegionStatus](#qdrantcloudregionstatus)



#### KubernetesPod







_Appears in:_
- [KubernetesStatefulSet](#kubernetesstatefulset)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `annotations` _object (keys:string, values:string)_ | Annotations specifies the annotations for the Pods. |  |  |
| `labels` _object (keys:string, values:string)_ | Labels specifies the labels for the Pods. |  |  |
| `extraEnv` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#envvar-v1-core) array_ | ExtraEnv specifies the extra environment variables for the Pods. |  |  |


#### KubernetesService







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[ServiceType](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#servicetype-v1-core)_ | Type specifies the type of the Service: "ClusterIP", "NodePort", "LoadBalancer". | ClusterIP |  |
| `annotations` _object (keys:string, values:string)_ | Annotations specifies the annotations for the Service. |  |  |


#### KubernetesStatefulSet







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `annotations` _object (keys:string, values:string)_ | Annotations specifies the annotations for the StatefulSet. |  |  |
| `pods` _[KubernetesPod](#kubernetespod)_ | Pods  specifies the configuration of the Pods of the Qdrant StatefulSet. |  |  |


#### MetricSource

_Underlying type:_ _string_





_Appears in:_
- [Monitoring](#monitoring)



#### Monitoring







_Appears in:_
- [QdrantCloudRegionStatus](#qdrantcloudregionstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cAdvisorMetricSource` _[MetricSource](#metricsource)_ | CAdvisorMetricSource specifies the cAdvisor metric source |  |  |
| `nodeMetricSource` _[MetricSource](#metricsource)_ | NodeMetricSource specifies the node metric source |  |  |


#### NGINXConfig







_Appears in:_
- [Ingress](#ingress)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `allowedSourceRanges` _string array_ | AllowedSourceRanges specifies the allowed CIDR source ranges for the ingress. |  |  |
| `grpcHost` _string_ | GRPCHost specifies the host name for the GRPC ingress. |  |  |


#### NodeStatus







_Appears in:_
- [QdrantClusterStatus](#qdrantclusterstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name specifies the name of the node |  |  |
| `started_at` _string_ | StartedAt specifies the time when the node started (in RFC3339 format) |  |  |
| `state` _object (keys:[PodConditionType](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#podconditiontype-v1-core), values:[ConditionStatus](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#conditionstatus-v1-core))_ | States specifies the condition states of the node |  |  |
| `version` _string_ | Version specifies the version of Qdrant running on the node |  |  |


#### Operation







_Appears in:_
- [QdrantClusterStatus](#qdrantclusterstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[OperationType](#operationtype)_ | Type specifies the type of the operation |  |  |
| `phase` _[OperationPhase](#operationphase)_ | Phase specifies the phase of the operation |  |  |
| `id` _integer_ | Id specifies the id of the operation |  |  |
| `startTime` _string_ | StartTime specifies the time when the operation started |  |  |
| `completionTime` _string_ | CompletionTime specifies the time when the operation completed |  |  |
| `message` _string_ | Message specifies the message of the operation |  |  |
| `subOperation` _boolean_ | SubOperation specifies whether the operation is a sub-operation of another operation |  |  |
| `steps` _[OperationStep](#operationstep) array_ | Steps specifies the steps the operation has performed |  |  |


#### OperationPhase

_Underlying type:_ _string_





_Appears in:_
- [Operation](#operation)



#### OperationStep







_Appears in:_
- [Operation](#operation)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name specifies the name of the step |  |  |
| `id` _integer_ | Id specifies the id of the step |  |  |
| `phase` _[StepPhase](#stepphase)_ | Phase specifies the phase of the step |  |  |
| `message` _string_ | Message specifies the reason in case of failure |  |  |


#### OperationType

_Underlying type:_ _string_





_Appears in:_
- [Operation](#operation)



#### Pause







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `owner` _string_ | Owner specifies the owner of the pause request. |  |  |
| `reason` _string_ | Reason specifies the reason for the pause request. |  |  |
| `creationTimestamp` _string_ | CreationTimestamp specifies the time when the pause request was created. |  |  |


#### QdrantCloudRegion



QdrantCloudRegion is the Schema for the qdrantcloudregions API



_Appears in:_
- [QdrantCloudRegionList](#qdrantcloudregionlist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantCloudRegion` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantCloudRegionSpec](#qdrantcloudregionspec)_ |  |  |  |


#### QdrantCloudRegionList



QdrantCloudRegionList contains a list of QdrantCloudRegion





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantCloudRegionList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantCloudRegion](#qdrantcloudregion) array_ |  |  |  |


#### QdrantCloudRegionSpec



QdrantCloudRegionSpec defines the desired state of QdrantCloudRegion



_Appears in:_
- [QdrantCloudRegion](#qdrantcloudregion)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `id` _string_ | Id specifies the unique identifier of the region |  |  |
| `helmRepositories` _[HelmRepository](#helmrepository) array_ | HelmRepositories specifies the list of helm repositories to be created to the region |  |  |
| `helmReleases` _[HelmRelease](#helmrelease) array_ | HelmReleases specifies the list of helm releases to be created to the region |  |  |




#### QdrantCluster



QdrantCluster is the Schema for the qdrantclusters API



_Appears in:_
- [QdrantClusterList](#qdrantclusterlist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantCluster` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantClusterSpec](#qdrantclusterspec)_ |  |  |  |


#### QdrantClusterList



QdrantClusterList contains a list of QdrantCluster





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantCluster](#qdrantcluster) array_ |  |  |  |


#### QdrantClusterRestore



QdrantClusterRestore is the Schema for the qdrantclusterrestores API



_Appears in:_
- [QdrantClusterRestoreList](#qdrantclusterrestorelist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterRestore` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantClusterRestoreSpec](#qdrantclusterrestorespec)_ |  |  |  |


#### QdrantClusterRestoreList



QdrantClusterRestoreList contains a list of QdrantClusterRestore objects





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterRestoreList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantClusterRestore](#qdrantclusterrestore) array_ |  |  |  |


#### QdrantClusterRestoreSpec



QdrantClusterRestoreSpec defines the desired state of QdrantClusterRestore



_Appears in:_
- [QdrantClusterRestore](#qdrantclusterrestore)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `source` _[RestoreSource](#restoresource)_ | Source defines the source snapshot from which the restore will be done |  |  |
| `destination` _[RestoreDestination](#restoredestination)_ | Destination defines the destination cluster where the source data will end up |  |  |




#### QdrantClusterScheduledSnapshot



QdrantClusterScheduledSnapshot is the Schema for the qdrantclusterscheduledsnapshots API



_Appears in:_
- [QdrantClusterScheduledSnapshotList](#qdrantclusterscheduledsnapshotlist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterScheduledSnapshot` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantClusterScheduledSnapshotSpec](#qdrantclusterscheduledsnapshotspec)_ |  |  |  |


#### QdrantClusterScheduledSnapshotList



QdrantClusterScheduledSnapshotList contains a list of QdrantCluster





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterScheduledSnapshotList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantClusterScheduledSnapshot](#qdrantclusterscheduledsnapshot) array_ |  |  |  |


#### QdrantClusterScheduledSnapshotSpec



QdrantClusterScheduledSnapshotSpec defines the desired state of QdrantCluster



_Appears in:_
- [QdrantClusterScheduledSnapshot](#qdrantclusterscheduledsnapshot)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cluster-id` _string_ | Id specifies the unique identifier of the cluster |  |  |
| `scheduleShortId` _string_ | Specifies short Id which identifies a schedule |  | MaxLength: 8 <br /> |
| `schedule` _string_ | Cron expression for frequency of creating snapshots, see https://en.wikipedia.org/wiki/Cron.<br />The schedule is specified in UTC. |  | Pattern: `^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|([\d\*]+(\/|-)\d+)|\d+|\*) ?){5,7})$` <br /> |
| `retention` _string_ | Retention of schedule in hours |  | Pattern: `^[0-9]+h$` <br /> |




#### QdrantClusterSnapshot



QdrantClusterSnapshot is the Schema for the qdrantclustersnapshots API



_Appears in:_
- [QdrantClusterSnapshotList](#qdrantclustersnapshotlist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterSnapshot` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantClusterSnapshotSpec](#qdrantclustersnapshotspec)_ |  |  |  |


#### QdrantClusterSnapshotList



QdrantClusterSnapshotList contains a list of QdrantClusterSnapshot





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantClusterSnapshotList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantClusterSnapshot](#qdrantclustersnapshot) array_ |  |  |  |


#### QdrantClusterSnapshotPhase

_Underlying type:_ _string_





_Appears in:_
- [QdrantClusterSnapshotStatus](#qdrantclustersnapshotstatus)



#### QdrantClusterSnapshotSpec







_Appears in:_
- [QdrantClusterSnapshot](#qdrantclustersnapshot)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cluster-id` _string_ | The cluster ID for which a Snapshot need to be taken<br />The cluster should be in the same namespace as this QdrantClusterSnapshot is located |  |  |
| `creation-timestamp` _integer_ | The CreationTimestamp of the backup (expressed in Unix epoch format) |  |  |
| `scheduleShortId` _string_ | Specifies the short Id which identifies a schedule, if any.<br />This field should not be set if the backup is made manually. |  | MaxLength: 8 <br /> |
| `retention` _string_ | The retention period of this snapshot in hours, if any.<br />If not set, the backup doesn't have a retention period, meaning it will not be removed. |  | Pattern: `^[0-9]+h$` <br /> |




#### QdrantClusterSpec



QdrantClusterSpec defines the desired state of QdrantCluster



_Appears in:_
- [QdrantCluster](#qdrantcluster)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `id` _string_ | Id specifies the unique identifier of the cluster |  |  |
| `version` _string_ | Version specifies the version of Qdrant to deploy |  |  |
| `size` _integer_ | Size specifies the desired number of Qdrant nodes in the cluster |  | Maximum: 30 <br />Minimum: 1 <br /> |
| `servicePerNode` _boolean_ | ServicePerNode specifies whether the cluster should start a dedicated service for each node. | true |  |
| `clusterManager` _boolean_ | ClusterManager specifies whether to use the cluster manager for this cluster.<br />The Python-operator will deploy a dedicated cluster manager instance.<br />The Go-operator will use a shared instance.<br />If not set, the default will be taken from the operator config. |  |  |
| `suspend` _boolean_ | Suspend specifies whether to suspend the cluster.<br />If enabled, the cluster will be suspended and all related resources will be removed except the PVCs. | false |  |
| `pauses` _[Pause](#pause) array_ | Pauses specifies a list of pause request by developer for manual maintenance.<br />Operator will skip handling any changes in the CR if any pause request is present. |  |  |
| `distributed` _boolean_ | Deprecated |  |  |
| `image` _[QdrantImage](#qdrantimage)_ | Image specifies the image to use for each Qdrant node. |  |  |
| `resources` _[Resources](#resources)_ | Resources specifies the resources to allocate for each Qdrant node. |  |  |
| `security` _[QdrantSecurityContext](#qdrantsecuritycontext)_ | Security specifies the security context for each Qdrant node. |  |  |
| `tolerations` _[Toleration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core) array_ | Tolerations specifies the tolerations for each Qdrant node. |  |  |
| `nodeSelector` _object (keys:string, values:string)_ | NodeSelector specifies the node selector for each Qdrant node. |  |  |
| `config` _[QdrantConfiguration](#qdrantconfiguration)_ | Config specifies the Qdrant configuration setttings for the clusters. |  |  |
| `ingress` _[Ingress](#ingress)_ | Ingress specifies the ingress for the cluster. |  |  |
| `service` _[KubernetesService](#kubernetesservice)_ | Service specifies the configuration of the Qdrant Kubernetes Service. |  |  |
| `statefulSet` _[KubernetesStatefulSet](#kubernetesstatefulset)_ | StatefulSet specifies the configuration of the Qdrant Kubernetes StatefulSet. |  |  |
| `storageClassNames` _[StorageClassNames](#storageclassnames)_ | StorageClassNames specifies the storage class names for db and snapshots. |  |  |
| `topologySpreadConstraints` _[TopologySpreadConstraint](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#topologyspreadconstraint-v1-core)_ | TopologySpreadConstraints specifies the topology spread constraints for the cluster. |  |  |
| `podDisruptionBudget` _[PodDisruptionBudgetSpec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#poddisruptionbudgetspec-v1-policy)_ | PodDisruptionBudget specifies the pod disruption budget for the cluster. |  |  |
| `restartAllPodsConcurrently` _boolean_ | RestartAllPodsConcurrently specifies whether to restart all pods concurrently (also called one-shot-restart).<br />If enabled, all the pods in the cluster will be restarted concurrently in situations where multiple pods<br />need to be restarted like when RestartedAtAnnotationKey is added/updated or the Qdrant version need to be upgraded.<br />This helps sharded but not replicated clusters to reduce downtime to possible minimum during restart. |  |  |




#### QdrantConfiguration







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `collection` _[QdrantConfigurationCollection](#qdrantconfigurationcollection)_ | Collection specifies the default collection configuration for Qdrant. |  |  |
| `log_level` _string_ | LogLevel specifies the log level for Qdrant. |  |  |
| `service` _[QdrantConfigurationService](#qdrantconfigurationservice)_ | Service specifies the service level configuration for Qdrant. |  |  |
| `tls` _[QdrantConfigurationTLS](#qdrantconfigurationtls)_ | TLS specifies the TLS configuration for Qdrant. |  |  |
| `storage` _[StorageConfig](#storageconfig)_ | Storage specifies the storage configuration for Qdrant. |  |  |


#### QdrantConfigurationCollection







_Appears in:_
- [QdrantConfiguration](#qdrantconfiguration)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `replication_factor` _integer_ | ReplicationFactor specifies the default number of replicas of each shard |  |  |
| `write_consistency_factor` _integer_ | WriteConsistencyFactor specifies how many replicas should apply the operation to consider it successful |  |  |
| `vectors` _[QdrantConfigurationCollectionVectors](#qdrantconfigurationcollectionvectors)_ | Vectors specifies the default parameters for vectors |  |  |


#### QdrantConfigurationCollectionVectors







_Appears in:_
- [QdrantConfigurationCollection](#qdrantconfigurationcollection)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `on_disk` _boolean_ | OnDisk specifies whether vectors should be stored in memory or on disk. |  |  |


#### QdrantConfigurationService







_Appears in:_
- [QdrantConfiguration](#qdrantconfiguration)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `api_key` _[QdrantSecretKeyRef](#qdrantsecretkeyref)_ | ApiKey for the qdrant instance |  |  |
| `read_only_api_key` _[QdrantSecretKeyRef](#qdrantsecretkeyref)_ | ReadOnlyApiKey for the qdrant instance |  |  |
| `jwt_rbac` _boolean_ | JwtRbac specifies whether to enable jwt rbac for the qdrant instance<br />Default is false |  |  |
| `hide_jwt_dashboard` _boolean_ | HideJwtDashboard specifies whether to hide the JWT dashboard of the embedded UI<br />Default is false |  |  |
| `enable_tls` _boolean_ | EnableTLS specifies whether to enable tls for the qdrant instance<br />Default is false |  |  |


#### QdrantConfigurationTLS







_Appears in:_
- [QdrantConfiguration](#qdrantconfiguration)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cert` _[QdrantSecretKeyRef](#qdrantsecretkeyref)_ | Reference to the secret containing the server certificate chain file |  |  |
| `key` _[QdrantSecretKeyRef](#qdrantsecretkeyref)_ | Reference to the secret containing the server private key file |  |  |


#### QdrantImage







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `repository` _string_ | Repository specifies the repository of the Qdrant image.<br />If not specified defaults the config of the operator (or qdrant/qdrant if not specified in operator). |  |  |
| `pullPolicy` _[PullPolicy](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#pullpolicy-v1-core)_ | PullPolicy specifies the image pull policy for the Qdrant image.<br />If not specified defaults the config of the operator (or IfNotPresent if not specified in operator). |  |  |
| `pullSecretName` _string_ | PullSecretName specifies the pull secret for the Qdrant image. |  |  |


#### QdrantRelease



QdrantRelease describes an available Qdrant release



_Appears in:_
- [QdrantReleaseList](#qdrantreleaselist)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantRelease` | | |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[QdrantReleaseSpec](#qdrantreleasespec)_ |  |  |  |


#### QdrantReleaseList



QdrantReleaseList contains a list of QdrantRelease





| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `qdrant.io/v1` | | |
| `kind` _string_ | `QdrantReleaseList` | | |
| `metadata` _[ListMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#listmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `items` _[QdrantRelease](#qdrantrelease) array_ |  |  |  |


#### QdrantReleaseSpec



QdrantReleaseSpec defines the desired state of QdrantRelease



_Appears in:_
- [QdrantRelease](#qdrantrelease)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `version` _string_ | Version number (should be semver compliant).<br />E.g. "v1.10.1" |  |  |
| `default` _boolean_ | If set, this version is default for new clusters on Cloud.<br />There should be only 1 Qdrant version in the platform set as default. | false |  |
| `image` _string_ | Full docker image to use for this version.<br />If empty, a default image will be derived from Version (and qdrant/qdrant is assumed). |  |  |
| `unavailable` _boolean_ | If set, this version cannot be used for new clusters. | false |  |
| `endOfLife` _boolean_ | If set, this version is no longer actively supported. | false |  |
| `accountIds` _string array_ | If set, this version can only be used by accounts with given IDs. |  |  |
| `accountPrivileges` _string array_ | If set, this version can only be used by accounts that have been given the listed privileges. |  |  |
| `remarks` _string_ | General remarks for human reading |  |  |
| `releaseNotesURL` _string_ | Release Notes URL for the specified version |  |  |


#### QdrantSecretKeyRef







_Appears in:_
- [QdrantConfigurationService](#qdrantconfigurationservice)
- [QdrantConfigurationTLS](#qdrantconfigurationtls)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `secretKeyRef` _[SecretKeySelector](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#secretkeyselector-v1-core)_ | SecretKeyRef to the secret containing data to configure the qdrant instance |  |  |


#### QdrantSecurityContext







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `user` _integer_ | User specifies the user to run the Qdrant process as. |  |  |
| `group` _integer_ | Group specifies the group to run the Qdrant process as. |  |  |
| `fsGroup` _integer_ | FsGroup specifies file system group to run the Qdrant process as. |  |  |


#### RegionCapabilities







_Appears in:_
- [QdrantCloudRegionStatus](#qdrantcloudregionstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `volumeSnapshot` _boolean_ | VolumeSnapshot specifies whether the Kubernetes cluster supports volume snapshot |  |  |
| `volumeExpansion` _boolean_ | VolumeExpansion specifies whether the Kubernetes cluster supports volume expansion |  |  |


#### RegionPhase

_Underlying type:_ _string_





_Appears in:_
- [QdrantCloudRegionStatus](#qdrantcloudregionstatus)



#### ResourceRequests







_Appears in:_
- [Resources](#resources)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cpu` _string_ | CPU specifies the CPU request for each Qdrant node. |  |  |
| `memory` _string_ | Memory specifies the memory request for each Qdrant node. |  |  |


#### Resources







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `cpu` _string_ | CPU specifies the CPU limit for each Qdrant node. |  |  |
| `memory` _string_ | Memory specifies the memory limit for each Qdrant node. |  |  |
| `storage` _string_ | Storage specifies the storage amount for each Qdrant node. |  |  |
| `requests` _[ResourceRequests](#resourcerequests)_ | Requests specifies the resource requests for each Qdrant node. |  |  |


#### RestoreDestination







_Appears in:_
- [QdrantClusterRestoreSpec](#qdrantclusterrestorespec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name of the destination cluster |  |  |
| `namespace` _string_ | Namespace of the destination cluster |  |  |


#### RestorePhase

_Underlying type:_ _string_





_Appears in:_
- [QdrantClusterRestoreStatus](#qdrantclusterrestorestatus)



#### RestoreSource







_Appears in:_
- [QdrantClusterRestoreSpec](#qdrantclusterrestorespec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `snapshotName` _string_ | SnapshotName is the name of the snapshot from which we wish to restore |  |  |
| `namespace` _string_ | Namespace of the snapshot |  |  |


#### ScheduledSnapshotPhase

_Underlying type:_ _string_





_Appears in:_
- [QdrantClusterScheduledSnapshotStatus](#qdrantclusterscheduledsnapshotstatus)



#### StepPhase

_Underlying type:_ _string_





_Appears in:_
- [OperationStep](#operationstep)



#### StorageClassNames







_Appears in:_
- [QdrantClusterSpec](#qdrantclusterspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `db` _string_ | DB specifies the storage class name for db volume. |  |  |
| `snapshots` _string_ | Snapshots specifies the storage class name for snapshots volume. |  |  |


#### StorageConfig







_Appears in:_
- [QdrantConfiguration](#qdrantconfiguration)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `performance` _[StoragePerformanceConfig](#storageperformanceconfig)_ | Performance configuration |  |  |


#### StoragePerformanceConfig







_Appears in:_
- [StorageConfig](#storageconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `optimizerCPUBudget` _integer_ | OptimizerCPUBudget defines the number of CPU allocation.<br />If 0 - auto selection, keep 1 or more CPUs unallocated depending on CPU size<br />If negative - subtract this number of CPUs from the available CPUs.<br />If positive - use this exact number of CPUs. |  |  |
| `asyncScorer` _boolean_ | AsyncScorer enables io_uring when rescoring |  |  |


#### TraefikConfig







_Appears in:_
- [Ingress](#ingress)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `allowedSourceRanges` _string array_ | AllowedSourceRanges specifies the allowed CIDR source ranges for the ingress. |  |  |


#### VolumeSnapshotInfo







_Appears in:_
- [QdrantClusterSnapshotStatus](#qdrantclustersnapshotstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `volumeSnapshotName` _string_ | VolumeSnapshotName is the name of the volume snapshot |  |  |
| `volumeName` _string_ | VolumeName is the name of the volume that was backed up |  |  |
| `readyToUse` _boolean_ | ReadyToUse indicates if the volume snapshot is ready to use |  |  |
| `snapshotHandle` _string_ | SnapshotHandle is the identifier of the volume snapshot in the respective cloud provider |  |  |

