---
title: Managing a Cluster
weight: 3
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
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
```

The `id` should be unique across all Qdrant clusters in the same namespace, the `name` must follow the above pattern and the `cluster-id` and `customer-id` labels are mandatory.

There are lots more configuration options to configure scheduling, security, networking, and more. For full details see the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/).

## Scaling a Cluster

To scale a cluster, update the CPU, memory and storage resources in the QdrantCluster spec. The Qdrant operator will automatically adjust the cluster configuration. This operation is highly available on a multi-node cluster with replicated collections.

<aside role="status">Vertical scaling is only possible if your CSI driver and StorageClass allows volume expansion. Disk storage can not be downscaled.</aside>

## Upgrading the Qdrant version

To upgrade the Qdrant version of a database cluster, update the `version` field in the QdrantCluster spec. The Qdrant operator will automatically upgrade the cluster to the new version. The upgrade process is highly available on a multi-node cluster with replicated collections.

Note, that you should not skip minor versions when upgrading. For example, if you are running version `v1.11.3`, you can upgrade to `v1.11.4` or `v1.12.2`, but not directly to `v1.13.0`.

## Exposing a Cluster

By default, a QdrantCluster will be exposed through an internal `ClusterIP` service. To expose the cluster to the outside world, you can create a `NodePort` service, a `LoadBalancer` service or an `Ingress` resource.

This is an example on how to create a QdrantCluster with a `LoadBalancer` service:

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
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: nlb
```

Especially if you create a LoadBalancer Service, you may need to provide annotations for the loadbalancer configration. Please refer to the documention of your cloud provider for more details.

Examples:

