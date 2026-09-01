---
title: In-Place Pod Resizing on Kubernetes
short_description: "Resize a running Qdrant pod's CPU and memory on Kubernetes without a restart, using the 1.33+ in-place resize feature."
description: "Use Kubernetes in-place pod resize to raise a running Qdrant pod's CPU and memory limits without a restart, and track the resize through the Pod's conditions."
weight: 43
---

# In-Place Pod Resizing for Qdrant on Kubernetes

| Time: 20 min | Level: Intermediate | Stack: Kubernetes |
| --- | --- | --- |

Vertically scaling a stateful workload on Kubernetes has traditionally meant editing the pod spec and accepting a restart. For Qdrant, that means the pod leaves the cluster, reloads its segments from disk, and only rejoins once it is ready again. On a large collection, that can take a while.

Kubernetes 1.33 promoted **in-place pod resize** to beta ([KEP-1287](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/1287-in-place-update-pod-resources/README.md)), which adds a `/resize` subresource that lets you change a running container's CPU and memory without recreating the pod. The feature graduated to stable in [Kubernetes 1.35](https://kubernetes.io/blog/2025/12/19/kubernetes-v1-35-in-place-pod-resize-ga).

This tutorial uses in-place resize to size a Qdrant pod down at first, then bump it up at runtime, with no restart.

You will:

- Deploy Qdrant with the [Guaranteed Quality of Service (QoS) class](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/)
- Check the node's allocatable resources before requesting a resize
- Patch a running pod's `/resize` subresource to double its CPU and memory
- Watch the resize move through `PodResizePending` and `PodResizeInProgress`

## Prerequisites

