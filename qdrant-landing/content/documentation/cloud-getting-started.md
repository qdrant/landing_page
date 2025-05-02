---
title: Getting Started
weight: 12
partition: cloud
aliases:
  - /documentation/cloud/getting-started/
---

# Getting Started with Qdrant Managed Cloud

Welcome to Qdrant Managed Cloud! This document contains all the information you need to get started.

## Prerequisites

Before creating a cluster, make sure you have a Qdrant Cloud account. Detailed instructions for signing up can be found in the [Qdrant Cloud Setup](/documentation/cloud/qdrant-cloud-setup/) guide. You also need to provide [payment details](/documentation/cloud/pricing-payments/). If you have a custom payment agreement, first create your account, then [contact our Support Team](https://support.qdrant.io/) to finalize the setup.

Premium Plan subscribers can enable single sign-on (SSO) for their organizations. To activate SSO, please reach out to the Support Team at [https://support.qdrant.io/](https://support.qdrant.io/) for guidance.

## Cluster Sizing

Before deploying any cluster, consider the resources needed for your specific workload. Our [Capacity Planning guide](/documentation/guides/capacity-planning/) describes how to assess the required CPU, memory, and storage. Additionally, the [Pricing Calculator](https://cloud.qdrant.io/calculator) helps you estimate associated costs based on your projected usage.

## Creating and Managing Clusters

After setting up your account, you can create a Qdrant Cluster by following the steps in [Create a Cluster](/documentation/cloud/create-cluster/).

## Preparing for Production

For a production-ready environment, consider deploying a multi-node Qdrant cluster (at least three nodes) with replication enabled. Instructions for configuring distributed clusters are available in the [Distributed Deployment](/documentation/guides/distributed_deployment/) guide.

If you are looking to optimize costs, you can reduce memory usage through [Quantization](/documentation/guides/quantization/) or by [offloading vectors to disk](/documentation/concepts/storage/#configuring-memmap-storage).
