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

When you onboard a Kubernetes cluster as a hybrid cloud region, you can deploy
the Qdrant Kubernetes Operator into this cluster. This operator manages the
Qdrant databases within your Kubernetes cluster. The operator connects to the 
Qdrant cloud as `cloud.qdrant.io` on port `443`. You can then have the same
cloud management features and transport telemetry as is available with any 
Qdrant-managed cloud provider.

The Qdrant Cloud does not need access to the API of your Kubernetes cluster, 
or to any cloud provider, or other platform APIs. 

The Qdrant databases operate solely within your network, using your storage and
compute resources.

<!-- Do we still need this section after release? -->
## Signing up for Hybrid Cloud

The Qdrant Hybrid Cloud is currently in private beta. To sign up and join the waiting
list, [contact us](https://qdrant.tech/surveys/hybrid-saas/).

## Creating a Hybrid Cloud region

The following sections specify prerequisites and required artifacts. You can then
set up a Qdrant cluster in your private region.

### Prerequisites

To create a hybrid cloud region, you need a [standard compliant](https://www.cncf.io/training/certification/software-conformance/)
Kubernetes cluster. You can run this cluster can run in any SaaS or local environment,
with tools that range from AWS EKS to VMWare vSphere.

For storage, you need to set up the Kubernetes cluster with a Container Storage
Interface (CSI) driver that provides block storage. For vertical scaling, the
CSI driver needs to support volume expansion. For backups and restores, the
driver needs to support CSI snapshots and restores.

<aside role="status">Network storage systems like NFS or object storage systems 
such as S3 are not supported.</aside>

For access, you also need a `cluster-admin` user. <!-- does a root user work? 
what about a user with cluster-admin privileges? -->

For networks, your cluster needs to connect to the Qdrant Cloud. In other words,
the Qdrant Cloud Agent creates an outgoing connection to `cloud.qdrant.io` on
port `443`.

By default, the Qdrant Cloud Agent and Operator pulls Helm charts and container
images from `registry.cloud.qdrant.io`. The Qdrant database pulls from `docker.io`.
You can also mirror the images and charts to your own registry.

### Required artifacts

To set up your cloud, you need the following artifacts:

Container images

- `docker.io/qdrant/qdrant`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant/qdrant-operator`
- `registry.cloud.qdrant.io/qdrant/qdrant-cloud-cluster-manager`

Open Containers Initiative (OCI) Helm charts

- `registry.cloud.qdrant.io/qdrant-charts/qdrant-cloud-agent`
- `registry.cloud.qdrant.io/qdrant-charts/qdrant-operator`

## Installation

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
  <https://registry.cloud.qdrant.io/qdrant/>.
- Helm chart repository URL for the Qdrant Operator and Agent. The default is
  <oci://registry.cloud.qdrant.io/qdrant-charts>.
- CA certificate

Once complete, select Create. If successful, you'll briefly see the following
message: 

> Successfully created the Hybrid Cloud Region

<!-- Question: does Actions > Edit allow uses to edit anything but the name? -->

### Hybrid Cloud regions

Once you create a Hybrid Cloud Region, you can review what you just configured.
In the UI, you can also review the:

- Hybrid Cloud ID: For use in Kubernetes commands
- Operator Pod State: Typically `Unknown` or `Ready` 
- Agent Pod State: Typically `Unknown` or `Ready`

Until you run the Hybrid Cloud installation commands shown in this page, the
state of the Operator and Agent Pods are typically unknown.

### Generate Installation Command

After reviewing your configuration, select **Generate Installation Command**.
This includes several commands which:

- Creates a Kubernetes namespace
- Adds credentials to the Docker registry, labeled `qdrant-registry-creds`
- Sets up a secret key based on an API key, labeled `access-key`. 
- Signs into the Helm registry at `registry.cloud.qdrant.io`.
- Installs a Helm chart from the OCI registry.

These commands create the necessary API keys for the registry and the Qdrant
Cloud API. It also generates the `kubectl` and `helm install` commands to install
the Qdrant Cloud Agent and Operator into your cluster.

You need this command only for the initial installation. After that, you can
update the agent and operator using the Qdrant Cloud Console.

Requirements:

- Your docker server needs access to registry.cloud.qdrant.io
- 

## Creating a Qdrant cluster

Once you have created a hybrid cloud region, you can create a Qdrant cluster in
that region. Use the same process to [Create a cluster](/documentation/cloud/create-cluster/). 
Make sure to select your hybrid cloud as the target region.

### Authentication at your Qdrant clusters

### Exposing Qdrant clusters to your client applications

## Operator configuration

You should configure the Qdrant Operator with the configuration for the hybrid
cloud. Use the following options, in YAML format:

```yaml
settings:
```
