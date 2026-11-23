---
title: Overview
short_description: "Qdrant Hybrid Cloud and Private Cloud run Qdrant clusters in your own Kubernetes infrastructure. Start here to choose between them and set one up."
description: "Overview of Qdrant Hybrid Cloud and Private Cloud: run Qdrant clusters in your own Kubernetes infrastructure, managed through Qdrant Cloud or entirely by you."
weight: 281
partition: deploy
---

# Qdrant Hybrid Cloud and Private Cloud

With Hybrid Cloud and Private Cloud, you run Qdrant clusters in your own Kubernetes infrastructure, on your own storage and compute. Your data never leaves your network.

The difference is who manages the clusters:

- With [Hybrid Cloud](/documentation/hybrid-cloud/), you manage clusters through the Qdrant Cloud Console, API, CLI, or Terraform. An agent in your Kubernetes cluster opens an outgoing connection to Qdrant Cloud to receive instructions and send telemetry.
- With [Private Cloud](/documentation/private-cloud/), you manage clusters yourself with Kubernetes resources. There is no connection to Qdrant Cloud.

## Start with Hybrid Cloud

- [Setup Hybrid Cloud](/documentation/hybrid-cloud/hybrid-cloud-setup/): install the Operator and Cloud Agent into your Kubernetes cluster.
- [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/): notes for AWS EKS, GCP GKE, Azure AKS, and Linode LKE.
- [Create a Cluster](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/): create a Qdrant cluster with Kubernetes scheduling controls and API key authentication.
- [Backup & Restore](/documentation/hybrid-cloud/backup-restore/): back up and restore clusters with CSI volume snapshots.

## Start with Private Cloud

- [Setup Private Cloud](/documentation/private-cloud/private-cloud-setup/): install the Operator into your Kubernetes cluster with Helm.
- [Managing a Cluster](/documentation/private-cloud/qdrant-cluster-management/): create, configure, scale, and upgrade clusters with Kubernetes resources.
- [Security & Exposure](/documentation/private-cloud/security-exposure/): expose clusters and secure them with network policies, API keys, and TLS.
- [Backups](/documentation/private-cloud/backups/): take one-time and scheduled snapshots, and restore them.

For a comparison with Managed Cloud, see [Choose a Deployment Model](/documentation/cloud/#choose-a-deployment-model).
