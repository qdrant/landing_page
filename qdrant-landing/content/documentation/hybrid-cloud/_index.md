---
title: Hybrid Cloud
weight: 9
---

# Qdrant Hybrid Cloud

Seamlessly deploy and manage your vector database across diverse environments, ensuring performance, security, and cost efficiency for AI-driven applications.

[Qdrant Hybrid Cloud](/hybrid-cloud/) integrates Kubernetes clusters from any setting - cloud, on-premises, or edge - into a unified, enterprise-grade managed service.

You can use [Qdrant Cloud's UI](/documentation/cloud/create-cluster/) to create and manage your database clusters, while they still remain within your infrastructure. **All Qdrant databases will operate solely within your network, using your storage and compute resources. All user data will stay securely within your environment and won't be accessible by the Qdrant Cloud platform, or anyone else outside your organization.**

Qdrant Hybrid Cloud ensures data privacy, deployment flexibility, low latency, and delivers cost savings, elevating standards for vector search and AI applications.

**How it works:** Qdrant Hybrid Cloud relies on Kubernetes and works with any standard compliant Kubernetes distribution. When you onboard a Kubernetes cluster as a Hybrid Cloud Environment, you can deploy the Qdrant Kubernetes Operator and Cloud Agent into this cluster. These will manage Qdrant databases within your Kubernetes cluster and establish an outgoing connection to Qdrant Cloud to transport telemetry and receive management instructions. You can then benefit from the same cloud management features and transport telemetry that is available with any managed Qdrant Cloud cluster.

<aside role="status">Qdrant Cloud does not connect to the API of your Kubernetes cluster, cloud provider, or any other platform APIs.</aside>

**Setup instructions:** To begin using Qdrant Hybrid Cloud, [read our installation guide](/documentation/hybrid-cloud/hybrid-cloud-setup/).

## Hybrid Cloud architecture

The Hybrid Cloud onboarding will install a Kubernetes Operator and Cloud Agent into your Kubernetes cluster. 

The Cloud Agent will establish an outgoing connection to `cloud.qdrant.io` on port `443` to transport telemetry and receive management instructions. It will also interact with the Kubernetes API through a ServiceAccount to create, read, update and delete the necessary Qdrant CRs (Custom Resources) based on the configuration setup in the Qdrant Cloud Console.

The Qdrant Kubernetes Operator will manage the Qdrant databases within your Kubernetes cluster. Based on the Qdrant CRs, it will interact with the Kubernetes API through a ServiceAccount to create and manage the necessary resources to deploy and run Qdrant databases, such as Pods, Services, ConfigMaps, and Secrets.

Both component's access is limited to the Kubernetes namespace that you chose during the onboarding process.

After the initial onboarding, the lifecycle of these components will be controlled by the Qdrant Cloud platform via the built-in Helm controller.

You don't need to expose your Kubernetes Cluster to the Qdrant Cloud platform, you don't need to open any ports for incoming traffic, and you don't need to provide any Kubernetes or cloud provider credentials to the Qdrant Cloud platform.

![hybrid-cloud-architecture](/blog/hybrid-cloud/hybrid-cloud-architecture.png)
