---
title: Setup Private Cloud
weight: 1
---

# Qdrant Private Cloud Setup

## Requirements

- **Kubernetes cluster:** To create a Hybrid Cloud Environment, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can run this cluster in any cloud, on-premise or edge environment, with distributions that range from AWS EKS to VMWare vSphere. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for more information.
- **Storage:** For storage, you need to set up the Kubernetes cluster with a Container Storage Interface (CSI) driver that provides block storage. For vertical scaling, the CSI driver needs to support volume expansion. For backups and restores, the driver needs to support CSI snapshots and restores.

<aside role="status">Network storage systems like NFS or object storage systems such as S3 are not supported.</aside>

- **Permissions:** To install the Qdrant Kubernetes Operator you need to have `cluster-admin` access in your Kubernetes cluster.
- **Locations:** By default, the Qdrant Operator Helm charts and container images are served from `registry.cloud.qdrant.io`.

> **Note:** You can also mirror these images and charts into your own registry and pull them from there.

### CLI tools

During the onboarding, you will need to deploy the Qdrant Kubernetes Operator using Helm. Make sure you have the following tools installed:

* [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
* [helm](https://helm.sh/docs/intro/install/)

You will need to have access to the Kubernetes cluster with `kubectl` and `helm` configured to connect to it. Please refer the documentation of your Kubernetes distribution for more information.

### Required artifacts

Container images:

- `registry.cloud.qdrant.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/operator`
- `registry.cloud.qdrant.io/qdrant/cluster-manager`

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud`
- `registry.cloud.qdrant.io/library/qdrant-operator-crds`
- 
### Mirroring images and charts

To mirror all necessary container images and Helm charts into your own registry, you can either use a replication feature that your registry provides, or you can manually sync the images with [Skopeo](https://github.com/containers/skopeo):

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
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/qdrant your-registry.example.com/qdrant/qdrant
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/cluster-manager your-registry.example.com/qdrant/cluster-manager
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/operator your-registry.example.com/qdrant/operator
```

To sync all helm charts:

```shell
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud your-registry.example.com/qdrant-charts/qdrant-private-cloud
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/library/qdrant-operator-crds your-registry.example.com/qdrant-charts/qdrant-operator-crds
```

During the installation or upgrade, you will need to adapt the repository information in the Helm chart values. See [Private Cloud Configuration](/documentation/private-cloud/configuration/) for details.

## Installation and Upgrades

Once you are onboarded to Qdrant Private Cloud, you will receive credentials to access the Qdrant Cloud Registry. You can use these credentials to install the Qdrant Private Cloud solution using the following commands. You can choose the Kubernetes namespace freely.

```bash
kubectl create namespace qdrant-private-cloud
kubectl create secret docker-registry qdrant-registry-creds --docker-server=registry.cloud.qdrant.io --docker-username='your-username' --docker-password='your-password' --namespace qdrant-private-cloud
helm registry login 'registry.cloud.qdrant.io' --username 'your-username' --password 'your-password'
helm upgrade --install qdrant-private-cloud-crds oci://registry.cloud.qdrant.io/library/qdrant-operator-crds --namespace qdrant-private-cloud --version 1.2.6 --wait
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 0.1.1
```

For a list of available versions consult the [Private Cloud Changelog](/documentation/private-cloud/changelog/).

Especially ensure, that the default values to reference `StorageClasses` and the corresponding `VolumeSnapshotClass` are set correctly in your environment.

## Uninstallation

To uninstall the Qdrant Private Cloud solution, you can use the following command:

```bash
helm uninstall qdrant-private-cloud --namespace qdrant-private-cloud
helm uninstall qdrant-private-cloud-crd --namespace qdrant-private-cloud
kubectl delete namespace qdrant-private-cloud
```
