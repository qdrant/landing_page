---
title: Qdrant Cloud
weight: 20
aliases:
  - /documentation/overview/qdrant-alternatives/documentation/cloud/
---

# About Qdrant Cloud

Qdrant Cloud is our SaaS (software-as-a-service) solution, providing managed Qdrant instances on the cloud.
We provide you with the same fast and reliable similarity search engine, but without the need to maintain your own infrastructure.

Transitioning from on-premise to the cloud version of Qdrant does not require changing anything in the way you interact with the service. All you have to do is [create a Qdrant Cloud account](https://qdrant.to/cloud) and [provide a new API key]({{< ref "/documentation/cloud/authentication" >}}) to each request.

The transition is even easier if you use the official client libraries. For example, the [Python Client](https://github.com/qdrant/qdrant-client) has the support of the API key already built-in, so you only need to provide it once, when the QdrantClient instance is created.

*Available as of v1.8.2*

You can also attach your own infrastructure as a private region on the Qdrant
Cloud. Once attached, you can control this cloud using the same tools and UI
that you use for other cloud providers. For details, see our 
[Hybrid Cloud](/documentation/cloud/hybrid-cloud/) documentation.

### Cluster configuration

Each instance comes pre-configured with the following tools, features and support services:

- Automatically created with the latest available version of Qdrant.
- Upgradeable to later versions of Qdrant as they are released.
- Equipped with monitoring and logging to observe the health of each cluster. 
- Accessible through the Qdrant Cloud Console.
- Vertically scalable.
- Offered on AWS and GCP, with Azure currently in development. 

### Getting started with Qdrant Cloud

To use Qdrant Cloud, you will need to create at least one cluster. There are two ways to start:
1. [**Create a Free Tier cluster**]({{< ref "/documentation/cloud/quickstart-cloud" >}}) with 1 node and a default configuration (1GB RAM, 0.5 CPU and 4GB Disk). This option is perfect for prototyping and you don't need a credit card to join.
2. [**Configure a custom cluster**]({{< ref "/documentation/cloud/create-cluster" >}}) with additional nodes and more resources. For this option, you will have to provide billing information.

We recommend that you use the Free Tier cluster for testing purposes. The capacity should be enough to serve up to 1M vectors of 768dim. To calculate your needs, refer to [capacity planning]({{< ref "/documentation/cloud/capacity-sizing" >}}). 

### Support & Troubleshooting

All Qdrant Cloud users are welcome to join our [Discord community](https://qdrant.to/discord). Our Support Engineers are available to help you anytime.

Additionally, paid customers can also contact support via channels provided during cluster creation and/or on-boarding.