- A Kubernetes cluster on v1.33 or later, for beta support, or v1.35 or later, where the feature is stable. This tutorial uses [`kind`](https://kind.sigs.k8s.io/) to create a local cluster, but any 1.33+ cluster works.
- `kubectl` and `helm` installed.
- `jq`, for reading pod status as JSON.

## Create a Cluster and Deploy Qdrant

Create a local cluster and confirm the server version is 1.33 or later, since in-place resize does not exist before that.

```bash
kind create cluster --name qdrant-resize-demo
kubectl version
```

Add the Qdrant Helm chart and deploy it with defaults:

```bash
helm repo add qdrant https://qdrant.github.io/qdrant-helm
helm repo update
helm upgrade --install qdrant-resize qdrant/qdrant
```

Wait for the pod to become ready before continuing:

```bash
while true
do
    ready=$(kubectl get pod qdrant-resize-0 --output=json | jq -r '.status.containerStatuses[0].ready')
    if [[ "$ready" == "true" ]]; then
        echo "Pod is ready!"
        break
    fi
done
```

## Set the QoS Class to Guaranteed

In-place resize works under any [QoS class](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/), but the guarantees differ: 

- A **Guaranteed** pod, where requests equal limits for both CPU and memory, keeps that equality through a resize, which makes the resulting state the most predictable
- A **Burstable** pod can resize more loosely, since requests and limits are allowed to differ
- A **BestEffort** pod, with no requests or limits at all, cannot be resized because there is nothing to resize

Check the class the default chart install produced:

```bash
qos_class=$(kubectl get pod qdrant-resize-0 -o jsonpath='{.status.qosClass}')
echo "QoS Class: $qos_class"
```

The default Qdrant Helm chart sets no resource requests or limits, so the pod comes up as BestEffort. QoS class is fixed at pod creation, so getting to Guaranteed means upgrading the release with requests and limits set:

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "500m"
    memory: "1Gi"
updateVolumeFsOwnership: false
```

<aside role="alert"><code>updateVolumeFsOwnership</code> is on by default in cloud environments. Turning it off here is <strong>safe only for this local demo</strong>: it disables the <code>ensure-dir-ownership</code> init container, whose resources can't be set upfront and would otherwise cap the pod at Burstable instead of Guaranteed. In the cloud, this tutorial works the same way, just at Burstable instead of Guaranteed.</aside>

Save this as `base-values.yaml` and upgrade the release:

```bash
helm upgrade --install qdrant-resize qdrant/qdrant -f base-values.yaml
```

Kubernetes recreates the pod once, since the resource fields on a fresh pod spec are not covered by in-place resize. Check the class again, and confirm the running and init containers picked up the new resources:

```bash
new_qos_class=$(kubectl get pod qdrant-resize-0 -o jsonpath='{.status.qosClass}')
echo "New QoS Class: $new_qos_class"

echo "Resources for runtime containers:"
kubectl get pod qdrant-resize-0 -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'

echo "Resources for init containers (should be empty if local):"
kubectl get pod qdrant-resize-0 -o jsonpath='{range .spec.initContainers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
```

The pod now reports `Guaranteed`, with 0.5 CPU and 1 GiB of memory reserved for the `qdrant` container.

Kubernetes also exposes a `resizePolicy` field per container, which controls whether a resize needs a restart. It has two values: 
- `NotRequired`, which applies the change to the running container and is the default when no policy is set
- `RestartContainer`, needed by workloads such as JVM-based containers that read memory limits only at startup, for example to set `-Xmx`. 

The Qdrant Helm chart sets no `resizePolicy`, so it defaults to `NotRequired`. If you have applied a custom policy elsewhere, check it before relying on a resize applying without a restart.

## Check What the Node Can Give You

Before requesting more resources, check what the node actually has available. A resize request the node cannot satisfy stays pending instead of applying:

```bash
kubectl describe node qdrant-resize-demo-control-plane | grep -A 6 Allocatable
```

You will see an output similar to the following:

```text
Allocatable:
  cpu:                14
  ephemeral-storage:  1003736440832
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             31510312Ki
  pods:               110
```

In this example, the Qdrant pod is currently using 0.5 of 14 CPUs and 1 GiB of roughly 30 GiB of memory, so there's plenty of headroom to grow into.

![Headroom for resizing, detailing allocatable resources, current limits and target limits for resizing](/documentation/tutorials/pod-resizing/resizing-headroom.png)

## Resize the Running Pod

Qdrant generally makes use of more CPU and memory as its budget grows, unless you constrain it otherwise through [configuration](/documentation/ops-configuration/configuration/) or [quotas](/documentation/ops-configuration/quotas/), so a larger pod translates into more usable capacity, not just headroom.

Patch the pod through the `/resize` subresource to double both CPU and memory:

```bash
kubectl patch pod qdrant-resize-0 --subresource resize --patch \
  '{"spec":{"containers":[{"name":"qdrant","resources":{"requests":{"memory":"2Gi","cpu":"1000m"},"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}'
```

`--subresource resize` is why this works on a running pod at all: `kubectl patch pod` against the main spec would normally be rejected, because most of a pod's spec is immutable once it is running, which is why the earlier QoS change forced a pod recreation. 

The resize subresource is a separate API endpoint carved out specifically for in-place resize: it accepts a resource change on a live pod without treating it as an illegal spec mutation.

Since this pod is Guaranteed, requests must keep equaling limits for both CPU and memory after the resize, which is why the patch raises both together. Resizing only one of them, or setting a request that doesn't match its limit, would change the pod's QoS class, which Kubernetes does not allow through a resize.

<aside role="alert">In cloud environments, where the pod stays Burstable rather than Guaranteed, the same patch has to set requests and limits to <strong>different</strong> quantities. A Burstable pod cannot have requests equal limits for both CPU and memory at once, since that combination is what defines Guaranteed, so a patch that raises both to the same value gets rejected instead of applied.</aside>

## Watch the Resize Happen

While the resize is in progress, poll the pod's conditions to see it move through its states. You should see `PodResizePending` while the node checks feasibility, then `PodResizeInProgress` while the kubelet applies the change to the running container, before the pod settles back to a steady state:

```bash
while true
do
    echo "================== POD STATUS =================="
    kubectl get pod qdrant-resize-0 -o jsonpath='{range .status.conditions[*]}{.type}{"="}{.status}{"\t"}{.message}{"\n"}{end}'
    echo ""
    echo "============== DESIRED RESOURCES ==============="
    desired=$(kubectl get pod qdrant-resize-0 -o jsonpath='{.spec.containers[*].resources}')
    echo "$desired" | jq
    echo "=============== ACTUAL RESOURCES ==============="
    actual=$(kubectl get pod qdrant-resize-0 -o jsonpath='{.status.containerStatuses[*].resources}')
    echo "$actual" | jq
    echo "=========== DIFF (DESIRED VS ACTUAL) ==========="
    diff <(echo "$desired") <(echo "$actual")
    sleep 1
done
```

Press `Ctrl+C` to stop the loop once the diff comes back empty.

During the resize, `.spec.containers[*].resources` (desired) and `.status.containerStatuses[*].resources` (actual) can briefly disagree. 

The container status also carries `.status.containerStatuses[*].allocatedResources`, which tracks what the kubelet has confirmed and is mostly relevant for scheduling. For monitoring a resize as it happens, comparing desired against actual is enough.

![Resizing timeline, showing the divide between desired and actual resources, as well as the status progression for the resizing operation](/documentation/tutorials/pod-resizing/resizing-timeline.png)

## Limitations to Keep in Mind

In-place resize has a defined scope, listed in full in the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/#limitations). The ones most relevant to a Qdrant deployment:

* Only CPU and memory are resizable. You cannot resize storage, GPUs, or other extended resources this way.
* Downsizing memory is best-effort: if the container is already using more than the new limit, the kubelet cannot reclaim it in place and the container gets OOM-killed and restarted instead.
* Init containers and ephemeral containers cannot be resized.

## Next Steps

You resized a live Qdrant pod's CPU and memory without a restart, which turns capacity planning from a maintenance-window operation into something you can adjust while the cluster keeps serving traffic. 

From here, the same `/resize` subresource is what a Vertical Pod Autoscaler or a custom controller would call to automate this based on observed load. See the [configuration reference](/documentation/ops-configuration/configuration/) and [quotas](/documentation/ops-configuration/quotas/) docs for how Qdrant reacts to the extra headroom once it's there.
