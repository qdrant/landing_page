---
title: Managing a Cluster
short_description: "Manage Qdrant Private Cloud clusters declaratively with Kubernetes resources to configure, scale, and upgrade them."
description: "Manage Qdrant Private Cloud clusters declaratively in Kubernetes to configure scheduling, scale resources, and upgrade Qdrant versions."
weight: 10
---

# Managing a Qdrant Cluster

The most minimal QdrantCluster configuration is:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.20.0"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
```

The `id` should be unique across all Qdrant clusters in the same namespace, the `name` must follow the above pattern and the `cluster-id` and `customer-id` labels are mandatory.

You change a cluster by editing its `QdrantCluster` resource, for example with `kubectl apply` or `kubectl edit`. The Operator applies the change. There is no Console, CLI, or Cloud API for Private Cloud.

## Configuring a Cluster

The `QdrantCluster` spec has many settings. These are the common ones and where to find them:

| Setting | Find it in |
|---|---|
| Node selectors, tolerations, and topology spread constraints | [Scheduling Pods to Nodes](#scheduling-pods-to-nodes) |
| CPU, memory, and disk | [Scaling a Cluster](#scaling-a-cluster) |
| Qdrant version | [Upgrading the Qdrant version](#upgrading-the-qdrant-version) |
| Service type, annotations, ingress, and source ranges | [Exposing a Cluster](/documentation/private-cloud/security-exposure/#exposing-a-cluster) |
| Network policies | [Network Policies](/documentation/private-cloud/security-exposure/#network-policies) |
| API keys | [Authentication and Authorization](/documentation/private-cloud/security-exposure/#authentication-and-authorization) |
| TLS | [Configuring TLS for Database Access](/documentation/private-cloud/security-exposure/#configuring-tls-for-database-access) |
| Audit logging | [Audit Logging](/documentation/private-cloud/logging-monitoring/#audit-logging) |
| GPU indexing | [GPU support](#gpu-support) |
| Snapshot storage | [Ephemeral Snapshot Volumes](#ephemeral-snapshot-volumes) |
| Shard rebalancing | [Automatic Shard Rebalancing](#automatic-shard-rebalancing) |

For every other field, see the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/).

### Scheduling Pods to Nodes

To run the database pods on dedicated nodes, or to spread them across failure domains, set `nodeSelector`, `tolerations`, and `topologySpreadConstraints` on the cluster:

```yaml
spec:
  nodeSelector:
    workload: qdrant
  tolerations:
    - key: workload
      operator: Equal
      value: qdrant
      effect: NoSchedule
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: qdrant
```

These fields work as in Kubernetes. See [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). Spreading pods across zones does not by itself replicate your data across them. See [Multi-AZ Deployments](/documentation/scaling/resilience/#multi-az-deployments).

## Scaling a Cluster

To scale a cluster, update the CPU, memory, and storage resources in the `QdrantCluster` spec, or the number of nodes in `size`. The Operator applies the change.

| Change | Restart | Notes |
|---|---|---|
| CPU or memory, up or down | Always | Qdrant reads its memory and CPU count once, at startup, so the Operator restarts the pods. |
| Disk, increase | No, by default | Uses volume expansion. Whether the resize is online depends on your storage provider. If your storage needs a restart to resize, as with some Azure disks, set `volumeExpansionMode` to `Offline` in the [Operator configuration](/documentation/private-cloud/configuration/). The default is `Online`. |
| Disk, decrease | Each node is replaced | Off by default. See [Scaling Down Disk Space](#scaling-down-disk-space). |
| Number of nodes | | The Operator adds or removes pods. See [Automatic Shard Rebalancing](#automatic-shard-rebalancing). |

Increasing disk storage is only possible if your CSI driver and StorageClass allow volume expansion. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for the storage classes of your platform.

On a multi-node cluster with replicated collections, a restart rolls through the nodes one at a time and the cluster stays available. A single-node cluster, or a collection without replicas, is unavailable while its pod restarts. To restart all pods at once, which is faster but causes downtime, see `restartAllPodsConcurrently` in the [API Reference](/documentation/private-cloud/api-reference/).

### Before You Scale

- **Make sure the nodes have room.** The Operator does not add nodes to your Kubernetes cluster. The node pool needs capacity for the new pod size, and ideally one database pod fits one node.
- **Check the actual usage.** Look at CPU throttling, memory against the pod limit, and disk usage against the volume capacity. See [Logging & Monitoring](/documentation/private-cloud/logging-monitoring/).

### Resource Reservation

Private Cloud has no resource reservation. You set the CPU and memory in the spec, and Kubernetes tries to allocate exactly these resources for each pod. Because nothing is held back for you, leave room for the operating system and the Kubernetes system components when you choose the size of your nodes. See [Capacity Planning](/documentation/capacity-planning/) for sizing guidance.

### Scaling Down Disk Space

*Available as of Qdrant Private Cloud 1.13.0*

You can reduce `storage` in the QdrantCluster spec as well as increase it. A volume cannot be shrunk in place, so the Operator replaces the nodes instead. For each node, the Operator creates a new node with the smaller volume, lets the cluster manager move all shards from the old node to the new node, and deletes the old node once the cluster manager confirms it is no longer needed. It repeats this one node at a time until every node has the new disk size.

Disk scale-down works with all supported block storage solutions, but it is disabled by default in Private Cloud. When it is enabled, the Operator also shrinks a volume that someone resized by hand so that it no longer matches `storage` in the spec. Qdrant checked this behavior on Managed Cloud and Hybrid Cloud, but it cannot check it on your clusters. Enable it only if you do not resize volumes manually. To enable it, set `diskScaleDown.enable: true` in the operator settings of your Helm values, see [Configuration](/documentation/private-cloud/configuration/). It also requires the cluster manager, which is enabled by default, Qdrant v1.19.2 or later, and no `additionalVolumeClaimTemplates` on the cluster. If a requirement is missing, the Operator emits a `DiskScaleDownFailed` warning event on the QdrantCluster, keeps the current disks, and continues reconciling everything else.

The process doesn't cause downtime on a multi-node cluster with replicated collections. Keep the following in mind:

- The new disk size must still fit all the data on each node, with room to grow. Check the current disk usage before you scale down.
- Local snapshots on the old node's snapshots volume are not transferred and are deleted with the old node. Copy them off the cluster first if you need them.
- Replacing nodes can take a while, depending on how much data the cluster holds, and moving shards increases the disk I/O load until the process completes.
- Restoring the previous `storage` value before the Operator deletes the old node cancels the replacement.

## Upgrading the Qdrant version

To upgrade the Qdrant version of a database cluster, update the `version` field in the `QdrantCluster` spec. The Operator upgrades the cluster to the new version as a rolling restart. On a multi-node cluster with replicated collections, the upgrade runs with no downtime.

```yaml
spec:
  version: "v1.20.0"
