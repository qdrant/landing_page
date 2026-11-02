---
title: Troubleshooting
short_description: "Troubleshoot Qdrant Hybrid Cloud: what to collect first, and the usual causes and checks for timeouts, transport errors, dead replicas, pods stuck in Pending, and CPU throttling."
description: "Diagnose Qdrant Hybrid Cloud problems: collect the right information, then work through the usual causes of request timeouts, transport errors, dead replicas, pods stuck in Pending, and CPU throttling."
weight: 28
---

# Troubleshooting Qdrant Hybrid Cloud

Hybrid Cloud runs in your Kubernetes cluster. Some problems come from the Kubernetes layer, which you operate, and some from the database. See [Shared Responsibility](/documentation/shared-responsibility/) for who owns what.

## Collect Information First

```sh
# State of the components, as in the Console
kubectl get pods -n <your-qdrant-namespace>

# Why a pod is not ready, and the latest events
kubectl describe pod <POD> -n <your-qdrant-namespace>
kubectl get events -n <your-qdrant-namespace> --sort-by=.lastTimestamp

# Logs of the database pods of one cluster
kubectl -n <your-qdrant-namespace> logs -l app=qdrant,cluster-id=<CLUSTER_ID>
```

If you open a support ticket, attach the output and the [support bundle](/documentation/support/). The bundle collects environment metadata, but no user data or API keys. For the expected state of a healthy environment, see [Verify the Installation](/documentation/hybrid-cloud/hybrid-cloud-setup/#verify-the-installation).

## Symptoms and Usual Causes

| Symptom | Usual causes |
|---|---|
| Requests time out | A replica that does not respond yet, CPU throttling, lost contact between peers, or a client timeout shorter than the stall |
| Transport errors, such as broken pipes and disconnects | A restarted or deleted pod, a network problem between peers, an overloaded peer, or a proxy cutting long requests |
| Replicas are dead | A peer that was unreachable, a transfer that did not finish, or too few resources |
| Pods stay Pending | No node with capacity, a volume that cannot bind, scheduling rules that cannot be met, or an image that cannot be pulled |
| CPU throttling | A CPU limit that is too low for the work, or indexing that competes with queries and writes |

These problems often appear together. A pod that cannot be scheduled delays recovery, a replica that cannot recover becomes dead, connections to it fail, and clients time out. CPU throttling slows recovery, so the same chain lasts longer. Start with the lowest layer: Pending pods, then CPU throttling, then replica states.

## Timeouts

A replica that stops responding is still treated as active until the health checks mark it dead. Writes to it can wait until then. Check the other sections on this page for the cause, and make sure that the timeouts and retries of your client are longer than a restart or a recovery.

## Transport Errors

Look at the `RESTARTS` column of `kubectl get pods` and at the events for restarted or deleted pods. If you changed the network policies, make sure that the database pods can reach each other, including the internal port 6335. See [Configure network policies](/documentation/hybrid-cloud/networking-logging-monitoring/#configure-network-policies). If a proxy or load balancer sits between your clients and the cluster, check its idle and upstream timeouts for long requests.

## Dead Replicas

A replica is dead when it does not respond to health checks or fails to serve traffic. It stops receiving traffic from other peers. See [Horizontal Scaling](/documentation/scaling/horizontal-scaling/#replication). On Hybrid Cloud, the Operator recovers from database failures automatically if the collection has replicas. See [Resilience](/documentation/scaling/resilience/).

Dead replicas after a restart, a scaling operation, or a node loss are expected, and they recover. A replica that stays dead, or keeps switching between recovery and dead, points to a transfer that never finishes, nodes on different Qdrant versions, or too few resources. To see the state of the replicas of a collection, run:

```http
GET /collections/{collection_name}/cluster
```

## Pods Stay Pending

The events from `kubectl describe pod` name the reason. The usual ones are:

- **No capacity.** Hybrid Cloud does not add nodes to your Kubernetes cluster. The node pool needs room for the pod.
- **A volume that cannot bind.** Check the PVC with `kubectl get pvc -n <your-qdrant-namespace>`. The `StorageClass` must exist, and the volume must be in the zone of the node.
- **Scheduling rules.** Check the node selectors, tolerations, and topology spread constraints of the cluster. See [Scheduling Configuration](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#scheduling-configuration).
- **An image that cannot be pulled.** Check the registry credentials, or that your mirror has the image. See [Mirroring images and charts](/documentation/hybrid-cloud/hybrid-cloud-setup/#mirroring-images-and-charts).

## CPU Throttling

A rising `container_cpu_cfs_throttled_periods_total` means the pod is throttled. The [A Node is CPU Throttled](/documentation/cloud/cluster-alerts/) alert fires on Hybrid Cloud when throttling is above 25% for 30 minutes. Measure the `qdrant` container, not the whole pod, because sidecars such as a service mesh proxy hide the real throttling.

Throttling is common right after a scale-up, when new pods build indexes and receive shards, and during heavy ingestion, when indexing competes with queries and writes. To reduce it:

- Scale the CPU of the cluster. This restarts the pods.
- Write in batches and run fewer parallel writes.
- Tune the optimizer CPU budget. See [Advanced Optimizations](/documentation/cloud/configure-cluster/#advanced-optimizations).
