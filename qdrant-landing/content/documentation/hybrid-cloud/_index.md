---
title: Hybrid Cloud
weight: 15
---

# Qdrant Hybrid Cloud

With Qdrant Hybrid Cloud you can bring your own cloud and manage it via Qdrant Cloud. Specifically, you can attach your own infrastructure as a private environment to our managed service. This lets you use Qdrant Cloud's UI to oversee your clusters, but they still remain within your infrastructure. **All Qdrant databases will operate solely within your network, using your storage and compute resources.**

**How it works:** When you onboard a Kubernetes cluster to a Hybrid Cloud Environment, you can deploy the Qdrant Kubernetes Operator into this cluster. This operator will manage Qdrant databases within your Kubernetes cluster. It will create an outgoing connection to the Qdrant Cloud at `cloud.qdrant.io` on port `443`. You can then benefit from the same cloud management features and transport telemetry as is available with any managed Qdrant Cloud cluster.

<aside role="status">Qdrant Cloud does not connect to the API of your Kubernetes cluster, cloud provider, or any other platform APIs.</aside>

**Accessing Hybrid Cloud:** First, you will need to sign up for Hybrid Cloud. To do so, create a [Qdrant Cloud account](https://cloud.qdrant.io/login). You should get access to the Qdrant Cloud console. To activate Hybrid Cloud, go to the **Hybrid Cloud** tab. You will need to enter your **Company** and **Billing Information**. Then, you can request access.

**Setup instructions:** To begin using Qdrant Hybrid Cloud, [read our installation guide](/documentation/hybrid-cloud/hybrid-cloud-setup).

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