```

Do not skip minor versions when upgrading. For example, if you are running version `v1.11.3`, you can upgrade to `v1.11.5` or `v1.12.6`, but not directly to `v1.13.0`.

Before you upgrade:

- Check the [Private Cloud Changelog](/documentation/private-cloud/changelog/) for the latest Qdrant version that your Private Cloud release is validated with.
- If you [mirror](/documentation/private-cloud/private-cloud-setup/#mirroring-images-and-charts) the images, add the new `qdrant/qdrant` image tag to your registry first, so that the pods can pull it.

Upgrade the cluster first, then update the client SDKs. This prevents your applications from using features that the older cluster version does not support yet. Keep your client SDK within one minor version of your cluster version.

### Upgrading the Operator

Qdrant does not update the Operator for you. You update the Operator, the cluster manager, and the cluster exporter with Helm: upgrade the CRD chart first, then the Private Cloud chart, using the paired versions from the changelog. See [Upgrades](/documentation/private-cloud/private-cloud-setup/#upgrades) for the commands. Upgrading the charts does not change the Qdrant version of your clusters.

## Exposing a Cluster

By default, a QdrantCluster is exposed only through an internal `ClusterIP` Service. To expose it with a `LoadBalancer` or `NodePort` Service or an `Ingress`, and to restrict who can reach it, see [Exposing a Cluster](/documentation/private-cloud/security-exposure/#exposing-a-cluster) and [Network Policies](/documentation/private-cloud/security-exposure/#network-policies).

## Authentication and Authorization

Clusters have no API key by default. To set API keys, read-only keys, and JWT role based access control, see [Authentication and Authorization](/documentation/private-cloud/security-exposure/#authentication-and-authorization).

### Configuring TLS for Database Access

See [Configuring TLS for Database Access](/documentation/private-cloud/security-exposure/#configuring-tls-for-database-access).

### Configuring TLS for Inter-cluster Communication

See [Configuring TLS for Inter-cluster Communication](/documentation/private-cloud/security-exposure/#configuring-tls-for-inter-cluster-communication).

## Audit Logging

Audit logging records API operations that require authentication or authorization as JSON entries. It is disabled by default and is enabled per cluster with `spec.config.audit` on the `QdrantCluster`. See [Audit Logging](/documentation/private-cloud/logging-monitoring/#audit-logging) for the configuration and for how to collect the entries.

## GPU support

Starting with Qdrant 1.13 and private-cloud version 1.6.1 you can create a cluster that uses GPUs to accelerate indexing.

As a prerequisite, you need to have a Kubernetes cluster with GPU support. You can check the [Kubernetes documentation](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/) for generic information on GPUs and Kubernetes, or the documentation of your specific Kubernetes distribution.

Examples:

* [AWS EKS GPU support](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/amazon-eks.html)
* [Azure AKS GPU support](https://docs.microsoft.com/en-us/azure/aks/gpu-cluster)
* [GCP GKE GPU support](https://cloud.google.com/kubernetes-engine/docs/how-to/gpus)
* [Vultr Kubernetes GPU support](https://blogs.vultr.com/whats-new-vultr-q2-2023)

Once you have a Kubernetes cluster with GPU support, you can create a QdrantCluster with GPU support:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.13.4"
  size: 1
  resources:
    cpu: 2
    memory: "8Gi"
    storage: "40Gi"
  gpu:
    gpuType: "nvidia"
```

