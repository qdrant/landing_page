---
title: Hybrid Cloud
short_description: "Run Qdrant in your own Kubernetes cluster while managing it through Qdrant Cloud, keeping all data inside your network."
description: "Deploy Qdrant Hybrid Cloud into your own Kubernetes cluster on any cloud, on-prem, or edge environment while managing it through Qdrant Cloud."
weight: 225
partition: deploy
---

# Qdrant Hybrid Cloud

Seamlessly deploy and manage your vector search across diverse environments, ensuring performance, security, and cost efficiency for AI-driven applications.

[Qdrant Hybrid Cloud](/hybrid-cloud/) integrates Kubernetes clusters from any setting - cloud, on-premises, or edge - into a unified, enterprise-grade managed service.

You can use [Qdrant Cloud's UI](/documentation/cloud/create-cluster/) to create and manage your database clusters, while they still remain within your infrastructure. **All Qdrant databases will operate solely within your network, using your storage and compute resources. All user data will stay securely within your environment and won't be accessible by the Qdrant Cloud platform, or anyone else outside your organization.**

Qdrant Hybrid Cloud ensures data privacy, deployment flexibility, low latency, and delivers cost savings, elevating standards for vector search and AI applications.

**How it works:** Qdrant Hybrid Cloud relies on Kubernetes and works with any standard compliant Kubernetes distribution. When you onboard a Kubernetes cluster as a Hybrid Cloud Environment, you can deploy the Qdrant Kubernetes Operator and Cloud Agent into this cluster. These will manage Qdrant databases within your Kubernetes cluster and establish an outgoing connection to Qdrant Cloud to transport telemetry and receive management instructions. You can then benefit from the same cloud management features and transport telemetry that is available with any managed Qdrant Cloud cluster.

<aside role="status">Qdrant Cloud does not connect to the API of your Kubernetes cluster, cloud provider, or any other platform APIs.</aside>

**Setup instructions:** To begin using Qdrant Hybrid Cloud, [read our installation guide](/documentation/hybrid-cloud/hybrid-cloud-setup/).

## At a Glance

| Question | Answer |
|---|---|
| Where do the databases run? | In your Kubernetes cluster, on your own storage and compute. |
| Who creates and manages clusters? | You, in the Qdrant Cloud Console. The Operator in your cluster carries out the changes. |
| What can Qdrant Cloud access? | Telemetry, metrics, and status information only. It does not connect to the API of your Kubernetes cluster, your cloud provider, or any other platform, and it cannot read your data. |
| What network access does it need? | Outbound connections on port 443 to `grpc.cloud.qdrant.io` and `api.cloud.qdrant.io`. No inbound ports, no exposure of your Kubernetes cluster, and no Kubernetes or cloud provider credentials. See [Network Requirements](#network-requirements). |
| What does it need from Kubernetes? | A standard compliant cluster, CSI block storage (with volume expansion for vertical scaling and snapshots for backups), x86_64 or ARM64 nodes, and `cluster-admin` access for the installation. See [Setup](/documentation/hybrid-cloud/hybrid-cloud-setup/#prerequisites). |
| How are the components updated? | After onboarding, Qdrant Cloud controls their lifecycle through the built-in Helm controller. |
| How do I get access? | Hybrid Cloud is part of the Enterprise plan. [Contact us](/contact-us/). |

## Hybrid Cloud Architecture

The Hybrid Cloud onboarding will install a Kubernetes Operator, a Cloud Agent and a Prometheus Agent into your Kubernetes cluster.

The Cloud Agent establishes an outgoing connection to the Qdrant Cloud control plane to receive management instructions. Telemetry is sent over HTTPS: the Prometheus Agent writes metrics, and the Kubernetes event exporter posts events. See [Network Requirements](#network-requirements) for the hosts. The Cloud Agent also interacts with the Kubernetes API through a ServiceAccount to create, read, update and delete the necessary Qdrant CRs (Custom Resources) based on the configuration setup in the Qdrant Cloud Console.

The Qdrant Kubernetes Operator will manage the Qdrant databases within your Kubernetes cluster. Based on the Qdrant CRs, it will interact with the Kubernetes API through a ServiceAccount to create and manage the necessary resources to deploy and run Qdrant databases, such as Pods, Services, ConfigMaps, and Secrets.

The Prometheus Agent will collect metrics from the Qdrant databases and the Qdrant control plane components and also forward them to the Qdrant Cloud platform for monitoring and alerting purposes

All component's access is limited to the Kubernetes namespace that you chose during the onboarding process.

The Cloud Agent and the Prometheus Agent only send telemetry data, metrics and status information to the Qdrant Cloud platform. They do not send any user data or sensitive information. The data includes:

* The health status and resource usage (CPU, memory, disk and network) of the Qdrant databases and Qdrant control plane components.
* Metrics exposed by the Qdrant databases and Qdrant control plane components.
* Metrics about the configuration of the Kubernetes cluster, such as the number and capacity of nodes, available StorageClasses and VolumeSnapshotClasses, and the Kubernetes distribution and version.
* Information about the Qdrant databases, such as the number, name and configuration of collections, the number of vectors, the number of queries, and the number of indexing operations.
* Telemetry and notification data from the Qdrant databases.
* Kubernetes operations and scheduling events reported for the Qdrant databases and Qdrant control plane components.

After the initial onboarding, the lifecycle of these components will be controlled by the Qdrant Cloud platform via the built-in Helm controller.

You don't need to expose your Kubernetes Cluster to the Qdrant Cloud platform, you don't need to open any ports for incoming traffic, and you don't need to provide any Kubernetes or cloud provider credentials to the Qdrant Cloud platform.

![hybrid-cloud-architecture](/blog/hybrid-cloud/hybrid-cloud-architecture.png)

## Network Requirements

Hybrid Cloud only needs outbound connections on port `443`. Allow these hosts in your firewall or proxy:

| Host | Used by | Purpose |
|---|---|---|
| `grpc.cloud.qdrant.io` | The Cloud Agent | The control plane. The Agent receives management instructions here. It is the only host the Agent process connects to |
| `api.cloud.qdrant.io` | The Prometheus Agent and the Kubernetes event exporter | Telemetry. Metrics and Kubernetes events are posted here |
| `registry.cloud.qdrant.io` | The kubelet and the Helm source controller | The default registry for container images and Helm charts. You can point the environment at your own registry mirror instead. See [Mirroring images and charts](/documentation/hybrid-cloud/hybrid-cloud-setup/#mirroring-images-and-charts) |

The Cloud Console at `cloud.qdrant.io` is only for people using a browser. Your Kubernetes cluster does not need to reach it.

## Getting Access to Hybrid Cloud

Qdrant Hybrid Cloud is available as part of our Enterprise plan. To get access to Qdrant Hybrid Cloud, please [contact us](/contact-us/).
