---
title: Setup Private Cloud
short_description: "Install Qdrant Private Cloud into your Kubernetes cluster with Helm, using the Qdrant Operator and container registry credentials."
description: "Install Qdrant Private Cloud into any standard Kubernetes cluster with Helm, the Qdrant Operator, and credentials for the Qdrant container registry."
weight: 5
---

# Qdrant Private Cloud Setup

## Requirements

| Requirement | Details |
|---|---|
| **Kubernetes cluster** | A [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can run it in any cloud, on-premise, or edge environment, with distributions that range from AWS EKS to VMware vSphere. See [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/) for platform-specific storage classes and snapshot classes. |
| **Storage** | A Container Storage Interface (CSI) driver that provides block storage. For vertical scaling, the driver needs to support volume expansion. For backups and restores, it needs to support CSI snapshots and restores. |
| **Nodes** | The smallest Qdrant database node needs 2 GiB of RAM, 0.5 vCPU, and 8 GiB of disk. Plan more CPU for heavy ingestion. See [Capacity Planning](/documentation/capacity-planning/) for RAM, disk, CPU, and IOPS guidance. |
| **Operator components** | The Operator, cluster manager, and cluster exporter run one replica each. The chart sets no CPU or memory `resources` for them by default, so set requests and limits in your Helm values if your cluster requires them. |
| **Permissions** | `cluster-admin` access in your Kubernetes cluster, to install the Qdrant Kubernetes Operator. |
| **Registry access** | Credentials for the Qdrant container registry, which you receive when you are onboarded. By default, the Operator Helm charts and container images are served from `registry.cloud.qdrant.io`. You can [mirror them](#mirroring-images-and-charts) into your own registry instead. |
| **Tools** | [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and [helm](https://helm.sh/docs/intro/install/), configured to connect to your Kubernetes cluster. See the documentation of your Kubernetes distribution for details. |

<aside role="status">Network storage systems like NFS or object storage systems such as S3 are not supported.</aside>

Private Cloud makes no connection to Qdrant Cloud, so you do not need to open any outbound ports for it. The only traffic to Qdrant is pulling images and Helm charts from `registry.cloud.qdrant.io`, which you can avoid with a mirror. See [Mirroring images and charts](#mirroring-images-and-charts).

### Required artifacts

Container images:

- `registry.cloud.qdrant.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/operator`
- `registry.cloud.qdrant.io/qdrant/cluster-manager`
- `registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter`

Open Containers Initiative (OCI) Helm charts:

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud`
- `registry.cloud.qdrant.io/library/qdrant-kubernetes-api`

All four images are required. The cluster exporter is part of the Private Cloud chart and cannot be disabled.

The specific versions for every Private Cloud version are documented in the [Private Cloud Changelog](/documentation/private-cloud/changelog/).

## Installation

Once onboarded to Qdrant Private Cloud, you will receive credentials to access the Qdrant Cloud Registry. You can use these credentials to install the Qdrant Private Cloud solution using the following commands:

1. Create the namespace for your Private Cloud deployment. You can use any name for the namespace, but you will need to update the later steps to reflect this. E.g.

```bash
kubectl create namespace qdrant-private-cloud
```

2. Create a Kubernetes secret with your Qdrant Cloud Registry credentials, to allow your Kubernetes cluster to pull the necessary container images:

```bash
kubectl create secret docker-registry qdrant-registry-creds --docker-server=registry.cloud.qdrant.io --docker-username='your-username' --docker-password='your-password' --namespace qdrant-private-cloud
```

3. Log in to the Qdrant Cloud Registry using Helm:

```bash
helm registry login 'registry.cloud.qdrant.io' --username 'your-username' --password 'your-password'
```

4. Install the Qdrant Kubernetes Operator Custom Resource Definitions (CRDs):

```bash
helm upgrade --install qdrant-private-cloud-crds oci://registry.cloud.qdrant.io/library/qdrant-kubernetes-api --namespace qdrant-private-cloud --version v1.41.0 --wait
```

5. Install Qdrant Private Cloud:

```bash
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.13.0
```

Ensure that the `qdrant-kubernetes-api` version is compatible with the `qdrant-private-cloud` version you are installing.

For a list of available versions consult the [Private Cloud Changelog](/documentation/private-cloud/changelog/).

Current default versions are:

* qdrant-kubernetes-api v1.41.0
* qdrant-private-cloud 1.13.0

For more information also see the [Helm Install Documentation](https://helm.sh/docs/helm/helm_install/).

## Verify the Installation

After the installation, check that the components are running. Each component runs as a pod in the namespace that you chose:

```bash
kubectl get pods --namespace qdrant-private-cloud
```

Expect one pod each for the Qdrant Operator (`qdrant-operator-v2`), the cluster manager (`qdrant-cluster-manager`), and the cluster exporter (`qdrant-cluster-exporter`), all with the status `Running` and all containers ready. The names carry a generated suffix. When you create clusters, their pods appear in the namespace too.

Check that the Custom Resource Definitions exist:

```bash
kubectl get crd | grep qdrant.io
```

If a pod stays in `Pending`, `ImagePullBackOff`, or `CrashLoopBackOff`, look at its events and logs:

```bash
kubectl describe pod <pod-name> --namespace qdrant-private-cloud
kubectl logs <pod-name> --namespace qdrant-private-cloud
```

`ImagePullBackOff` usually means that the registry credentials in the `qdrant-registry-creds` secret are wrong, or that the cluster cannot reach the registry or your mirror. If you need help, [contact support](/documentation/support/).

Then create your first cluster. See [Managing a Cluster](/documentation/private-cloud/qdrant-cluster-management/).

## Configuring Private Cloud

The Qdrant Private Cloud Helm chart comes with a set of default values which are suitable for most deployments. However, you are able to customize the configuration further to fit your specific needs. See the [Private Cloud Configuration](/documentation/private-cloud/configuration/) page for all available configuration options.

Helm values configure the Operator and related components. Per-cluster database settings, including [audit logging](/documentation/private-cloud/qdrant-cluster-management/#audit-logging), authentication, and TLS, belong on the `QdrantCluster` resource. See [Managing a Cluster](/documentation/private-cloud/qdrant-cluster-management/) after the Operator is installed.

You must ensure that the default `StorageClasses` and corresponding `VolumeSnapshotClass` are set appropriately for your environment.

When creating your own `values.yaml` file, as a best practice, only include the values you are actually changing, e.g. with this `values.yaml` file:

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
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.13.0 -f values.yaml
```

## Upgrades

Each Private Cloud release pairs one version of the `qdrant-kubernetes-api` CRD chart with one version of the `qdrant-private-cloud` chart. The [Private Cloud Changelog](/documentation/private-cloud/changelog/) lists the pair. You do not need to install every release in between: go directly to the release that you want, and install its paired versions together. Do not combine a CRD chart version with a Private Cloud chart version from a different release.

Upgrading the charts does not upgrade your Qdrant databases. To upgrade those, change `spec.version` on the `QdrantCluster`, and do not skip minor versions. See [Upgrading the Qdrant version](/documentation/private-cloud/qdrant-cluster-management/#upgrading-the-qdrant-version).

To upgrade Qdrant Private Cloud to a new version, first upgrade the Qdrant Kubernetes Operator Custom Resource Definitions (CRDs):

```bash
helm upgrade --install qdrant-private-cloud-crds oci://registry.cloud.qdrant.io/library/qdrant-kubernetes-api --namespace qdrant-private-cloud --version v1.41.0 --wait
```

Then upgrade the Qdrant Private Cloud Helm chart using the same configuration values, e.g.:

```bash
helm upgrade --install qdrant-private-cloud oci://registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud --namespace qdrant-private-cloud --version 1.13.0 -f values.yaml
```

Note, that the image tag values are automatically derived from the chart's appVersions and should not be overridden in the `values.yaml`.

For more information also see the [Helm Upgrade Documentation](https://helm.sh/docs/helm/helm_upgrade/).

## Mirroring Images and Charts

By default, your cluster pulls images and Helm charts from `registry.cloud.qdrant.io`. This is the only connection that Private Cloud makes to Qdrant. Pulls happen on installation and upgrades, and whenever a node needs an image that it does not have yet, for example after you add a node, scale out, or change a version.

The Operator, cluster manager, and Qdrant database images use the pull policy `IfNotPresent`. The cluster exporter uses `Always`, so without a mirror it pulls its image every time its pod restarts or moves to another node. To run without any connection to Qdrant, mirror all required artifacts into your own registry. No other Qdrant host is needed.

To install from your mirror, use your registry host instead of `registry.cloud.qdrant.io` in the `helm` commands. To mirror all necessary container images and Helm charts into your own registry, you can either use a replication feature that your registry provides, or you can manually sync the images with [Skopeo](https://github.com/containers/skopeo):

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
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant/qdrant-cluster-exporter your-registry.example.com/qdrant/qdrant-cluster-exporter
```

To sync all helm charts:

```shell
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/qdrant-charts/qdrant-private-cloud your-registry.example.com/qdrant-charts/qdrant-private-cloud
skopeo sync --all --src docker --dest docker registry.cloud.qdrant.io/library/qdrant-kubernetes-api your-registry.example.com/library/qdrant-kubernetes-api
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

## Scope of the Operator

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
      - some-other-namespace
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
