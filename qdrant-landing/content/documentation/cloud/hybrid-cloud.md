---
title: Hybrid Cloud
weight: 90
---

# Hybrid Cloud

Qdrant Hybrid Cloud allows you to attach your own infrastructure as a private region of the Qdrant Cloud. You can use Qdrant Cloud to manage your clusters, and run them in your own infrastructure.

## How it works

When you onboard a Kubernetes cluster as a Hybrid Cloud region, you can deploy the Qdrant Kubernetes Operator into this cluster. This operator manages the Qdrant databases within your Kubernetes cluster. The operator creates an outgoing connection to the Qdrant cloud at `cloud.qdrant.io` on port `443`. You can then have the same cloud management features and transport telemetry as is available with any managed Qdrant Cloud cluster.

Qdrant Cloud does not need access to the API of your Kubernetes cluster, or to any cloud provider, or other platform APIs. 

The Qdrant databases operate solely within your network, using your storage and compute resources.

## Signing up for Hybrid Cloud

To activate Hybrid Cloud, go to the Hybrid Cloud regions section, enter you company and billing information and request access.

## Creating a Hybrid Cloud region

The following sections specify prerequisites and required artifacts to set up a Qdrant cluster in your Hybrid Cloud region.

### Prerequisites

To create a Hybrid Cloud region, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/)Kubernetes cluster. You can run this cluster in any cloud, on-premise or edge environment, with distributions that range from AWS EKS to VMWare vSphere.

For storage, you need to set up the Kubernetes cluster with a Container Storage Interface (CSI) driver that provides block storage. For vertical scaling, the CSI driver needs to support volume expansion. For backups and restores, the driver needs to support CSI snapshots and restores.

<aside role="status">Network storage systems like NFS or object storage systems such as S3 are not supported.</aside>

To install the Qdrant Kubernetes Operator you need to have `cluster-admin` access in your Kubernetes cluster.

The Qdrant Kubernetes operator in your cluster needs to be able to connect to the Qdrant Cloud. It will create an outgoing connection to `cloud.qdrant.io` on port `443`.

By default, the Qdrant Cloud Agent and Operator pulls Helm charts and container images from `registry.cloud.qdrant.io`. The Qdrant database container image is pulled from `docker.io`.

You can also mirror these images and charts into your own registry and pull them from there.

### Required artifacts

To set up Hybrid Cloud, you need the following artifacts:

Container images

- `docker.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant/qdrant-operator`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-cluster-manager`

Open Containers Initiative (OCI) Helm charts

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-operator`

## Installation

