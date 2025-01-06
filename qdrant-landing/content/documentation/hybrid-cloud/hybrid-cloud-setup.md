---
title: Setup Hybrid Cloud
weight: 1
---

# Creating a Hybrid Cloud Environment

The following instruction set will show you how to properly set up a **Qdrant cluster** in your **Hybrid Cloud Environment**. 

You can also watch a video demo on how to set up a Hybrid Cloud Environment:
<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/BF02jULGCfo?si=apU1uQOE8AMjq9hD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

To learn how Hybrid Cloud works, [read the overview document](/documentation/hybrid-cloud/). 

## Prerequisites

- **Kubernetes cluster:** To create a Hybrid Cloud Environment, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can run this cluster in any cloud, on-premise or edge environment, with distributions that range from AWS EKS to VMWare vSphere. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for more information.
- **Storage:** For storage, you need to set up the Kubernetes cluster with a Container Storage Interface (CSI) driver that provides block storage. For vertical scaling, the CSI driver needs to support volume expansion. The `StorageClass` needs to be created beforehand. For backups and restores, the driver needs to support CSI snapshots and restores. The `VolumeSnapshotClass` needs to be created beforehand. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for more information.

<aside role="status">Network storage systems like NFS or object storage systems such as S3 are not supported.</aside>

- **Kubernetes nodes:** You need enough CPU and memory capacity for the Qdrant database clusters that you create. A small amount of resources is also needed for the Hybrid Cloud control plane components. Qdrant Hybrid Cloud supports x86_64 and ARM64 architectures.
- **Permissions:** To install the Qdrant Kubernetes Operator you need to have `cluster-admin` access in your Kubernetes cluster.
- **Connection:** The Qdrant Kubernetes Operator in your cluster needs to be able to connect to Qdrant Cloud. It will create an outgoing connection to `cloud.qdrant.io` on port `443`.
- **Locations:** By default, the Qdrant Cloud Agent and Operator pulls Helm charts and container images from `registry.cloud.qdrant.io`. The Qdrant database container image is pulled from `docker.io`.

> **Note:** You can also mirror these images and charts into your own registry and pull them from there.

### CLI tools

During the onboarding, you will need to deploy the Qdrant Kubernetes Operator and Agent using Helm. Make sure you have the following tools installed:

* [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
* [helm](https://helm.sh/docs/intro/install/)

You will need to have access to the Kubernetes cluster with `kubectl` and `helm` configured to connect to it. Please refer the documentation of your Kubernetes distribution for more information.

## Installation

1. To set up Hybrid Cloud, open the Qdrant Cloud Console at [cloud.qdrant.io](https://cloud.qdrant.io). On the dashboard, select **Hybrid Cloud**.

2. Before creating your first Hybrid Cloud Environment, you have to provide billing information and accept the Hybrid Cloud license agreement. The installation wizard will guide you through the process.

> **Note:** You will only be charged for the Qdrant cluster you create in a Hybrid Cloud Environment, but not for the environment itself.

3. Now you can specify the following:

- **Name:** A name for the Hybrid Cloud Environment
- **Kubernetes Namespace:** The Kubernetes namespace for the operator and agent. Once you select a namespace, you can't change it.

You can also configure the StorageClass and VolumeSnapshotClass to use for the Qdrant databases, if you want to deviate from the default settings of your cluster.

![Create Hybrid Cloud Environment](/documentation/cloud/hybrid_cloud_env_create.png)

4. You can then enter the YAML configuration for your Kubernetes operator. Qdrant supports a specific list of configuration options, as described in the [Qdrant Operator configuration](/documentation/hybrid-cloud/operator-configuration/) section.

5. (Optional) If you have special requirements for any of the following, activate the **Show advanced configuration** option:

- If you use a proxy to connect from your infrastructure to the Qdrant Cloud API, you can specify the proxy URL, credentials and cetificates.
- Container registry URL for Qdrant Operator and Agent images. The default is <https://registry.cloud.qdrant.io/qdrant/>.
- Helm chart repository URL for the Qdrant Operator and Agent. The default is <oci://registry.cloud.qdrant.io/qdrant-charts>.
- An optional secret with credentials to access your own container registry.
- Log level for the operator and agent
- Node selectors and tolerations for the operater, agent and monitoring stack

![Create Hybrid Cloud Environment - Advanced Configuration](/documentation/cloud/hybrid_cloud_advanced_configuration.png)

6. Once complete, click **Create**.

> **Note:** All settings but the Kubernetes namespace can be changed later.

### Generate Installation Command

After creating your Hybrid Cloud, select **Generate Installation Command** to generate a script that you can run in your Kubernetes cluster which will perform the initial installation of the Kubernetes operator and agent. 

![Rotate Hybrid Cloud Secrets](/documentation/cloud/hybrid_cloud_create_command.png)

It will:

- Create the Kubernetes namespace, if not present.
- Set up the necessary secrets with credentials to access the Qdrant container registry and the Qdrant Cloud API.
- Sign in to the Helm registry at `registry.cloud.qdrant.io`.
- Install the Qdrant cloud agent and Kubernetes operator chart.

You need this command only for the initial installation. After that, you can update the agent and operator using the Qdrant Cloud Console.

> **Note:** If you generate the installation command a second time, it will re-generate the included secrets, and you will have to apply the command again to update them.

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

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant-charts/operator`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cluster-manager`
- `registry.cloud.qdrant.io/qdrant-charts/prometheus`

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
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/operator your-registry.example.com/qdrant/operator
```

To sync all helm charts:

```shell
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/prometheus your-registry.example.com/qdrant-charts/prometheus
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/operator your-registry.example.com/qdrant-charts/operator
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-kubernetes-api your-registry.example.com/qdrant-charts/qdrant-kubernetes-api
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent your-registry.example.com/qdrant-charts/qdrant-cloud-agent
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/operator your-registry.example.com/qdrant-charts/operator
```

With the above configuration, you can add the following values to the advanced section of your Hybrid Cloud Environment:

* Container registry URL: `your-registry.example.com/qdrant`
* Chart repository URL: `oci://your-registry.example.com/qdrant-charts`

If your registry requires authentication, you can create and reference the secret the same way as described above.

### Rate limits at `docker.io`

By default, the Qdrant database image will be fetched from Docker Hub, which is the main source of truth. Docker Hub has rate limits for anonymous users. If you have larger setups and also fetch other images from their, you may run into these limits. To solve this, you can provide authentication information for Docker Hub.

First, create a secret with your Docker Hub credentials into your `the-qdrant-namespace` namespace:

```shell
kubectl create secret docker-registry dockerhub-registry-secret --namespace the-qdrant-namespace --docker-server=https://index.docker.io/v1/ --docker-username=<your-name> --docker-password=<your-pword> --docker-email=<your-email>
```

Then, you can reference this secret by adding the following configuration in the operator configuration YAML editor in the advanced section of the Hybrid Cloud Environment:

```yaml
qdrant:
  image:
    pull_secret: "dockerhub-registry-secret"
```

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

To clean up your Kubernetes cluster, after deleting the Hybrid Cloud Environment, you can use the following script to remove all Qdrant related resources:

Download the script at https://github.com/qdrant/qdrant-cloud-support-tools/tree/main/hybrid-cloud-cleanup. Then run the following command while being connected to your Kubernetes cluster. The script requires `kubectl` and `helm` to be installed.

```shell
./hybrid-cloud-cleanup.sh your-qdrant-namespace
```
