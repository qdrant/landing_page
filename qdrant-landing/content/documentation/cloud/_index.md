---
title: Qdrant Cloud
weight: 14
aliases:
  - /documentation/overview/qdrant-alternatives/documentation/cloud/
---

# About Qdrant Cloud

Qdrant Cloud is our SaaS (software-as-a-service) solution, providing managed 
Qdrant instances on the cloud. We provide you the same fast and reliable 
similarity search engine, but without the need to maintain your own infrastructure.

Transitioning from on-premise to the cloud version of Qdrant does not change
how you interact with the service. All you need is a [Qdrant Cloud account](https://qdrant.to/cloud/)
and an [API key](/documentation/cloud/authentication/) for each request.

Our official [client libraries](/documentation/interfaces/#client-libraries/)
can help. For example, if you use the [Python Client](https://github.com/qdrant/qdrant-client/)
you can take advantage of the built-in API key. With that client, you provide
the API key only once, when the QdrantClient instance is created.

*Available as of v1.8.2* <!-- MUST CONFIRM -->

You can also attach your own infrastructure as a private region on the Hybrid
Cloud. Once attached, you can control this cloud using the same tools and UI
that you use for other cloud providers. For details, see our 
[Hybrid Cloud](/documentation/cloud/hybrid-cloud/) documentation.

## Cluster configuration

Each instance comes pre-configured with the following tools, features, and 
support services:

- Uses the latest available version of Qdrant.
- Supports upgrades to later versions of Qdrant as they are released.
- Includes monitoring and logging to observe the health of each cluster.
- Configurable through the Qdrant Cloud Console.
- Vertically scalable.
- Available natively on AWS and GCP, and Azure. 
- Available on other providers if you use the Hybrid Cloud.

## Getting started with Qdrant Cloud

To use Qdrant Cloud, you need at least one cluster. You can create one in the
following ways:

1. [**Create a Free Tier cluster**](/documentation/cloud/quickstart-cloud/) with 
   one node and a default configuration (1 GB RAM, 0.5 CPU and 4 GB Disk). This
   option is perfect for prototyping. You don't need a credit card to join.
2. [**Configure a custom cluster**](/documentation/cloud/create-cluster/) with
   additional nodes and resources. For this option, you need billing information.

If you're testing Qdrant, We recommend the Free Tier cluster. The capacity
should be enough to serve up to 1 M vectors of 768 dimensions. To calculate
your needs, refer to our documentation on [Capacity and sizing](/documentation/cloud/capacity-sizing/).

We recommend that you use the Free Tier cluster for testing purposes. The
capacity should be enough to serve up to 1 M vectors of 768 dimensions. To
calculate your needs, refer to our documentation on [Capacity and sizing](/documentation/cloud/capacity-sizing/). 

## Support & Troubleshooting

All Qdrant Cloud users are welcome to join our [Discord community](https://qdrant.to/discord/).
Our Support Engineers are available to help you anytime.

Paid customers can also contact support through channels provided during cluster
creation and/or on-boarding.
