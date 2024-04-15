---
title: Managed Cloud
weight: 14
aliases:
  - /documentation/overview/qdrant-alternatives/documentation/cloud/
---

# About Qdrant Managed Cloud

Qdrant Managed Cloud is our SaaS (software-as-a-service) solution, providing managed Qdrant database clusters on the cloud. We provide you the same fast and reliable similarity search engine, but without the need to maintain your own infrastructure.

Transitioning to the Managed Cloud version of Qdrant does not change how you interact with the service. All you need is a [Qdrant Cloud account](https://qdrant.to/cloud/) and an [API key](/documentation/cloud/authentication/) for each request.

You can also attach your own infrastructure as a Hybrid Cloud Environment. For details, see our [Hybrid Cloud](/documentation/hybrid-cloud/) documentation.

## Cluster configuration

Each database cluster comes pre-configured with the following tools, features, and support services:

- Allows the creation of highly available clusters with automatic failover.
- Supports upgrades to later versions of Qdrant as they are released.
- Upgrades are zero-downtime on highly available clusters.
- Includes monitoring and logging to observe the health of each cluster.
- Horizontally and vertically scalable.
- Available natively on AWS and GCP, and Azure. 
- Available on your own infrastructure and other providers if you use the Hybrid Cloud.

## Getting started with Qdrant Managed Cloud

To use Qdrant Managed Cloud, you need at least one cluster. You can create one in the following ways:

1. [**Create a Free Tier cluster**](/documentation/cloud/quickstart-cloud/) with one node and a default configuration (1 GB RAM, 0.5 CPU and 4 GB Disk). This option is perfect for prototyping. You don't need a credit card to join.
2. [**Configure a custom cluster**](/documentation/cloud/create-cluster/) with additional nodes and resources. For this option, you need billing information.

If you're testing Qdrant, We recommend the Free Tier cluster. The capacity should be enough to serve up to 1 M vectors of 768 dimensions. To calculate your needs, refer to our documentation on [Capacity and sizing](/documentation/cloud/capacity-sizing/).

We recommend that you use the Free Tier cluster for testing purposes. The capacity should be enough to serve up to 1 M vectors of 768 dimensions. To calculate your needs, refer to our documentation on [Capacity and sizing](/documentation/cloud/capacity-sizing/). 

## Support & Troubleshooting

All Qdrant Cloud users are welcome to join our [Discord community](https://qdrant.to/discord/). Our Support Engineers are available to help you anytime.

Paid customers can also contact support directly. Links to the support portal are available in the Qdrant Cloud Console.