* [AWS EKS LoadBalancer annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/ingress/annotations/)
* [Azure AKS Public LoadBalancer annotations](https://learn.microsoft.com/en-us/azure/aks/load-balancer-standard)
* [Azure AKS Internal LoadBalancer annotations](https://learn.microsoft.com/en-us/azure/aks/internal-lb)
* [GCP GKE LoadBalancer annotations](https://cloud.google.com/kubernetes-engine/docs/concepts/service-load-balancer-parameters)
* 
<aside role="alert">Internal communication channels are <strong>never</strong> protected by an API key nor bearer tokens. Internal gRPC uses port 6335. You must ensure that this port is not publicly reachable and can only be used for node communication. By default, Qdrant Private Cloud deployes a strict NetworkPolicy to only allow communication on port 6335 between Qdrant Cluster nodes.</aside>

## Authentication and Authorization

<aside role="alert">By default, clusters in Hybrid Cloud are only exposed through a Kubernetes ClusterIP Service inside of the Kubernetes network and not accessible to the outside, and no API key is configured. If you choose to expose the database internally or externally, you must configure an API key.</aside>

Authentication information is provided by Kubernetes secrets.

One way to create a secret is with kubectl:

```shell
kubectl create secret generic qdrant-api-key --from-literal=api-key=your-secret-api-key --from-literal=read-only-api-key=your-secret-read-only-api-key --namespace qdrant-private-cloud
```

The resulting secret will look like this:

```yaml
apiVersion: v1
data:
  api-key: ...
  read-only-api-key: ...
kind: Secret
metadata:
  name: qdrant-api-key
  namespace: qdrant-private-cloud
type: kubernetes.io/generic
```

You can reference the secret in the QdrantCluster spec:

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
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    service:
      api_key:
        secretKeyRef:
          name: qdrant-api-key
          key: api-key
      read_only_api_key:
        secretKeyRef:
          name: qdrant-api-key
          key: read-only-api-key
      jwt_rbac: true
```

If you set the `jwt_rbac` flag, you will also be able to create granular [JWT tokens for role based access control](/documentation/guides/security/#granular-access-control-with-jwt).

### Configuring TLS for Database Access

If you want to configure TLS for accessing your Qdrant database, there are two options:

* You can offload TLS at the ingress or loadbalancer level.
* You can configure TLS directly in the Qdrant database.

If you want to configure TLS directly in the Qdrant database, you can provide this as a secret.

To create such a secret, you can use `kubectl`:

```shell
 kubectl create secret tls qdrant-tls --cert=mydomain.com.crt --key=mydomain.com.key --namespace the-qdrant-namespace
```

The resulting secret will look like this:

```yaml
apiVersion: v1
data:
  tls.crt: ...
  tls.key: ...
kind: Secret
metadata:
  name: qdrant-tls
  namespace: the-qdrant-namespace
type: kubernetes.io/tls
```
You can reference the secret in the QdrantCluster spec:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: test-cluster
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    service:
      enable_tls: true
    tls:
      cert:
        secretKeyRef:
          name: qdrant-tls
          key: tls.crt
      key:
        secretKeyRef:
          name: qdrant-tls
          key: tls.key
```

### Configuring TLS for Inter-cluster Communication

*Available as of Operator v2.2.0*

<aside role="alert">
The feature can be enabled only at the cluster creation. Later changes are not possible.
</aside>

If you want to encrypt communication between Qdrant nodes, you need to enable TLS by providing
certificate, key, and root CA certificate used for generating the former.

Similar to the instruction stated in the previous section, you need to create a secret:

```shell
 kubectl create secret generic qdrant-p2p-tls \
        --from-file=tls.crt=qdrant-nodes.crt \
        --from-file=tls.key=qdrant-nodes.key \
        --from-file=ca.crt=root-ca.crt
        --namespace the-qdrant-namespace
```

The resulting secret will look like this:

```yaml
apiVersion: v1
data:
  tls.crt: ...
  tls.key: ...
  ca.crt: ...
kind: Secret
metadata:
  name: qdrant-p2p-tls
  namespace: the-qdrant-namespace
type: Opaque
```
You can reference the secret in the QdrantCluster spec:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: test-cluster
  labels:
    cluster-id: "my-cluster"
    customer-id: "acme-industries"
spec:
  id: "my-cluster"
  version: "v1.13.3"
  size: 2
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    service:
      enable_tls: true
    tls:
      caCert:
        secretKeyRef:
          name: qdrant-p2p-tls
          key: ca.crt
      cert:
        secretKeyRef:
          name: qdrant-p2p-tls
          key: tls.crt
      key:
        secretKeyRef:
          name: qdrant-p2p-tls
          key: tls.key
```

<aside role="status">
The operator assigns the names to nodes in cluster according to the following convention:

```
qdrant-{spec.id}-{node-index}.qdrant-headless-{spec.id}
```

Therefore, in addition to the domain used for accessing the database, 
the provided certificate must contain Subjective Alternative Names (SAN) for all foreseen nodes.
It can be created with a tool of your choice, e.g., 
using [step CLI](https://smallstep.com/docs/step-cli/installation/).
Following the example `QdrantCluster`, the proper certificate can be obtained with:

```shell
step certificate create mydomain.com qdrant-nodes.crt qdrant-nodes.key \
  --profile leaf --not-after 43800h \
  --ca root-ca.crt --ca-key root-ca.key \
  --san qdrant-my-cluster-0.qdrant-headless-my-cluster \
  --san qdrant-my-cluster-1.qdrant-headless-my-cluster
```
</aside>

## GPU support

Starting with Qdrant 1.13 and private-cloud version 1.6.1 you can create a cluster that uses GPUs to accelarate indexing.

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

Once the cluster Pod has started, you can check in the logs if the GPU is detected:

```shell
$ kubectl logs qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840-0

Starting initializing for pod 0
           _                 _
  __ _  __| |_ __ __ _ _ __ | |_
 / _` |/ _` | '__/ _` | '_ \| __|
| (_| | (_| | | | (_| | | | | |_
 \__, |\__,_|_|  \__,_|_| |_|\__|
    |_|

Version: 1.13.4, build: 7abc6843
Access web UI at http://localhost:6333/dashboard

2025-03-14T10:25:30.509636Z  INFO gpu::instance: Found GPU device: NVIDIA A16-2Q
2025-03-14T10:25:30.509679Z  INFO gpu::instance: Found GPU device: llvmpipe (LLVM 15.0.7, 256 bits)
2025-03-14T10:25:30.509734Z  INFO gpu::device: Create GPU device NVIDIA A16-2Q
...
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
