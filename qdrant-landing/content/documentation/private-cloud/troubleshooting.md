---
title: Troubleshooting
short_description: "Troubleshoot Qdrant Private Cloud: what to collect first, how to read the cluster phase, and the usual causes and checks for pods that do not start, clusters that do not become healthy, unreachable databases, timeouts, dead replicas, and failed backups."
description: "Diagnose Qdrant Private Cloud problems with kubectl: collect the right information, read the state of the Operator and of a QdrantCluster, and work through the usual causes of Pending pods, image pull errors, unreachable databases, dead replicas, CPU throttling, and failed backups."
weight: 27
---

# Troubleshooting Qdrant Private Cloud

Private Cloud has no Console that shows the state of your clusters, and Qdrant cannot see your environment. You diagnose with `kubectl` and your own logs and metrics. Some problems come from the Kubernetes layer, which you operate, and some from the database. See [Shared Responsibility](/documentation/shared-responsibility/) for who owns what.

## Collect Information First

The commands use the default namespace `qdrant-private-cloud`. Replace it with yours.

```sh
# State of the Operator, the cluster manager, the exporter, and the databases
kubectl get pods -n qdrant-private-cloud

# State of the Qdrant clusters, with the phase of each
kubectl get qdrantcluster -n qdrant-private-cloud

# Why a cluster or a pod is not ready, and the latest events
kubectl describe qdrantcluster <CLUSTER_NAME> -n qdrant-private-cloud
kubectl describe pod <POD> -n qdrant-private-cloud
kubectl get events -n qdrant-private-cloud --sort-by=.lastTimestamp

# Logs of the Operator
kubectl logs -n qdrant-private-cloud -l app.kubernetes.io/name=operator

# Logs of the database pods of one cluster
kubectl logs -n qdrant-private-cloud -l app=qdrant,cluster-id=<CLUSTER_ID>
```

