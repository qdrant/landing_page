---
title: Hybrid Cloud
weight: 90
---

# Hybrid Cloud

Hybrid Cloud allows you to attach your own infrastructure as a private region to Qdrant Cloud. This way, you can use Qdrant Cloud to manage your clusters, but run them in your own infrastructure.

## How it works

You a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster at the cloud provide, in the on-premise environment or at the edge location of your choice. During the onboarding of this Kubernetes cluster as a private region, you will deploy the Qdrant Kubernetes Operator into this cluster. This operator is responsible for managing the Qdrant databases within your Kubernetes cluster. It will also create an outgoing connection to `cloud.qdrant.io` on port `443` to connect to Qdrant Cloud, enable the cloud management features and transport telemetry.

You do not need to give the Qdrant Cloud any access to the API of your Kubernetes cluster, or to any cloud provider or other platform APIs. 

The Qdrant databases are running completely isolated within your network, using your storage and compute resources.

## Signing up for Hybrid Cloud

Hybrid Cloud is currently in private beta. To sign up and join the waiting list, please [contact us](https://qdrant.tech/surveys/hybrid-saas/).

## Creating a private region

### Prerequisites

To create a private region, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. This cluster can run in any cloud or on-premise. Examples include AWS EKS, GCP GKE, Azure AKS, RedHat OpenShift or VMWare vSphere or Rancher.

For storage, the Kubernetes cluster needs a CSI driver that provides block storage. Network storage systems like NFS or object storage like S3 are not supported. For vertical scaling, the CSI driver needs to support volume expansion. For backups and restores, the driver needs to support CSI snapshots and restores.

For the installation, you will need a user with `cluster-admin` access to this cluster.

In order to connect to Qdrant Cloud, the Qdrant Cloud Agent needs to be able to create an outgoing connection to `cloud.qdrant.io` on port `443`.

By default, the Helm charts and container images are pulled from `registry.cloud.qdrant.io` for the Qdrant Cloud Agent and Operator, and from `docker.io` for the Qdrant database. It is also possible to mirror the images and charts to your own registry.

### Required artefacts

Container images

* `docker.io/qdrant/qdrant`
* `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
* `registry.cloud.qdrant.io/qdrant/qdrant-operator`
* `registry.cloud.qdrant.io/qdrant/qdrant-cloud-cluster-manager`

OCI Helm charts

* `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
* `registry.cloud.qdrant.io/qdrant-charts/qdrant-operator`

### Installation

Once private regions are activated for your account, go to "Private Regions" in the Qdrant Cloud Console and click "Create".

You can then choose a name for your private regions and the Kubernetes namespace where the Qdrant Cloud agent and operator are going to de deployed in.

If you require a proxy to connect to `cloud.qdrant.io` from your Kubernetes cluster, you can configure the necessary Proxy settings and certificates under "Show advanced configuration".

For a list of possible operator configuration options see the [Operator Configuration](#operator-configuration) section below.

Once you created your region, click on "Generate Installation Command". This will create the necessary API keys for the registry and the Qdrant Cloud API and generate the `kubectl` and `helm install` commands to install the Qdrant Cloud Agent and Operator into your cluster.
This command is only necessary for the initial installation. After that, you can update the agent and operator via the Qdrant Cloud Console.

## Creating a Qdrant Cluster

Once you have created a private region, you can create a Qdrant cluster in your private region. This works the same way as creating a cluster in a managed cloud region, except that you can choose your private region as the target region.

### Authentication of your Qdrant clusters

### Exposing Qdrant Clusters to your client applications

## Operator Configuration

The Qdrant Operator can be configured in the private region configuration. The following options are available:

```yaml
settings:
```