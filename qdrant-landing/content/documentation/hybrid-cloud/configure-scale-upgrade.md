---
title: Configure, Scale & Update Clusters
short_description: "Configure, scale, and update Qdrant Hybrid Cloud clusters: which changes restart pods, how disk and resource reservations work, and how the Operator and Agent update."
description: "Configure, scale, and update Qdrant Hybrid Cloud clusters on Kubernetes. Learn which changes restart pods, how online disk expansion and the 20% resource reservation work, and how Operator and Agent updates run."
weight: 15
---

# Configure, Scale & Update Qdrant Hybrid Cloud Clusters

You manage Hybrid Cloud clusters in the Qdrant Cloud Console, with the [`qcloud` CLI](/documentation/cloud-cli/), the [Cloud API](/documentation/cloud-api/), or [Terraform](/documentation/cloud-tools/terraform/). The Operator in your Kubernetes cluster applies the change. Change cluster resources through one of these tools, and not with `kubectl`, because the Operator owns the numbers.

## Configure Clusters

Hybrid Cloud clusters have the settings of a Managed Cloud cluster, such as collection defaults and strict mode. See [Configure Clusters](/documentation/cloud/configure-cluster/). They also have settings that control how the pods run in your Kubernetes cluster:

| Setting | Find it in |
|---|---|
| Node selectors, tolerations, and topology spread constraints | [Scheduling Configuration](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#scheduling-configuration) |
| API key and read-only API key from a Kubernetes secret | [Authentication](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#authentication-to-your-qdrant-clusters) |
| Service type, service annotations, and load balancer source ranges | [Exposing Qdrant clusters](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#exposing-qdrant-clusters-to-your-client-applications) |
| TLS | [Configuring TLS](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#configuring-tls) |
| Storage class, snapshot storage class, and volume snapshot class | [Create a Cluster](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/) |
| CPU and memory reservation | [Resource reservations](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#configuring-cpu-and-memory-resource-reservations) |

These changes restart the pods one at a time in a rolling restart:

- Version upgrades
- Database settings, such as the replication factor, the write consistency factor, the async scorer, the optimizer CPU budget, vectors on disk, the log level, audit logging, TLS, and the API key secrets
- Pod settings, such as the service type, node selectors, tolerations, topology spread constraints, annotations, pod labels, service annotations, the reserved CPU and memory percentages, and the storage classes

These changes take effect without a restart: allowed IP ranges, the restart mode, the shard rebalance strategy, the disk speed tier, the cost allocation label, and cluster labels.

## Scale Clusters

| Change | Restart | Notes |
|---|---|---|
| CPU or memory, up or down | Always | Qdrant reads its memory and CPU count once, at startup, so the Operator restarts the pods |
| Disk, increase only | No, by default | Uses online volume expansion. Whether the resize is online depends on your storage provider, and most cloud providers support it. If your storage needs a restart, as with some Azure disks, set `volumeExpansionMode` to `Offline` in the [Operator configuration](/documentation/hybrid-cloud/operator-configuration/). The default is `Online` |
| Disk, decrease | Not possible | Once you have increased the disk, you cannot reduce it, so provision disk with caution |
| Number of nodes | | See [Scale Clusters](/documentation/cloud/cluster-scaling/#horizontal-scaling) for shard rebalancing and [resharding](/documentation/cloud/cluster-scaling/#resharding) |

Online disk expansion needs a StorageClass with volume expansion enabled. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for your platform.

To scale, use the Console or the CLI. For example, to set the memory and the disk, and then only the CPU:

```sh
qcloud cluster scale <CLUSTER_ID> --ram 4GiB --disk 16GiB
qcloud cluster scale <CLUSTER_ID> --cpu 1000m
```

On a multi-node cluster with replicated collections, a restart rolls through the nodes one at a time and the cluster stays available. A single-node cluster, or a collection without replicas, is briefly unavailable while its pod restarts.

### Before You Scale

- **Make sure the nodes have room.** Hybrid Cloud does not add nodes to your Kubernetes cluster. The node pool needs capacity for the new pod size, and ideally one database pod fits one node.
- **Check the actual usage.** Look at CPU throttling with `container_cpu_cfs_throttled_periods_total`, memory with `container_memory_working_set_bytes` against the pod limit, and disk with `kubelet_volume_stats_used_bytes` against `kubelet_volume_stats_capacity_bytes`. See [Networking, Logging & Monitoring](/documentation/hybrid-cloud/networking-logging-monitoring/#monitoring).

### Resource Reservation

Qdrant Cloud reserves 20% of the CPU and memory of each pod for the operating system, Kubernetes, and system components. Qdrant can use the rest. The pod requests and limits are equal, and they match the available amount. You can change the reservation in the **Configuration** section of the cluster detail page. Smaller nodes can need a larger reservation, and larger nodes a smaller one.

`qcloud cluster describe <CLUSTER_ID>` shows the base, reserved, and available CPU and memory per node. The reservation is stored in the Cloud control plane, so `kubectl get qdrantcluster` does not show it.

## Update Clusters

### Qdrant Version

Update the version in the Console, or with the CLI:

```sh
qcloud cluster version list
qcloud cluster update <CLUSTER_ID> --version <VERSION>
```

A version update is a rolling restart. On a replicated multi-node cluster it runs with no downtime. If you mirror the images and charts, keep the mirror in sync so that new versions are available in your registry. See [Mirroring images and charts](/documentation/hybrid-cloud/hybrid-cloud-setup/#mirroring-images-and-charts). For the checks to run before and after, see [Update Clusters](/documentation/cloud/cluster-upgrades/).

### Operator and Agent

Qdrant Cloud updates the Operator and the Cloud Agent automatically, through the built-in Helm controller. The updates are tested, and you cannot defer or roll them back. They are frequent, because the components in your cluster must stay compatible with the Qdrant Cloud management plane.