The Operator logs show why a change to a `QdrantCluster` was not applied. For more detail, raise the log levels. See [Log Levels](/documentation/private-cloud/logging-monitoring/#log-levels).

If you open a support ticket, attach the output and the [support bundle](/documentation/support/). The support bundle script works on Private Cloud. It collects environment metadata, but no user data or API keys. For the expected state of a healthy installation, see [Verify the Installation](/documentation/private-cloud/private-cloud-setup/#verify-the-installation).

## Symptoms and Usual Causes

| Symptom | Usual causes |
|---|---|
| Pods stay Pending | No node with capacity, a volume that cannot bind, scheduling rules that cannot be met |
| `ImagePullBackOff` | Wrong registry credentials, no route to the registry or your mirror, an image that your mirror does not have |
| A `QdrantCluster` is not `Healthy` | A change that the Operator could not apply, pods that are not ready, or a cluster that is still scaling or upgrading |
| The Operator does not react to a change | The Operator is not running, it does not watch the namespace, or the CRD chart and the chart do not match |
| A client cannot connect | The cluster is exposed only inside Kubernetes, a network policy, a source range, a missing API key, or TLS settings |
| Requests time out | A replica that does not respond yet, CPU throttling, lost contact between peers, or a client timeout shorter than the stall |
| Replicas are dead | A peer that was unreachable, a transfer that did not finish, or too few resources |
| A backup or restore does not finish | No `VolumeSnapshotClass`, a disabled backup feature, or objects in different namespaces |

These problems often appear together. A pod that cannot be scheduled delays recovery, a replica that cannot recover becomes dead, connections to it fail, and clients time out. Start with the lowest layer: Pending pods and image pulls, then the cluster phase, then CPU throttling, then replica states.

## Pods Stay Pending

The events from `kubectl describe pod` name the reason. The usual ones are:

- **No capacity.** Private Cloud does not add nodes to your Kubernetes cluster. The node pool needs room for the pod. There is no resource reservation: Kubernetes allocates exactly the CPU and memory in the spec.
- **A volume that cannot bind.** Check the PVC with `kubectl get pvc -n qdrant-private-cloud`. The `StorageClass` must exist, and the volume must be in the zone of the node.
- **Scheduling rules.** Check the node selectors, tolerations, and topology spread constraints of the cluster. See [Scheduling Pods to Nodes](/documentation/private-cloud/qdrant-cluster-management/#scheduling-pods-to-nodes).

## Image Pull Errors

`ImagePullBackOff` and `ErrImagePull` mean that the kubelet cannot pull an image. Check, in this order:

- The registry secret. The pods pull with the `qdrant-registry-creds` secret, and it must exist in the namespace of the pods.
- The route from your nodes to `registry.cloud.qdrant.io`, or to your mirror.
- That your mirror holds every image, including the cluster exporter, and the image tag that the chart asks for. See [Mirroring Images and Charts](/documentation/private-cloud/private-cloud-setup/#mirroring-images-and-charts).

The cluster exporter pulls its image on every start, so an unreachable registry can also stop a restarted exporter.

## A Cluster Is Not Healthy

`kubectl get qdrantcluster` shows the phase of each cluster. `Healthy` is the normal state. `Creating`, `Updating`, `Scaling`, and `Upgrading` are normal while a change runs. Phases that start with `FailedTo`, such as `FailedToCreate` and `FailedToUpdate`, mean that the Operator could not complete the change. `NotReady` and `RecoveryMode` mean that the database is not serving as expected.

For a cluster that is stuck:

1. Run `kubectl describe qdrantcluster <CLUSTER_NAME>` and read the status and the events.
2. Check that all database pods are `Running` and ready, and look at their `RESTARTS`.
3. Read the Operator logs for errors about the cluster.
4. If the change is a scale-up, check that the pods can be scheduled, and that the storage provider can expand the volumes. See [Scaling a Cluster](/documentation/private-cloud/qdrant-cluster-management/#scaling-a-cluster).

## The Operator Does Not React

If you apply a `QdrantCluster` and nothing happens, check:

- That the Operator pod is `Running`, and that its logs show no errors.
- That the Operator watches the namespace of the cluster. By default it watches only its own namespace. See [Configuration](/documentation/private-cloud/configuration/).
- That the CRD chart and the Private Cloud chart match. Each release pairs one CRD chart version with one chart version, listed in the [changelog](/documentation/private-cloud/changelog/). See [Upgrades](/documentation/private-cloud/private-cloud-setup/#upgrades).

## A Client Cannot Connect

By default, a cluster is reachable only from inside the Kubernetes network, and it has no API key. Check, in this order:

1. **The Service.** Test from a pod inside the cluster first, with the Service name and port 6333. If that works, the database is fine and the problem is in how you expose it. See [Exposing a Cluster](/documentation/private-cloud/security-exposure/#exposing-a-cluster).
2. **Network policies.** The Operator creates a `NetworkPolicy` for each cluster. If you restricted the allowed sources, the client, or your ingress controller, must be in the list. See [Network Policies](/documentation/private-cloud/security-exposure/#network-policies).
3. **Source ranges.** Your cloud provider and your ingress controller enforce them, not the Operator. A wrong range blocks the client, and some setups ignore the field.
4. **API key and TLS.** A `401` or `403` points to the API key. A TLS error points to a certificate that does not match the host, or to TLS that is on in the database and off on the ingress, or the other way around. See [Authentication and Authorization](/documentation/private-cloud/security-exposure/#authentication-and-authorization).

## Timeouts and Transport Errors

A replica that stops responding is still treated as active until the health checks mark it dead. Writes to it can wait until then. Make sure that the timeouts and retries of your client are longer than a restart or a recovery.

Look at the `RESTARTS` column of `kubectl get pods` and at the events for restarted or deleted pods. If you changed the network policies, make sure that the database pods can reach each other, including the internal port 6335. If a proxy or load balancer sits between your clients and the cluster, check its idle and upstream timeouts for long requests.

## Dead Replicas

A replica is dead when it does not respond to health checks or fails to serve traffic. It stops receiving traffic from other peers. See [Horizontal Scaling](/documentation/scaling/horizontal-scaling/#replication). The Operator recovers from database failures automatically if the collection has replicas. See [Resilience](/documentation/scaling/resilience/).

Dead replicas after a restart, a scaling operation, or a node loss are expected, and they recover. A replica that stays dead, or keeps switching between recovery and dead, points to a transfer that never finishes, nodes on different Qdrant versions, or too few resources. To see the state of the replicas of a collection, run:

```http
GET /collections/{collection_name}/cluster
```

## CPU Throttling

A rising `container_cpu_cfs_throttled_periods_total` means the pod is throttled. Private Cloud sends no alerts, so set up your own. See [Alerts](/documentation/private-cloud/logging-monitoring/#alerts). Measure the `qdrant` container, not the whole pod, because sidecars such as a service mesh proxy hide the real throttling.

Throttling is common right after a scale-up, when new pods build indexes and receive shards, and during heavy ingestion, when indexing competes with queries and writes. To reduce it:

- Scale the CPU of the cluster. This restarts the pods.
- Write in batches and run fewer parallel writes.
- Tune the optimizer CPU budget in the collection configuration.

## Backups and Restores

Check the phase of the resource:

```sh
kubectl get qdrantclustersnapshot -n qdrant-private-cloud
kubectl get qdrantclusterrestore -n qdrant-private-cloud
kubectl describe qdrantclustersnapshot <NAME> -n qdrant-private-cloud
```

The usual causes of a snapshot that fails or is skipped are a `VolumeSnapshotClass` that does not exist or does not match the `StorageClass`, a CSI driver without snapshot support, and a backup feature that is turned off in the Operator values. The snapshot resource, the `VolumeSnapshot` objects, and the destination cluster must all be in the same namespace. Failed and skipped snapshots are deleted after `retainUnsuccessful`, 72 hours by default, so read them before then. See [Backups](/documentation/private-cloud/backups/).
