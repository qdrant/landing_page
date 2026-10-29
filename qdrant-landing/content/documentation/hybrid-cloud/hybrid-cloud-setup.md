---
title: Setup Hybrid Cloud
short_description: "Set up a Qdrant Hybrid Cloud Environment by installing the Operator and Cloud Agent into your own Kubernetes cluster."
description: "Onboard a Kubernetes cluster as a Qdrant Hybrid Cloud Environment by installing the Operator and Cloud Agent with the required storage and permissions."
weight: 5
---

# Creating a Hybrid Cloud Environment

The following instruction set will show you how to properly set up a **Qdrant cluster** in your **Hybrid Cloud Environment**. 

To learn how Hybrid Cloud works, [read the overview document](/documentation/hybrid-cloud/). 

## Prerequisites

Qdrant Hybrid Cloud is available as part of our Enterprise plan. To get access to Qdrant Hybrid Cloud, please [contact us](/contact-us/).

| Requirement | Details |
|---|---|
| **Kubernetes cluster** | A [standard compliant](https://www.cncf.io/training/certification/software-conformance/) cluster, in any cloud, on premises, or at the edge. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) |
| **Storage** | CSI block storage with a `StorageClass`. Scaling needs volume expansion, and backups need volume snapshots. NFS and S3 are not supported. Disk speed matters for bulk loads and on-disk search. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) and [Capacity Planning](/documentation/capacity-planning/#storage-focused-configuration) |
| **Nodes** | x86_64 or ARM64. The smallest Qdrant node needs 2 GiB of RAM, 0.5 vCPU, and 8 GiB of disk. Add capacity for the Hybrid Cloud control plane components. Plan more CPU for heavy ingestion. See [Capacity Planning](/documentation/capacity-planning/#cpu) |
| **Permissions** | `cluster-admin` access to install the Qdrant Cloud Agent |
| **Connection** | Outbound port 443 to `grpc.cloud.qdrant.io` and `api.cloud.qdrant.io` |
| **Images and charts** | Pulled from `registry.cloud.qdrant.io` by default. You can mirror them. See [Mirroring images and charts](#mirroring-images-and-charts) |

### CLI tools

During the onboarding, you will need to deploy the Qdrant Cloud Agent using Helm. Make sure you have the following tools installed:

* [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
* [helm](https://helm.sh/docs/intro/install/)

You will need to have access to the Kubernetes cluster with `kubectl` and `helm` configured to connect to it. Please refer the documentation of your Kubernetes distribution for more information.

## Installation

1. To set up Hybrid Cloud, open the Qdrant Cloud Console at [cloud.qdrant.io](https://cloud.qdrant.io). On the dashboard, select **Hybrid Cloud**.

2. Before creating your first Hybrid Cloud Environment, you have to provide billing information and accept the Hybrid Cloud license agreement. The installation wizard will guide you through the process.

    > **Note:** You will only be charged for the Qdrant cluster you create in a Hybrid Cloud Environment, but not for the environment itself.

3. Specify the following:

    - **Environment Name:** A name for the Hybrid Cloud Environment
    - **Kubernetes Namespace:** The Kubernetes namespace for the services (like agent and operator). Once you select a namespace, you can't change it.

   ![Create Hybrid Cloud Environment](/documentation/cloud/hybrid_cloud_env_create.png)

4. (Optional) Configure any of the following settings if needed:

    - Node selectors and tolerations for the operator, agent, cluster-manager and monitoring stack.
    - Control Plane Labels that will be added to all Kubernetes resources of the Hybrid Cloud control-plane components.
    ![Create Hybrid Cloud Environment - Connection Scheduling](/documentation/cloud/Hcloud_connection_scheduling_2.png)
    - If you use a proxy to connect from your infrastructure to the Qdrant Cloud API, you can specify the proxy URL, credentials and certificates.
    ![Create Hybrid Cloud Environment - Advanced Configuration](/documentation/cloud/hybrid_cloud_advanced_configuration.png)
    - Container registry URL for Qdrant services (like Agent, Operator, Cluster-manager and monitoring stack) images. The default is <https://registry.cloud.qdrant.io/qdrant/>.
    - Helm chart repository URL for the Qdrant services. The default is <oci://registry.cloud.qdrant.io/qdrant-charts>.
    - An optional secret with credentials to access your own container registry.
    - Custom cluster domain, if your Kubernetes cluster uses a non-default cluster domain (something other than `cluster.local`), so that in-cluster service addresses resolve correctly. Leave empty to use the default `cluster.local`.
    ![Create Hybrid Cloud Environment - Custom Registries](/documentation/cloud/Hcloud_connection_custom_registries.png)

5. Once complete, click the **Save and Generate Installation Command** button to proceed (see next section).

> **Note:** All settings but the Kubernetes namespace can be changed later.

### Generate Installation Command

Clicking **Save and Generate Installation Command** generates a script that you can run in your Kubernetes cluster to perform the initial installation of the Kubernetes operator and agent.

It will:

- Create the Kubernetes namespace, if not present.
- Set up the necessary secrets with credentials to access the Qdrant container registry and the Qdrant Cloud API.
- Sign in to the Helm registry at `registry.cloud.qdrant.io`.
- Install the Qdrant cloud agent and Kubernetes operator chart.

You need this command only for the initial installation. After that, you can update the agent and operator using the Qdrant Cloud Console.

> **Note:** If you generate the installation command a second time, it will re-generate the included secrets, and you will have to apply the command again to update them.

## Verify the Installation

After you run the installation command, check that the components are running.

In the Qdrant Cloud Console, open your Hybrid Cloud Environment. The overview shows the status of the environment, **Ready** or **Not Ready**, and the state and version of each component: **Operator State**, **Agent State**, **Cluster Manager State**, and **Prometheus State**. While a component is starting, it shows **Not Ready**. Until all of them are ready, the Console shows "Your environment is not yet ready to create clusters", and **Create Cluster** is disabled.

Each component runs as a pod in the namespace that you chose. List the pods to see the same state in Kubernetes:

```sh
kubectl get pods -n <your-qdrant-namespace>
```

```text
NAME                                                  READY   STATUS    RESTARTS   AGE
qdrant-cloud-agent-699c98c697-cjjng                   1/1     Running   0          2m
qdrant-cluster-exporter-6c495865d4-96677              1/1     Running   0          92s
qdrant-cluster-manager-5cb467bd68-lmc5k               1/1     Running   0          92s
qdrant-operator-v2-5477457974-zd88x                   1/1     Running   0          96s
qdrant-prometheus-kube-state-metrics-cb6996fc-d7vz6   1/1     Running   0          61s
qdrant-prometheus-server-6969df77dc-8jn9f             2/2     Running   0          61s
```

| Console | Pod |
|---|---|
| Operator | `qdrant-operator-v2` |
| Agent | `qdrant-cloud-agent` |
| Cluster Manager | `qdrant-cluster-manager` |
| Prometheus | `qdrant-prometheus-server` and `qdrant-prometheus-kube-state-metrics` |

The `qdrant-cluster-exporter` pod also runs in the namespace. When you create clusters, their pods appear here too.

If a component stays **Not Ready**, check its pod with `kubectl describe pod` and `kubectl logs`. If you open a support ticket, attach the output and the [support bundle](/documentation/support/).

## Advanced configuration

### Mirroring images and charts

#### Required artifacts

Container images:

- `registry.cloud.qdrant.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant/operator`
- `registry.cloud.qdrant.io/qdrant/cluster-manager`
- `registry.cloud.qdrant.io/qdrant/prometheus`
- `registry.cloud.qdrant.io/qdrant/prometheus-config-reloader`
- `registry.cloud.qdrant.io/qdrant/kube-state-metrics`
- `registry.cloud.qdrant.io/qdrant/kubernetes-event-exporter`
- `registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter`

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant-charts/operator`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cluster-manager`
- `registry.cloud.qdrant.io/qdrant-charts/prometheus`
- `registry.cloud.qdrant.io/qdrant-charts/kubernetes-event-exporter`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cluster-exporter`

To mirror all necessary container images and Helm charts into your own registry, you should use an automatic replication feature that your registry provides, so that you have new image versions available automatically. Alternatively you can manually sync the images with tools like [Skopeo](https://github.com/containers/skopeo). When syncing images manually, make sure that you sync then with all, or with the right CPU architecture.

##### Automatic replication

Ensure that you have both the container images in the `/qdrant/` repository, and the helm charts in the `/qdrant-charts/` repository synced. Then go to the advanced section of your Hybrid Cloud Environment and configure your registry locations:

* Container registry URL: `your-registry.example.com/qdrant` (this will for example result in `your-registry.example.com/qdrant/qdrant-cloud-agent`)
* Chart repository URL: `oci://your-registry.example.com/qdrant-charts` (this will for example result in `oci://your-registry.example.com/qdrant-charts/qdrant-cloud-agent`)

If you registry requires authentication, you have to create your own secrets with authentication information into your `the-qdrant-namespace` namespace.

Example:

```shell
kubectl --namespace the-qdrant-namespace create secret docker-registry my-creds --docker-server='your-registry.example.com' --docker-username='your-username' --docker-password='your-password'
```

You can then reference they secret in the advanced section of your Hybrid Cloud Environment.

##### Manual replication

This example uses Skopeo.

You can find your personal credentials for the Qdrant Cloud registry in the onboarding command, or you can fetch them with `kubectl`:

```shell
kubectl get secrets qdrant-registry-creds --namespace the-qdrant-namespace -o jsonpath='{.data.\.dockerconfigjson}' | base64 --decode | jq -r '.'
```

First login to the source registry:

```shell
skopeo login registry.cloud.qdrant.io
```

Then login to your own registry:

```shell
skopeo login your-registry.example.com
```

To sync all container images:

```shell
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/operator your-registry.example.com/qdrant/operator
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent your-registry.example.com/qdrant/qdrant-cloud-agent
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/prometheus your-registry.example.com/qdrant/prometheus
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/prometheus-config-reloader your-registry.example.com/qdrant/prometheus-config-reloader
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/kube-state-metrics your-registry.example.com/qdrant/kube-state-metrics
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/qdrant your-registry.example.com/qdrant/qdrant
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/cluster-manager your-registry.example.com/qdrant/cluster-manager
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter your-registry.example.com/qdrant/qdrant-cluster-exporter
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/kubernetes-event-exporter your-registry.example.com/qdrant/kubernetes-event-exporter
```

To sync all helm charts:

```shell
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/prometheus your-registry.example.com/qdrant-charts/prometheus
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/operator your-registry.example.com/qdrant-charts/operator
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-kubernetes-api your-registry.example.com/qdrant-charts/qdrant-kubernetes-api
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent your-registry.example.com/qdrant-charts/qdrant-cloud-agent
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-cluster-exporter your-registry.example.com/qdrant-charts/qdrant-cluster-exporter
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/kubernetes-event-exporter your-registry.example.com/qdrant-charts/kubernetes-event-exporter
```

With the above configuration, you can add the following values to the advanced section of your Hybrid Cloud Environment:

* Container registry URL: `your-registry.example.com/qdrant`
* Chart repository URL: `oci://your-registry.example.com/qdrant-charts`

If your registry requires authentication, you can create and reference the secret the same way as described above.

## Rotating Secrets

If you need to rotate the secrets to pull container images and charts from the Qdrant registry and to authenticate at the Qdrant Cloud API, you can do so by following these steps:

* Go to the Hybrid Cloud environment list or the detail page of the environment.
* In the actions menu, choose "Rotate Secrets"
* Confirm the action
* You will receive a new installation command that you can run in your Kubernetes cluster to update the secrets.

If you don't run the installation command, the secrets will not be updated and the communication between your Hybrid Cloud Environment and the Qdrant Cloud API will not work.

![Rotate Hybrid Cloud Secrets](/documentation/cloud/hybrid_cloud_rotate_secrets.png)

## Deleting a Hybrid Cloud Environment

To delete a Hybrid Cloud Environment, first delete all Qdrant database clusters in it. Then you can delete the environment itself.

To clean up your Kubernetes cluster, after deleting the Hybrid Cloud Environment, you can download the script from https://github.com/qdrant/qdrant-cloud-support-tools/tree/main/hybrid-cloud-cleanup to remove all Qdrant related resources.

<aside role="alert">
    This will destroy all Qdrant related resources from your cluster and is non reversible. Please make sure to double check your environment and that you have created and tested your backups before proceeding.
</aside>

Run the following command while being connected to your Kubernetes cluster. The script requires `kubectl` and `helm` to be installed.

```shell
./hybrid-cloud-cleanup.sh your-qdrant-namespace
```
