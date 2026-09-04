---
title: In-Place Pod Resizing on Qdrant Hybrid Cloud
short_description: "Resize a running Qdrant pod's CPU and memory on Hybrid Cloud without a restart, and see why the resize stays capped at the cluster's configured limits."
description: "Use Kubernetes in-place pod resize to raise a running Qdrant pod's CPU and memory on Hybrid Cloud without a restart, and learn why the ceiling comes from the cluster configuration, not from kubectl."
weight: 43
---

# In-Place Pod Resizing for Qdrant on Hybrid Cloud

| Time: 20 min | Level: Intermediate | Stack: Kubernetes, Qdrant Hybrid Cloud |
| --- | --- | --- |

Vertically scaling a stateful workload on Kubernetes has traditionally meant editing the pod spec and accepting a restart. For Qdrant, that means the pod leaves the cluster, reloads its segments from disk, and only rejoins once it is ready again. On a large collection, that takes a while.

Kubernetes 1.33 promoted **in-place pod resize** to beta ([KEP-1287](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/1287-in-place-update-pod-resources/README.md)), which adds a `/resize` subresource that lets you change a running container's CPU and memory without recreating the pod. The feature graduated to stable in [Kubernetes 1.35](https://kubernetes.io/blog/2025/12/19/kubernetes-v1-35-in-place-pod-resize-ga).

On Qdrant Hybrid Cloud, this subresource works the same way it does on any conformant cluster, with one difference that matters: the Qdrant Operator sets your pod's `requests` and `limits` from the `QdrantCluster` resource, and it keeps them there. A resize inside that ceiling applies and sticks, whereas a resize past it gets rejected by the Kubernetes API itself, and an attempt to raise the ceiling through `kubectl` gets reverted by the Hybrid Cloud agent. This tutorial walks through both outcomes and shows the supported path for raising the ceiling itself.

You will:

- Confirm the QoS class the Operator already gives your pod
- Check the node's allocatable resources before requesting a resize
- Patch a running pod's `/resize` subresource within its existing limits
- Watch the resize move through `PodResizePending` and `PodResizeInProgress`
- See why a resize past the configured limit fails, and where to raise that limit instead

## Prerequisites

- A Qdrant Hybrid Cloud Environment, onboarded and healthy, with a `QdrantCluster` already running. See the [Hybrid Cloud setup guide](/documentation/hybrid-cloud/hybrid-cloud-setup/) if you have not created one yet.
- A Kubernetes cluster on v1.33 or later, for beta support, or v1.35 or later, where the feature is stable. Most managed Kubernetes offerings default to a recent enough version; check yours with `kubectl version`.
- `kubectl` configured against your Hybrid Cloud cluster, and `jq` for reading pod status as JSON.

## Check the QoS Class the Operator Set

Unlike a Qdrant pod deployed from the community Helm chart, which comes up as BestEffort until you set resources yourself, a Hybrid Cloud pod already has requests and limits from the `QdrantCluster` resource. Find your pod name and check its class:

```bash
kubectl get pods -n <your-namespace>
kubectl get pod <your-qdrant-pod> -n <your-namespace> -o jsonpath='{.status.qosClass}'
```

On a Hybrid Cloud cluster, this comes back `Burstable`, not `Guaranteed`, even though the main `qdrant` container's requests equal its limits. QoS class is decided across every container in the pod, including init containers, and the Operator's init container carries no resource limits of its own:

```bash
kubectl get pod <your-qdrant-pod> -n <your-namespace> -o jsonpath='{range .spec.initContainers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
```

An init container with no limits set caps the whole pod at Burstable, regardless of what the main container looks like. Confirm the main container's actual numbers:

```bash
kubectl get pod <your-qdrant-pod> -n <your-namespace> -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
```

You should see something close to:

```json
{"limits":{"cpu":"460m","memory":"1717986919"},"requests":{"cpu":"460m","memory":"1717986919"}}
```

Because the pod is Burstable, not Guaranteed, a resize does not have to keep requests equal to limits. You can raise one without the other, which gives you more flexibility than a Guaranteed pod allows.

