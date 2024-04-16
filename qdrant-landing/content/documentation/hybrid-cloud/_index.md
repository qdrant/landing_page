---
title: Hybrid Cloud
weight: 15
---

# Qdrant Hybrid Cloud

Seamlessly deploy and manage your vector database across diverse environments, ensuring performance, security, and cost efficiency for AI-driven applications.

[Qdrant Hybrid Cloud](https://hybrid-cloud.qdrant.tech/) integrates Kubernetes clusters from any setting - cloud, on-premises, or edge - into a unified, enterprise-grade managed service.

You can use [Qdrant Cloud's UI](/documentation/cloud/create-cluster/) to create and manage your database clusters, while they still remain within your infrastructure. **All Qdrant databases will operate solely within your network, using your storage and compute resources.**

Qdrant Hybrid Cloud ensures data privacy, deployment flexibility, low latency, and delivers cost savings, elevating standards for vector search and AI applications.

**How it works:** When you onboard a Kubernetes cluster as a Hybrid Cloud Environment, you can deploy the Qdrant Kubernetes Operator and Cloud Agent into this cluster. These will manage Qdrant databases within your Kubernetes cluster and establish an outgoing connection to Qdrant Cloud at `cloud.qdrant.io` on port `443`. You can then benefit from the same cloud management features and transport telemetry as is available with any managed Qdrant Cloud cluster.

<aside role="status">Qdrant Cloud does not connect to the API of your Kubernetes cluster, cloud provider, or any other platform APIs.</aside>

**Setup instructions:** To begin using Qdrant Hybrid Cloud, [read our installation guide](/documentation/hybrid-cloud/hybrid-cloud-setup/).

## Hybrid Cloud architecture

![hybrid-cloud-architecture](/blog/hybrid-cloud/hybrid-cloud-architecture.png)

## Upcoming roadmap items

We plan to introduce the following configuration options directly in the Qdrant Cloud Console in the future. If you need any of them beforehand, please contact our Support team.

* Self-service environment deletion
* Node selectors
* Tolerations
* Affinities and anti-affinities
* Service types and annotations
* Ingresses
* Network policies
* Storage classes
* Volume snapshot classes
