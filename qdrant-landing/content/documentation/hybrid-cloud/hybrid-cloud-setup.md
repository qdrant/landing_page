---
title: Hybrid Cloud setup
weight: 1
---

# Creating a Hybrid Cloud Environment

The following instruction set will show you how to properly setup a **Qdrant cluster** in your **Hybrid Cloud Environment**. 

To learn how Hybrid Cloud works, [read the overview document](/documentation/hybrid-cloud/). 

## Prerequisites

- **Kubernetes cluster:** To create a Hybrid Cloud Environment, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can run this cluster in any cloud, on-premise or edge environment, with distributions that range from AWS EKS to VMWare vSphere.
- **Storage:** For storage, you need to set up the Kubernetes cluster with a Container Storage Interface (CSI) driver that provides block storage. For vertical scaling, the CSI driver needs to support volume expansion. For backups and restores, the driver needs to support CSI snapshots and restores.

<aside role="status">Network storage systems like NFS or object storage systems such as S3 are not supported.</aside>

- **Permissions:** To install the Qdrant Kubernetes Operator you need to have `cluster-admin` access in your Kubernetes cluster.
- **Connection:** The Qdrant Kubernetes Operator in your cluster needs to be able to connect to Qdrant Cloud. It will create an outgoing connection to `cloud.qdrant.io` on port `443`.
- **Locations:** By default, the Qdrant Cloud Agent and Operator pulls Helm charts and container images from `registry.cloud.qdrant.io`. The Qdrant database container image is pulled from `docker.io`.

> **Note:** You can also mirror these images and charts into your own registry and pull them from there.

### Required artifacts

Container images:

- `docker.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant/qdrant-operator`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-cluster-manager`
- `registry.cloud.qdrant.io/qdrant/prometheus`
- `registry.cloud.qdrant.io/qdrant/prometheus-config-reloader`
- `registry.cloud.qdrant.io/qdrant/kube-state-metrics`

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-operator`
- `registry.cloud.qdrant.io/qdrant-charts/prometheus`

## Installation

1. To set up Hybrid Cloud, open the Qdrant Cloud Console at [cloud.qdrant.io](https://cloud.qdrant.io). On the dashboard, select **Hybrid Cloud**.

2. Before creating your first Hybrid Cloud Environment, you have to provide billing information and accept the Hybrid Cloud license agreement. The installation wizard will guide you through the process.

> **Note:** You will only be charged for the Qdrant cluster you create in a Hybrid Cloud Environment, but not for the environment itself.

3. Now you can specify the following:

- **Name:** A name for the Hybrid Cloud Environment
- **Kubernetes Namespace:** The Kubernetes namespace for the operator and agent. Once you select a namespace, you can't change it.

4. You can then enter the YAML configuration for your Kubernetes operator. Qdrant supports a specific list of configuration options, as described in the [Qdrant Operator configuration](/documentation/hybrid-cloud/operator-configuration/) section.

5. (Optional) If you have special requirements for any of the following, activate the **Show advanced configuration** option:

- Proxy server
- Container registry URL for Qdrant Operator and Agent images. The default is <https://registry.cloud.qdrant.io/qdrant/>.
- Helm chart repository URL for the Qdrant Operator and Agent. The default is <oci://registry.cloud.qdrant.io/qdrant-charts>.
- CA certificate
- Log level for the operator and agent

6. Once complete, click **Create**.

> **Note:** All settings but the Kubernetes namespace can be changed later.

### Generate Installation Command

After creating your Hybrid Cloud, select **Generate Installation Command** to generate a script that you can run in your Kubernetes cluster which will perform the initial installation of the Kubernetes operator and agent. It will:

- Create the Kubernetes namespace
- Set up the necessary secrets with credentials to access the Qdrant container registry and the Qdrant Cloud API.
- Sign in to the Helm registry at `registry.cloud.qdrant.io`
- Install the Qdrant cloud agent and Kubernetes operator chart

You need this command only for the initial installation. After that, you can update the agent and operator using the Qdrant Cloud Console.

> **Note:** If you generate the installation command a second time, it will re-generate the included secrets and you will have to apply the command again to update them.

## Creating a Qdrant cluster

Once you have created a Hybrid Cloud Environment, you can create a Qdrant cluster in that enviroment. Use the same process to [Create a cluster](/documentation/cloud/create-cluster/). Make sure to select your Hybrid Cloud Environment as the target.

### Authentication at your Qdrant clusters

In Hybrid Cloud the authentication information is provided with Kubernetes secrets.

You can configure authentication for your Qdrant clusters in the "Configuration" section of the Qdrant Cluster detail page. There you can configure the Kubernetes secret name and key to be used as an API key and/or read-only API key.

One way to create a secret is with kubectl:

```shell
kubectl create secret generic qdrant-api-key --from-literal=api-key=your-secret-api-key
```

With this command the secret name would be `qdrant-api-key` and the key would be `api-key`.

If you want to retrieve the secret again, you can also use kubect:

```shell
kubectl get secret qdrant-api-key -o jsonpath="{.data.api-key}" | base64 --decode
```

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
  - name: http
    port: 6333
  - name: grpc
    port: 6334
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

If you expose the database with such a way, you will be able to see this also reflected as an endpoint on the cluster detail page. And will see the Qdrant database dashboard link pointing to it.

## Deleting a Hybrid Cloud Environment

To delete a Hybrid Cloud Environment, first delete all Qdrant database clusters in it. Then you can delete the environment itself.

To clean up your Kubernetes cluster, after deleting the Hybrid Cloud Environment, you can use the following command:

```shell
helm -n the-qdrant-namespace delete qdrant-cloud-agent
helm -n the-qdrant-namespace delete qdrant-prometheus
helm -n the-qdrant-namespace delete qdrant-operator
kubectl -n the-qdrant-namespace patch HelmRelease.cd.qdrant.io qdrant-cloud-agent -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmRelease.cd.qdrant.io qdrant-prometheus -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmRelease.cd.qdrant.io qdrant-operator -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmChart.cd.qdrant.io the-qdrant-namespace-qdrant-cloud-agent -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmChart.cd.qdrant.io the-qdrant-namespace-qdrant-prometheus -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmChart.cd.qdrant.io the-qdrant-namespace-qdrant-operator -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl -n the-qdrant-namespace patch HelmRepository.cd.qdrant.io qdrant-cloud -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl delete namespace the-qdrant-namespace
kubectl get crd -o name | grep qdrant | xargs -n 1 kubectl delete
```
