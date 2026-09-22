---
title: "Scaling and Monitoring Hybrid Cloud"
weight: 10
---

# Scaling and Monitoring Hybrid Cloud

| Time: 25 min | Level: Intermediate | Stack: Kubernetes, Qdrant Hybrid Cloud |
| --- | --- | --- |

Scaling a Qdrant cluster on Hybrid Cloud looks like a Kubernetes problem from the outside: you have a pod, and you want it to have more CPU, memory, or disk. In practice, the Operator owns those numbers, and the supported way to change them is the `qcloud` CLI or the Cloud console, not `kubectl`. This tutorial covers three things you need before you resize anything: 

- how scaling actually behaves for each resource type
- how to check what your pod can really use once Hybrid Cloud's own reservation is applied
- how to read the metrics that tell you whether you need to scale in the first place

## Prerequisites

- A Qdrant Hybrid Cloud environment with a `QdrantCluster` already running. See the [Hybrid Cloud setup guide](/documentation/hybrid-cloud/hybrid-cloud-setup/) if you don't have one yet.
- The [`qcloud` CLI](/documentation/cloud-cli/), authenticated against your account.
- `kubectl` configured against your Hybrid Cloud cluster.

## Scale CPU, Memory, and Disk

Start by looking at what your cluster has today:

```bash
CLUSTER_ID="<your-cluster-id>"  # from the Cloud console URL
KUBENS="<your-namespace>" # the Kubernetes namespace configured for this Hybrid Cloud environment
qcloud cluster describe $CLUSTER_ID
```

For this tutorial, we start with the following resources setup:

```bash
Resources (per node):
  Disk:  8.00 GiB base, 8.00 GiB available (tier: cost-optimised)
  RAM:   2.00 GiB base, 0.40 GiB reserved, 1.60 GiB available
  CPU:   500m base, 40m reserved, 460m available
```

Now scale memory and disk together, since Hybrid Cloud packages tie disk size to a minimum matching the RAM tier:

```bash
qcloud cluster scale $CLUSTER_ID --ram 4GiB --disk 16GiB
```

Watch the pod while this applies:

```bash
kubectl get pods -n $KUBENS -w -o wide
```

You'll see the pod restart. Memory changes always restart the pod, because Qdrant reads its available memory once and doesn't adjust mid-run, so it needs a full restart to re-evaluate available memory.

Scale CPU next:

```bash
qcloud cluster scale $CLUSTER_ID --cpu 1000m
```

This restarts the pod too, for the same reason: Qdrant sizes its thread pools once, at startup, based on the CPU count it sees. A resize that changes what Kubernetes reports doesn't make Qdrant re-check and resize those pools on its own, so the Operator restarts the pod to pick up the new value cleanly.

Now scale disk on its own:

```bash
qcloud cluster scale $CLUSTER_ID --disk 32GiB
```

No restart this time. Disk resizes go through volume expansion, which Kubernetes and most storage backends support live.

<aside role="alert">
    Due to limitations in most cloud providers, once the disk has been upsized (in our case, from 8GiB to 16GiB, and then to 32GiB), it cannot be downsized. Provision disk expansions with caution.
</aside>

If you'd rather use the console UI, the same scaling controls live at the URL your `QdrantCluster` resource points to:

```bash
kubectl get qdrantcluster qdrant-$CLUSTER_ID \
    -n $KUBENS \
    -o jsonpath='{.metadata.annotations.cloud\.qdrant\.io/scale-url}'
```

Either path (CLI or console) goes through the same Cloud control plane, so the restart behavior is identical.

## Check What Your Pod Can Actually Use

Once you've scaled, it's tempting to assume Qdrant can use the full amount of resources you just set, but it can't. Hybrid Cloud reserves part of each pod's CPU and memory for the operating system, Kubernetes, and other system components, and the reserved share isn't the same for both resources.

```bash
qcloud cluster describe $CLUSTER_ID
```

If you followed along with the tutorial, you will see:

```text
Resources (per node):
  Disk:  16.00 GiB base, 32.00 GiB available (tier: cost-optimised)
  RAM:   4.00 GiB base, 0.80 GiB reserved, 3.20 GiB available
  CPU:   1000m base, 80m reserved, 920m available
```

Here, memory reserves 20% (0.80 of 4.00 GiB), but CPU reserves only 8% (80m of 1000m). Always check `qcloud cluster describe` for the actual reservation on your package, since the split between CPU and memory isn't fixed.

You can confirm the same numbers directly on the pod:

```bash
kubectl get pod <your-qdrant-pod> \
    -n $KUBENS \
    -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
```

Which will show:

```text
qdrant  {"limits":{"cpu":"920m","memory":"3435973837"},"requests":{"cpu":"920m","memory":"3435973837"}}
```

That's the 920m and 3.2 GiB from `qcloud cluster describe`, in bytes and millicores. These are the number that matter for capacity planning, not the raw package size.

Note that this reservation lives in the Cloud control plane, not in the `QdrantCluster` resource itself. Querying the CRD directly (`kubectl get qdrantcluster ... -o yaml`) won't show it.

## Know What to Monitor Before You Scale

Scaling on a hunch wastes money in one direction and risks an outage in the other. Check actual usage first, against the same resource numbers you just read from `qcloud cluster describe`.

Qdrant Cloud exposes two Prometheus-compatible endpoints: `/metrics` on each node for Qdrant-only data, and `/sys_metrics` on the cluster's main load-balanced endpoint for a superset that adds infrastructure-level data (load balancers, ingress, the Kubernetes workloads themselves). See the [full metrics reference](/documentation/cloud/cluster-monitoring/#qdrant-database-metrics-and-telemetry) for the complete list and authentication details.

A few of those metrics map directly to a scaling decision:

- **CPU pressure**: `container_cpu_cfs_throttled_periods_total` climbing means the pod is being throttled, a signal to scale CPU.
- **Memory pressure**: compare `container_memory_working_set_bytes` (or `memory_resident_bytes`) against `kube_pod_container_resource_limits`. Approaching the limit means you're close to the same threshold Qdrant Cloud's own alerting uses.
- **Disk pressure**: `kubelet_volume_stats_used_bytes` against `kubelet_volume_stats_capacity_bytes`.

You don't have to watch these yourself: Qdrant Cloud's built-in alerts fire automatically at 80% utilization for both [memory and disk](/documentation/cloud/cluster-monitoring/#alerts), plus separate alerts for CPU throttling and uneven resource distribution across nodes, so the metrics above explain why an alert fired rather than something you need to poll manually.

For dashboards, import Qdrant's official Grafana dashboard by following [Monitoring Hybrid/Private Cloud with Prometheus and Grafana](/documentation/ops-monitoring/hybrid-cloud-prometheus/), which walks through wiring up a dedicated Prometheus and Grafana stack against these same endpoints.

## Next Steps

You scaled CPU, memory, and disk independently and saw why only the first two restart the pod, read your cluster's real resource reservation, and know which metrics to check before scaling. See the [Hybrid Cloud cluster creation guide](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/) for the full set of settings the console controls, and [Monitoring Hybrid/Private Cloud with Prometheus and Grafana](/documentation/ops-monitoring/hybrid-cloud-prometheus/) for setting up dashboards.
