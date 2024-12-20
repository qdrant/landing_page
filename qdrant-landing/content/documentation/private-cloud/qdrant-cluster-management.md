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

### Configuring TLS

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