## Check What the Node Can Give You

Before requesting more resources, check what the node actually has available. A resize request the node cannot satisfy stays pending instead of applying:

```bash
kubectl describe node <your-node-name> | grep -A 6 Allocatable
```

Compare that against your pod's current usage and the ceiling set by the `QdrantCluster` resource. The node's free capacity and the cluster's configured limit are two separate constraints, and you need headroom on both.

## Resize Within the Existing Limit

Try a small increase that stays under the current `limits`, moving `requests` closer to it:

```bash
kubectl patch pod <your-qdrant-pod> -n <your-namespace> --subresource resize --patch \
  '{"spec":{"containers":[{"name":"qdrant","resources":{"requests":{"memory":"1717986918","cpu":"450m"},"limits":{"memory":"1717986919","cpu":"460m"}}}]}}'
```

This applies immediately and does not restart the pod. You can confirm the change was applied by running:

```bash
kubectl get pod <your-qdrant-pod> -n <your-namespace> -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
```

`--subresource resize` is why this works on a running pod at all. A `kubectl patch pod` against the main spec would normally be rejected, since most of a pod's spec is immutable once it is running. The resize subresource is a separate API endpoint carved out specifically for in-place resize, and it accepts a resource change on a live pod without treating it as an illegal spec mutation.

## What Happens Past the Configured Limit

Try to request more than the `QdrantCluster` resource currently allows:

```bash
kubectl patch pod <your-qdrant-pod> -n <your-namespace> --subresource resize --patch \
  '{"spec":{"containers":[{"name":"qdrant","resources":{"requests":{"memory":"1717986920","cpu":"470m"},"limits":{"memory":"1717986919","cpu":"460m"}}}]}}'
```

The Kubernetes API rejects this outright:

```text
The Pod "<your-qdrant-pod>" is invalid:
* spec.containers[0].resources.requests: Invalid value: "470m": must be less than or equal to cpu limit of 460m
* spec.containers[0].resources.requests: Invalid value: "1717986920": must be less than or equal to memory limit of 1717986919
```

This is standard Kubernetes validation, not a Hybrid Cloud restriction: a request can never exceed its own limit, resize or not. To get real headroom, the limit itself has to move, and that is where Hybrid Cloud diverges from a self-managed cluster.

## Raising the Ceiling
 
To raise the ceiling itself, use the Qdrant Cloud console's scale option for your cluster, or hit its API directly. The `QdrantCluster` resource carries a `cloud.qdrant.io/scale-url` annotation pointing at that endpoint:
 
```bash
kubectl get qdrantcluster <your-cluster-name> -n <your-namespace> -o jsonpath='{.metadata.annotations.cloud\.qdrant\.io/scale-url}'
```
 
Once you raise the limit there, your pod's `limits` grow to match, and you have a new ceiling to resize within using the steps above.

## Limitations to Keep in Mind

In-place resize has a defined scope, listed in full in the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/#limitations). The ones most relevant to a Qdrant deployment:

* Only CPU and memory are resizable this way. Storage resizes on Hybrid Cloud through a separate path, and it does not require a restart either.
* Downsizing memory is best-effort. If the container is already using more than the new limit, the kubelet cannot reclaim it in place, and the container gets OOM-killed and restarted instead.
* Init containers and ephemeral containers cannot be resized.
* Qdrant checks the number of available CPUs once, at startup, and sizes its thread pools accordingly. A live CPU resize changes what Kubernetes reports as available to the container, but it does not prompt Qdrant to re-check and resize its own thread pools. Treat a CPU resize as raising the ceiling Kubernetes enforces, not as something Qdrant immediately puts to use. A memory resize does not carry this caveat, since Qdrant reads memory pressure continuously rather than once at startup.

## Next Steps

You resized a live Qdrant pod's CPU and memory within its configured limit, without a restart, and saw why raising that limit itself goes through the Qdrant Cloud console rather than through `kubectl`. See the [Hybrid Cloud cluster creation guide](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/) for the full set of settings the console controls, and the [configuration reference](/documentation/ops-configuration/configuration/) for how Qdrant reacts to added memory once it is there.