To set up Hybrid Cloud, open the Qdrant Cloud Console at [cloud.qdrant.io](https://cloud.qdrant.io). On the dashboard, select **Hybrid Cloud Regions**, and then select **Create**.

You can then enter:

- Name: A name for the Private Region
- Kubernetes Namespace: The Kubernetes namespace for the operator and agent. Once you select a namespace, you can't change it.
- Agent version: The version of the Qdrant cloud agent.
- Operator version: Version of the Kubernetes operator.

You can then enter the YAML configuration for your Kubernetes operator. Qdrant supports a specific list of configuration options, as described in the [Operator Configuration](#operator-configuration) section.

If you have special requirements for any of the following, activate the **Show advanced configuration** option:

- Proxy server
- Container registry URL for Qdrant Operator and Agent images. The default is <https://registry.cloud.qdrant.io/qdrant/>.
- Helm chart repository URL for the Qdrant Operator and Agent. The default is <oci://registry.cloud.qdrant.io/qdrant-charts>.
- CA certificate
- Log level for the operator and agent

Once complete, select Create.

All settings but the Kubernetes namespace can be changed later.

### Generate Installation Command

After creating your Hybrid Cloud, select **Generate Installation Command** to generate a script that you can run in your Kubernetes cluster which will perform the initial installation of the Kubernetes operator and agent. It will:

- Create the Kubernetes namespace
- Set up the necessary secrets with credentials to access the Qdrant container registry and the Qdrant Cloud API.
- Sign in to the Helm registry at `registry.cloud.qdrant.io`
- Install the Qdrant cloud agent and Kubernetes operator chart

You need this command only for the initial installation. After that, you can update the agent and operator using the Qdrant Cloud Console.

## Creating a Qdrant cluster

Once you have created a Hybrid Cloud region, you can create a Qdrant cluster in that region. Use the same process to [Create a cluster](/documentation/cloud/create-cluster/). Make sure to select your Hybrid Cloud as the target region.

### Authentication at your Qdrant clusters

In Hybrid Cloud the authentication information is provided with Kubernetes secrets.

You can configure authentication for your Qdrant clusters in the "Configuration" section of the Qdrant Cluster detail page. There you can configure the Kubernetes secret name and key to be used as an API key and/or read-only API key.

One way to create a secret is with kubectl:

```
kubectl create secret generic qdrant-api-key --from-literal=api-key=your-secret-api-key
```

With this command the secret name would be `qdrant-api-key` and the key would be `api-key`.

### Exposing Qdrant clusters to your client applications

You can expose your Qdrant clusters to your client applications using Kubernetes services and ingresses. By default, a `ClusterIP` service is created for each Qdrant cluster. 

Within your Kubernetes cluster, you can access the Qdrant cluster using the service name and port:

```
http://qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24.qdrant-namespace.svc:6333
```

This endpoint is also visible on the cluster detail page.

If you want to access the database from your local developer machine, you can use `kubectl port-forward` to forward the service port to your local machine:

```
kubectl -n qdrant-namespace port-forward service/qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24 6333:6333
```

You can also expose the database outside the Kubernetes cluster with a `LoadBalancer` (if supported in your Kubernetes environment) or `NodePort` service or an ingress.

A simple Loadbalancer service could look like this:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24-lb
  namespace: qdrant-namespace
spec:
  type: LoadBalancer
  ports:
  - port: 6333
  - port: 6334
  selector:
    app: qdrant
    cluster-id: 9a9f48c7-bb90-4fb2-816f-418a46a74b24
```

An ingress could look like this:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24
  namespace: qdrant-namespace
spec:
    rules:
    - host: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24.your-domain.com
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24
              port:
                number: 6333
```

Please refer to the Kubernetes, ingress controller and cloud provider documention for more details.

### Network policies

For security reasons, each database cluster is secured with tight network policies. By default, the database pods do only allow egress traffic between themselves and only allow ingress traffic from the operator for monitoring.

To allow additional ingress or egress traffic, you can either deploy additionial network policieson your own

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24
  namespace: qdrant-namespace
spec:
  podSelector:
    matchLabels:
      app: qdrant
      cluster-id: 9a9f48c7-bb90-4fb2-816f-418a46a74b24
  policyTypes:
    - Ingress
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
      - protocol: TCP
        port: 6333
      - protocol: TCP
        port: 6334
```

Or you can modify the default network policies in the Hybrid Cloud environment configuration:

```yaml
qdrant:
  networkPolicies:
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

## Log levels

You can configure log levels for the databases individually in the configuration section of the Qdrant Cluster detail page.

The log level for the Qdrant Cloud Agent and Operator can be set in the Hybrid Cloud region configuration.

## Operator configuration

You should configure the Qdrant Operator with the configuration for the hybrid cloud. Use the following options, in YAML format:

```yaml
# Configuration for the Qdrant operator
settings:
  # Does the operator run inside of a Kubernetes cluster (kubernetes) or outside (local)
  app_environment: kubernetes
  # Retention for the backup history of Qdrant clusters
  backupHistoryRetentionDays: 2
  # Timeout configuration for the Qdrant operator operations
  operationTimeout: 7200 # 2 hours
  handlerTimeout: 21600 # 6 hours
  backupTimeout: 12600 # 3.5 hours
  # Incremental backoff configuration for the Qdrant operator operations
  backOff:
    minDelay: 5
    maxDelay: 300
    increment: 5
  # Cluster-manager configuration for a Qdrant cluster (experimental)
  clusterManager:
    image:
      repository: qdrant/qdrant-cloud-cluster-manager
      tag: 0.1.2
    pullInterval: 10
    logSize: 10
    debug: false
    # node_selector: {}
    # tolerations: []
  # Default ingress configuration for a Qdrant cluster
  ingress:
    enabled: false
    provider: KubernetesIngress # or NginxIngress
#    kubernetesIngress:
#      ingressClassName: ""
  # Default storage configuration for a Qdrant cluster
#  storage:
#    # Default VolumeSnapshotClass for a Qdrant cluster
#    snapshot_class: "csi-snapclass"
#    # Default StorageClass for a Qdrant cluster, uses cluster default StorageClass if not set
#    default_storage_class_names:
#      # StorageClass for DB volumes
#      db: ""
#      # StorageClass for snapshot volumes
#      snapshot: ""
  # Default scheduling configuration for a Qdrant cluster
#  scheduling:
#    default_topology_spread_constraints: []
#    default_pod_disruption_budget: {}
  qdrant:
    # Default security context for Qdrant cluster
#    securityContext:
#      enabled: false
#      user: ""
#      fsGroup: ""
#      group: ""
    # Default Qdrant image configuration
#    image:
#      pull_secret: ""
#      pull_policy: IfNotPresent
#      repository: qdrant/qdrant
    # Default Qdrant log_level
#    log_level: INFO
    # Default network policies to create for a qdrant cluster
    networkPolicies:
#      ingress:
#        - from:
#            - podSelector:
#                matchLabels:
#                  app.kubernetes.io/name: traefik
#              namespaceSelector:
#                matchLabels:
#                  kubernetes.io/metadata.name: kube-system
#          ports:
#            - protocol: TCP
#              port: 6333
#            - protocol: TCP
#              port: 6334
#            - protocol: TCP
#              port: 6335
      # Allow DNS resolution from qdrant pods at Kubernetes internal DNS server
      egress:
        - to:
            - namespaceSelector:
                matchLabels:
                  kubernetes.io/metadata.name: kube-system
          ports:
            - protocol: UDP
              port: 53
```

## Roadmap

We plan to introduce the following configuration options directly in the Qdrant Cloud Console in the future. If you need any of them beforehand, please contact our Support team.

* Node selectors
* Tolerations
* Affinities and anti-affinities
* Service types and annotations
* Ingresses
* Network policies
* Storage classes
* Volume snapshot classes