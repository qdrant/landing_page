---
title: Hybrid Cloud
weight: 90
---

# Hybrid Cloud

*Available as of v1.8.2*

The Qdrant Hybrid Cloud allows you to attach your own infrastructure as a private
region of the Qdrant Cloud. You can use Qdrant Cloud to manage your clusters, and
run them in your own infrastructure.

## How it works

You have set up a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster. You can set up that cluster at the
cloud provider, in the on-premise environment, or at the edge location of your
choice.

When you onboard a Kubernetes cluster as a private region, you can deploy the
Qdrant Kubernetes Operator into this cluster. This operator manages the Qdrant
databases within your Kubernetes cluster. The operator connects to the Qdrant
cloud as `cloud.qdrant.io` on port `443`. You can then have the same cloud
management features and transport telemetry as is available with any Qdrant-
managed cloud provider.

The Qdrant Cloud does not need access to the API of your Kubernetes cluster, 
or to any cloud provider, or other platform APIs. 

The Qdrant databases operate completely isolated within your network, using
your storage and compute resources.

<!-- Do we still need this section after release? ## Signing up for Hybrid Cloud

Hybrid Cloud is currently in private beta. To sign up and join the waiting list, please [contact us](https://qdrant.tech/surveys/hybrid-saas/).
-->
## Creating a private region

The following sections specify prerequisites and required artifacts. You can then
set up a Qdrant cluster in your private region.

### Prerequisites

To create a private region, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes cluster.
You can run this cluster can run in any SaaS or local environment, from AWS EKS
to VMWare vSphere.

For storage, you need to set up the Kubernetes cluster with a Containter Storage
Interface (CSI) driver that provides block storage. For vertical scaling, the
CSI driver needs to support volume expansion. For backups and restores, the
driver needs to support CSI snapshots and restores.

<aside role="status">Network storage systems like NFS or object storage systems like S3 are not supported.</aside>

For access, you also need a `cluster-admin` user. <!-- does a root user work? what about a user with cluster-admin privileges? -->

For networks, your cluster needs to connect to the Qdrant Cloud. In other words,
the Qdrant Cloud Agent creates an outgoing connection to `cloud.qdrant.io` on
port `443`.

By default, the Qdrant Cloud Agent and Operator pulls Helm charts and container images from `registry.cloud.qdrant.io`. The Qdrant database pulls from `docker.io`. Alternatively, you can also mirror the images and charts to your own registry.

### Required artifacts

To set up your cloud, you need the following:

Container images

* `docker.io/qdrant/qdrant`
* `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
* `registry.cloud.qdrant.io/qdrant/qdrant-operator`
* `registry.cloud.qdrant.io/qdrant/qdrant-cloud-cluster-manager`

OCI Helm charts

* `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
* `registry.cloud.qdrant.io/qdrant-charts/qdrant-operator`

### Installation

To set up your Hybrid Cloud, open the Qdrant Cloud Console at
[cloud.qdrant.io](https://cloud.qdrant.io). On the dashboard, select
**Hybrid Cloud Regions**, and then select **Create**.

You can then enter:

- Name: The Kubernetes namespace for the operator and agent. Once you select a
  name, you can't change it.
- Agent version: The version of the Qdrant cloud agent.
- Operator version: Version of the Kubernetes operator.

You can then enter the YAML configuration for your Kubernetes operator. Qdrant
supports a specific list of configuration options, as described in the
[Operator Configuration](#operator-configuration) section.

If you have special requirements for any of the following, activate the
**Show advanced configuration** option:

- Proxy server
- Container registry URL for Qdrant Operator and Agent images. The default is
  https://registry.cloud.qdrant.io/qdrant.
- Helm chart repository URL for the Qdrant Operator and Agent. The default is
  `oci://registry.cloud.qdrant.io/qdrant-charts`. 
- CA certificate

Once complete, select Create. If successful, you'll briefly see the following
message: 

```
Successfully created the Hybrid Cloud Region
```

<!-- Question: does Actions > Edit allow uses to edit anything but the name? -->

### Hybrid Cloud Regions

Once you create a Hybrid Cloud Region, you can review what you just configured.
You can also review the:

- Hybrid Cloud ID, which you can use in Kubernetes commands
- Operator Pod State, 


Once you created your region, click on "Generate Installation Command". This will create the necessary API keys for the registry and the Qdrant Cloud API and generate the `kubectl` and `helm install` commands to install the Qdrant Cloud Agent and Operator into your cluster.
This command is only necessary for the initial installation. After that, you can update the agent and operator via the Qdrant Cloud Console.

## Creating a Qdrant Cluster

Once you have created a private region, you can create a Qdrant cluster in your private region. This works the same way as creating a cluster in a managed cloud region, except that you can choose your private region as the target region.

### Authentication at your Qdrant clusters

### Exposing Qdrant Clusters to your client applications

## Operator Configuration

The Qdrant Operator can be configured in the private region configuration. The following options are available:

```yaml
settings:
```
