---
title: Setup Private Cloud
weight: 1
---

# Qdrant Private Cloud Setup

## Requirements

- **Kubernetes cluster:** To install Qdrant Private Cloud, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can run this cluster in any cloud, on-premise or edge environment, with distributions that range from AWS EKS to VMWare vSphere. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for more information.
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
- `registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter`

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud`
- `registry.cloud.qdrant.io/library/qdrant-kubernetes-api`

- The specific versions for every private cloud version are documented in the [Private Cloud Changelog](/documentation/private-cloud/changelog/).

## Installation

Once you are onboarded to Qdrant Private Cloud, you will receive credentials to access the Qdrant Cloud Registry. You can use these credentials to install the Qdrant Private Cloud solution using the following commands. You can choose the Kubernetes namespace freely.

1. Create the namespace for Private Cloud, e.g.

```bash
kubectl create namespace qdrant-private-cloud
```

2. Create a Kubernetes secret with your Qdrant Cloud Registry credentials, to allow your Kubernetes cluster to pull the necessary container images:
```
kubectl create secret docker-registry qdrant-registry-creds --docker-server=registry.cloud.qdrant.io --docker-username='your-username' --docker-password='your-password' --namespace qdrant-private-cloud
```

3. Log in to the Qdrant Cloud Registry using Helm:

```bash
helm registry login 'registry.cloud.qdrant.io' --username 'your-username' --password 'your-password'
```

4. Install then Qdrant Kubernetes Operator Custom Resource Definitions (CRDs):

```bash
helm upgrade --install qdrant-private-cloud-crds oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-kubernetes-api --namespace qdrant-private-cloud --version v1.17.2 --wait
```

5. Install the Qdrant Private Cloud:

```bash
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.8.0
```

Ensure that the version of `qdrant-kubernetes-api` is compatible with the version of `qdrant-private-cloud` you are installing.

For a list of available versions consult the [Private Cloud Changelog](/documentation/private-cloud/changelog/).

Current default versions are:

* qdrant-kubernetes-api v1.17.2
* qdrant-private-cloud 1.8.0

For more information also see the [Helm Install Documentation](https://helm.sh/docs/helm/helm_install/).

## Configuring Private Cloud

The Qdrant Private Cloud Helm chart comes with a set of default values that are suitable for most deployments. However, you can customize the configuration to fit your specific needs. See the [Private Cloud Configuration](/documentation/private-cloud/configuration/) page for all available configuration options.

You must ensure that the default `StorageClasses` and corresponding `VolumeSnapshotClass` are set appropriately for your environment.

When creating your own `values.yaml` file, as a best practice, only override the values you want to change, e.g. with this `values.yaml` file:

```yaml
operator:
  settings:
    features:
      clusterManagement:
        storageClass:
          database: your-storage-class-name
          snapshot: your-storage-class-name
      backupManagement:
        snapshots:
          volumeSnapshotClass: your-volume-snapshot-class-name
```

You can configure Qdrant Private Cloud like this:

```bash
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.8.0 -f values.yaml
```

## Upgrades

To upgrade Qdrant Private Cloud to a new version, first upgrade the Qdrant Kubernetes Operator Custom Resource Definitions (CRDs):

```bash
helm upgrade --install qdrant-private-cloud-crds oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-kubernetes-api --namespace qdrant-private-cloud --version v1.17.2 --wait
```

Then upgrade the Qdrant Private Cloud Helm chart using the same configuration values, e.g.:

```bash
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.8.0 -f values.yaml
```

Note, that the image tag values are automatically derived from the chart's appVersions and should not be overridden in the `values.yaml`.

For more information also see the [Helm Upgrade Documentation](https://helm.sh/docs/helm/upgrade/).

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
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-kubernetes-api your-registry.example.com/qdrant-charts/qdrant-kubernetes-api
```

During the installation or upgrade, you will need to adapt the image repository and imagePullSecret information in the Helm chart values, e.g.:

```yaml
operator:
  image:
    repository: your-registry.example.com/qdrant/operator
  imagePullSecrets:
    - name: your-registry-creds
  settings:
    features:
      clusterManagement:
        qdrant:
          image:
            repository: your-registry.example.com/qdrant/qdrant
            pullSecretName: your-registry-creds
            
qdrant-cluster-manager:
  image:
    repository: your-registry.example.com/qdrant/cluster-manager
  imagePullSecrets:
    - name: your-registry-creds
      
qdrant-cluster-exporter:
  image:
    repository: your-registry.example.com/qdrant/qdrant-cluster-exporter
  imagePullSecrets:
    - name: your-registry-creds
```

See [Private Cloud Configuration](/documentation/private-cloud/configuration/) for details.

### Scope of the operator

By default, the Qdrant Operator will only manage Qdrant clusters in the same Kubernetes namespace, where it is already deployed. The RoleBindings are also limited to this specific namespace. This default is chosen to limit the operator to the least amount of permissions necessary within a Kubernetes cluster. 

If you want to manage Qdrant clusters in multiple namespaces with the same operator, you can either configure a list of namespaces that the operator should watch:

```yaml
operator:
  watch:
    # If true, watches only the namespace where the Qdrant operator is deployed, otherwise watches the namespaces in watch.namespaces
    onlyReleaseNamespace: false
    # an empty list watches all namespaces.
    namespaces:
      - qdrant-private-cloud
      - some-other-namespase
  limitRBAC: true
```

Or you can configure the operator to watch all namespaces:

```yaml 
operator:
  watch:
    # If true, watches only the namespace where the Qdrant operator is deployed, otherwise watches the namespaces in watch.namespaces
    onlyReleaseNamespace: false
    # an empty list watches all namespaces.
    namespaces: []
  limitRBAC: false
```

## Uninstallation

To uninstall the Qdrant Private Cloud solution, you can use the following command:

```bash
helm uninstall qdrant-private-cloud --namespace qdrant-private-cloud
helm uninstall qdrant-private-cloud-crds --namespace qdrant-private-cloud
kubectl delete namespace qdrant-private-cloud
```

Note that uninstalling the `qdrant-private-cloud-crds` Helm chart will remove all Custom Resource Definitions (CRDs) will also remove all Qdrant clusters that were managed by the operator.