Once the cluster pod has started, check its logs for a line such as `Found GPU device: ...` to confirm that Qdrant detects the GPU:

```shell
kubectl logs qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-0
```

For more GPU configuration options, see the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/).

## Ephemeral Snapshot Volumes

If you do not [create snapshots](https://api.qdrant.tech/api-reference/snapshots/create-snapshot), or there is no need
to keep them available after cluster restart, the snapshot storage classname can be set to `emptyDir`:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.13.4"
  size: 1
  resources:
    cpu: 2
    memory: "8Gi"
    storage: "40Gi"
  storageClassNames:
    snapshots: emptyDir
```

See [Kubernetes docs on emptyDir volumes](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) for more details,
on how k8s node ephemeral storage is allocated and used.

## Automatic Shard Rebalancing

Qdrant Private Cloud supports automatic shard rebalancing. Shards are continuously redistributed across the available nodes to keep data evenly distributed, including when you scale up or down the number of nodes in a cluster. Automatic rebalancing applies to the whole cluster. If you manually move a shard while it's active, and that move leaves a node's shard count or size outside the target, the shard can be moved back to correct it. Disable automatic shard rebalancing first if you need to manually control shard placement.

To enable automatic shard rebalancing, you can set the `rebalancestrategy` field in the QdrantCluster spec:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.15.1"
  size: 3
  rebalanceStrategy: by_count_and_size
  resources:
    cpu: 2
    memory: "8Gi"
    storage: "40Gi"
```

For a list of all available rebalancing strategies, see the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/#rebalancestrategy).

## Resharding

In Qdrant Cloud, you can change the number of shards in your existing collections without having to recreate the collection from scratch. This feature is called resharding and allows you to scale your collections up or down as needed. For more details see [Resharding](/documentation/cloud/cluster-scaling/#resharding).

