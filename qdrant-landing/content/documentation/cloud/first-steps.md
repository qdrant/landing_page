---
title: First Steps
weight: 1
---

# Qdrant Managed Cloud - First Steps

Welcome to Qdrant Managed Cloud. This document contains all the necessary information to get started.

## Prerequisites

In order to use Qdrant Managed Cloud, you need a Qdrant Cloud account. See [Qdrant Cloud Setup](/documentation/cloud/qdrant-cloud-setup/) for all the details on how to set one up and invite different users to it.

You also need to provide [payment details](/documentation/cloud/pricing-payments/). If you have a custom
payment agreement, please reach out to our support once you created an account so that we can correctly set this up for you.

If you subscribed to a Premium Plan, you can set up single-sign-on (SSO) for your organization, please contact our support team at https://support.qdrant.io/ for
instructions.

## Qdrant cluster sizing

You can refer to our [Capacity Planning document](/documentation/guides/capacity-planning/) and the [pricing
calculator](https://cloud.qdrant.io/calculator) to determine how much CPU, memory and disk space is necessary for your workload.

## Creating and managing Qdrant clusters

Once your account is set up, you can create Qdrant Clusters. See
[Create a Cluster](/documentation/cloud/create-cluster/) for details.

Please note that in Hybrid Cloud Qdrant database clusters are not exposed outside of your Kubernetes cluster by default.
Read more about [Authentication](/documentation/cloud/authentication/) for details on connecting
to your database cluster.

## Considerations for production ready Qdrant clusters

For a production ready Qdrant database cluster, you should consider creating a
multi-node cluster with at least 3 nodes and replication switched on.
See [Distributed Deployment](/documentation/guides/distributed_deployment/).
To save cost, you can have a look at [Quantizations](/documentation/guides/quantization/) or [offloading vectors to disk](/documentation/concepts/storage/#configuring-memmap-storage).

## Support

Our Support team is always available to assist you. A link to our support portal is available in the Qdrant Cloud UI, or you can go to https://support.qdrant.io/ directly. You
can find all the details of your support SLA at https://qdrant.to/sla.