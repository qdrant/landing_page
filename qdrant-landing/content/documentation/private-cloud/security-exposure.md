---
title: Security & Exposure
short_description: "Expose Qdrant Private Cloud clusters, restrict who can reach them with network policies and source ranges, and secure them with API keys, TLS, and verified container images."
description: "How to expose Qdrant Private Cloud clusters with Services and Ingress, what the Operator network policies cover, who enforces load balancer source ranges, how to configure API keys and TLS, and how to verify container images."
weight: 22
---

# Securing and Exposing Qdrant Private Cloud Clusters

Qdrant has no access to a Private Cloud installation, so you own its security. This page covers how to reach a cluster, who can reach it, how it authenticates clients, and how to verify the software you run. For the split of duties across deployment models, see [Shared Responsibility](/documentation/shared-responsibility/).

By default, a cluster is reachable only through an internal `ClusterIP` Service inside your Kubernetes network, and it has no API key. If you expose it to anything beyond that, configure an API key first.

## What Protects What

| Layer | What it does | Who enforces it |
|---|---|---|
| API keys and JWT | Authenticate clients on REST (6333) and gRPC (6334) | The database |
| TLS | Encrypts client traffic, and optionally traffic between nodes | The database, or your ingress or load balancer |
| Network policies | Limit which Pods can reach the database Pods | Your CNI plugin |
| Load balancer source ranges | Limit which client IP ranges can reach a `LoadBalancer` Service | Your cloud provider and Kubernetes load balancer stack |
| Ingress source ranges | Limit which client IP ranges can reach an ingress | Your ingress controller |

## Exposing a Cluster

By default, a QdrantCluster is exposed through an internal `ClusterIP` Service. Inside the Kubernetes cluster, reach it by Service name:

```
http://qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840.qdrant-private-cloud.svc:6333
```

From your own machine, forward the port:

```shell
kubectl --namespace qdrant-private-cloud \
  port-forward service/qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840 6333:6333
```

To expose the cluster outside Kubernetes, use a `NodePort` Service, a `LoadBalancer` Service, or an `Ingress`.

### LoadBalancer Service

This is an example of a QdrantCluster with a `LoadBalancer` Service:

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
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: nlb
    loadBalancerSourceRanges:
      - 203.0.113.0/24
```

You may need annotations for the load balancer configuration. See the documentation of your cloud provider:

* [AWS EKS LoadBalancer annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/service/annotations/)
* [Azure AKS Public LoadBalancer annotations](https://learn.microsoft.com/en-us/azure/aks/load-balancer-standard)
* [Azure AKS Internal LoadBalancer annotations](https://learn.microsoft.com/en-us/azure/aks/internal-lb)
* [GCP GKE LoadBalancer annotations](https://cloud.google.com/kubernetes-engine/docs/concepts/service-load-balancer-parameters)

<aside role="status">The Operator only writes <code>loadBalancerSourceRanges</code> onto the Service. Your cloud provider and Kubernetes load balancer stack enforce it, and some setups ignore the field. Check on your platform that traffic from outside the ranges is actually blocked. Do not rely on the field alone.</aside>

### Ingress

To expose a cluster through an ingress, set `spec.ingress`. The ingress provider is chosen for the whole installation in the Operator Helm values (`KubernetesIngress` by default, see [Configuration](/documentation/private-cloud/configuration/)).

```yaml
spec:
  ingress:
    enabled: true
    host: qdrant.example.com
    ingressClassName: nginx
    tls: true
    tlsSecretName: qdrant-tls
```

The NGINX and Traefik providers also take `allowedSourceRanges`, a list of CIDR ranges allowed to reach the ingress. As with load balancers, your ingress controller does the enforcing. See the [API Reference](/documentation/private-cloud/api-reference/) for every field.

<aside role="alert">Internal communication channels are <strong>never</strong> protected by an API key or bearer tokens. Internal gRPC uses port 6335. You must ensure that this port is not publicly reachable and can only be used for node communication. By default, Qdrant Private Cloud deploys a NetworkPolicy that keeps port 6335 open only between the nodes of a cluster.</aside>

## Network Policies

When network policies are enabled, which is the default, the Operator creates one `NetworkPolicy` for each cluster. It is named `qdrant-<cluster-id>` and selects the Pods of that cluster. It allows:

| Direction | Allowed traffic |
|---|---|
| Ingress and egress | Between the Pods of the cluster, on 6333 (REST), 6334 (gRPC), and 6335 (peer-to-peer) |
| Ingress | From the Operator and cluster manager Pods, in any namespace, on 6333 and 6334 |
| Ingress | On 6333 and 6334 with no source restriction, so any Pod on the cluster network can connect. This comes from the Helm values below |
| Egress | UDP 53 to the Kubernetes DNS server |
| Egress | REST to the write cluster, only if `spec.writeCluster` is set |

A NetworkPolicy only takes effect if your CNI plugin enforces them.

The policy does not authenticate anyone. It does not replace API keys or TLS. It also does not filter by client IP. With the default values, anything that can reach the Pods on 6333 or 6334 can send requests, and the API key is the only barrier.

### Restricting Client Access

The ingress and egress rules that the chart adds are in the Operator Helm values under `operator.settings.features.clusterManagement.qdrant.networkPolicies`. The default allows 6333 and 6334 from anywhere on the cluster network. To limit it to known clients, replace the default `ingress` entry with `from` rules:

```yaml
operator:
  settings:
    features:
      clusterManagement:
        qdrant:
          networkPolicies:
            enable: true
            ingress:
              - from:
                  - ipBlock:
                      cidr: 192.168.0.0/22
                  - podSelector:
                      matchLabels:
                        app: client-app
                    namespaceSelector:
                      matchLabels:
                        kubernetes.io/metadata.name: client-namespace
                  - podSelector:
                      matchLabels:
                        app: traefik
                    namespaceSelector:
                      matchLabels:
                        kubernetes.io/metadata.name: kube-system
                ports:
                  - port: 6333
                    protocol: TCP
                  - port: 6334
                    protocol: TCP
```

Include the Pods of your ingress controller or load balancer in the allowed sources, or external clients lose access. To turn network policy management off, set `enable: false`. Then no `NetworkPolicy` is created, and you must secure the port 6335 yourself.

## Authentication and Authorization

<aside role="alert">By default, clusters in Private Cloud are only exposed through a Kubernetes ClusterIP Service inside of the Kubernetes network and are not accessible from the outside, and no API key is configured. If you choose to expose the database internally or externally, you must configure an API key.</aside>

Authentication information is provided by Kubernetes secrets.

One way to create a secret is with kubectl:

```shell
kubectl create secret generic qdrant-api-key \
  --from-literal=api-key=your-secret-api-key \
  --from-literal=read-only-api-key=your-secret-read-only-api-key \
  --namespace qdrant-private-cloud
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
  version: "v1.20.0"
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

If you set the `jwt_rbac` flag, you can also create granular [JWT tokens for role based access control](/documentation/security/#granular-access-api-keys).

## TLS

### Configuring TLS for Database Access

To configure TLS for client access to your Qdrant database, there are two options:

* Offload TLS at the ingress or load balancer level.
* Configure TLS directly in the Qdrant database.

To configure TLS directly in the database, provide the certificate as a secret.

To create such a secret, you can use `kubectl`:

```shell
kubectl create secret tls qdrant-tls \
  --cert=mydomain.com.crt --key=mydomain.com.key \
  --namespace the-qdrant-namespace
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
  version: "v1.20.0"
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
You can enable this feature only when you create the cluster. Later changes are not possible.
</aside>

To encrypt communication between Qdrant nodes, enable TLS by providing a certificate, a key, and the root CA certificate that was used to generate them.

As in the previous section, create a secret:

```shell
kubectl create secret generic qdrant-p2p-tls \
  --from-file=tls.crt=qdrant-nodes.crt \
  --from-file=tls.key=qdrant-nodes.key \
  --from-file=ca.crt=root-ca.crt \
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
  version: "v1.20.0"
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
The Operator names the nodes of a cluster with this convention:

```
qdrant-{spec.id}-{node-index}.qdrant-headless-{spec.id}
```

So, in addition to the domain used to access the database, the certificate must contain Subject Alternative Names (SANs) for all foreseen nodes.
You can create it with a tool of your choice, for example the [step CLI](https://smallstep.com/docs/step-cli/installation/).
For the example `QdrantCluster`, you can get a proper certificate with:

```shell
step certificate create mydomain.com qdrant-nodes.crt qdrant-nodes.key \
  --profile leaf --not-after 43800h \
  --ca root-ca.crt --ca-key root-ca.key \
  --san qdrant-my-cluster-0.qdrant-headless-my-cluster \
  --san qdrant-my-cluster-1.qdrant-headless-my-cluster
```
</aside>

## Audit Logging

Audit logging records API operations that require authentication or authorization. See [Audit Logging](/documentation/private-cloud/logging-monitoring/#audit-logging).

## Verifying Container Images

Qdrant attaches a Software Bill of Materials (SBOM) to every released container image of the Qdrant components that run in your cluster. All images are scanned for vulnerabilities with [Trivy](https://trivy.dev/), and all images and Helm charts are signed with [Cosign](https://docs.sigstore.dev/).

Inspect the SBOM of an image with the tool of your choice, for example:

```bash
docker buildx imagetools inspect \
  registry.cloud.qdrant.io/qdrant/operator:latest \
  --format "{{ json .SBOM }}"
```

Verify the signature of an image with `cosign`:

```bash
cosign verify registry.cloud.qdrant.io/qdrant/operator:latest \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  --certificate-identity-regexp='https://github.com/qdrant/.*'
```

If you [mirror the images](/documentation/private-cloud/private-cloud-setup/#mirroring-images-and-charts) into your own registry, run the checks against the mirror, or before you mirror. See [Cloud Security](/documentation/cloud-security/) for more on how Qdrant secures its software.
