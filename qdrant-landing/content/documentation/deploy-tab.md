---
title: Deploy Qdrant
short_description: "Deploy Qdrant your way — managed in Qdrant Cloud, Hybrid Cloud, Private Cloud, or self-hosted with Docker or Kubernetes."
description: "Choose how to deploy Qdrant: Managed Cloud, Hybrid Cloud, Private Cloud, or self-hosted via Docker, Kubernetes, or bare-metal installation."
slug: deploy-intro
breadcrumb: false
aliases:
  - /documentation/deploy-intro
  - /documentation/cloud-intro
content:
  - partial: documentation/banners/banner-b
    title: Deploy Qdrant
    description: Deploy Qdrant
    image:
      src: /img/dev-portal-cloud/dev-portal-cloud-hero.png
      alt: Qdrant cloud dashboard
    startedButton:
      text: Get Started
      url: https://qdrant.to/cloud
  - partial: documentation/sections/cards-section
    title: Operations
    description: Install, configure, optimize, and monitor your Qdrant deployment across any environment.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      icon:
        src: /icons/outline/server-rack-blue.svg
        alt: Installation
      title: Installation
      description: Deploy Qdrant on any infrastructure. Get requirements, configuration options, and GPU setup guides.
      link:
        url: /documentation/installation/
        text: Read More
    - id: 2
      icon:
        src: /icons/outline/switches-blue.svg
        alt: Configuration
      title: Configuration
      description: Tune storage, network, performance, and runtime settings for your Qdrant instance.
      link:
        url: /documentation/ops-configuration/configuration/
        text: Read More
    - id: 3
      icon:
        src: /icons/outline/chart-bar-blue.svg
        alt: Monitoring
      title: Monitoring & Telemetry
      description: Monitor cluster health, collect metrics with Prometheus and Grafana, and configure telemetry.
      link:
        url: /documentation/ops-monitoring/monitoring/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Cloud
    description: Deploy and manage high-performance vector search clusters across cloud environments. Easily scale with fully managed cloud solutions, integrate seamlessly across hybrid setups, or maintain complete control with private cloud deployments in Kubernetes.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-cloud/managed-cloud.png
        alt: Managed Cloud
      title: Managed Cloud
      description: Qdrant Managed Cloud is our SaaS solution, providing managed Qdrant database clusters on the cloud.
      link:
        url: /documentation/cloud/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-cloud/hybrid-cloud.png
        alt: Hybrid Cloud
      title: Hybrid Cloud
      description: Deploy and manage your vector database across diverse environments, ensuring performance, security, and cost efficiency.
      link:
        url: /documentation/hybrid-cloud/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-cloud/private-cloud.png
        alt: Private Cloud
      title: Private Cloud
      description: Qdrant Private Cloud allows you to manage Qdrant database clusters in any Kubernetes cluster on any infrastructure.
      link:
        url: /documentation/private-cloud/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Support
    description: Get help from the Qdrant community or contact our support team.
    cardsPartial: documentation/cards/docs-cards
    cardsPerRow: 2
    cards:
    - id: 1
      icon:
        src: /icons/outline/discord-purple.svg
        alt: Discord icon
      title: Community Support
      description: Join 6,000+ active members to learn, collaborate, and participate in Qdrant’s latest activities.
      link:
        text: Join our Discord
        url: https://qdrant.to/discord
    - id: 2
      icon:
        src: /icons/outline/support-blue.svg
        alt: Support icon
      title: Qdrant Cloud Support
      description: Paying customers have access to our Support team. Links to the support portal are available in the Qdrant Cloud Console.
      link:
        text: Join Qdrant
        url: https://qdrant.to/cloud
partition: deploy
hideInSidebar: true
build:
  render: always
---
# Deploy Qdrant

## Self-Hosted

- [Installation](/documentation/installation/index.md) — Install Qdrant via Docker, Kubernetes, or binary on Linux, macOS, or Windows.
- [Distributed Deployment](/documentation/distributed_deployment/index.md) — Multi-node clusters with horizontal sharding and replication for scale and fault tolerance.
- [Capacity Planning](/documentation/capacity-planning/index.md) — Estimate RAM and disk requirements for vectors, payloads, indexes, and replication factors.
- [Snapshots](/documentation/snapshots/index.md) — Back up and restore collections for disaster recovery and cross-cluster replication.
- [Production Checklist](/documentation/production-checklist/index.md) — Pre-launch review of sharding, replication, quantization, load balancing, and observability.
- [Upgrades](/documentation/upgrades/index.md) — Upgrade Qdrant clusters across Cloud, Kubernetes, and Docker with zero-downtime planning.

## Managed Cloud

- [Managed Cloud](/documentation/cloud/index.md) — Run Qdrant as a managed service on AWS, GCP, or Azure with automatic scaling, backups, and zero-downtime upgrades.
- [Create a Cluster](/documentation/cloud/create-cluster/index.md) — Launch a free or standard cluster on your preferred cloud provider.
- [Authentication](/documentation/cloud/authentication/index.md) — Create Database API keys with granular access control and expiration settings.
- [Cluster Access](/documentation/cloud/cluster-access/index.md) — Connect via REST, gRPC, or the Cluster UI with load-balanced endpoints and IP allowlists.
- [Configure Clusters](/documentation/cloud/configure-cluster/index.md) — Tune collection defaults, strict mode, replication factor, and optimizer settings.
- [Scale Clusters](/documentation/cloud/cluster-scaling/index.md) — Scale vertically or horizontally with automatic shard rebalancing.
- [Monitor Clusters](/documentation/cloud/cluster-monitoring/index.md) — Monitor cluster health with built-in metrics, logs, and email alerts.
- [Backup Clusters](/documentation/cloud/backups/index.md) — Schedule snapshots and restore clusters for disaster recovery.
- [Update Clusters](/documentation/cloud/cluster-upgrades/index.md) — Zero-downtime rolling upgrades on multi-node clusters.
- [Cloud Inference](/documentation/cloud/inference/index.md) — Generate embeddings inside Qdrant Cloud or proxy to OpenAI, Cohere, and Jina.

## Hybrid Cloud

- [Hybrid Cloud](/documentation/hybrid-cloud/index.md) — Deploy Qdrant in your own Kubernetes cluster while managing it through Qdrant Cloud.
- [Setup Hybrid Cloud](/documentation/hybrid-cloud/hybrid-cloud-setup/index.md) — Install and connect the Qdrant Kubernetes Operator to Qdrant Cloud.
- [Create a Cluster](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/index.md) — Create a Qdrant cluster in your Hybrid Cloud environment.
- [Configure, Scale & Upgrade](/documentation/hybrid-cloud/configure-scale-upgrade/index.md) — Tune, resize, and upgrade Hybrid Cloud clusters.
- [Networking, Logging & Monitoring](/documentation/hybrid-cloud/networking-logging-monitoring/index.md) — Configure networking, ingress, and observability for Hybrid Cloud.
- [Operator Configuration](/documentation/hybrid-cloud/operator-configuration/index.md) — Advanced configuration of the Qdrant Kubernetes Operator.
- [Deployment Platforms](/documentation/hybrid-cloud/platform-deployment-options/index.md) — Platform-specific deployment guides for AWS, GCP, Azure, and on-prem Kubernetes.

## Private Cloud

- [Private Cloud](/documentation/private-cloud/index.md) — Fully air-gapped Qdrant deployment in your own Kubernetes cluster with no Qdrant Cloud connectivity.
- [Setup Private Cloud](/documentation/private-cloud/private-cloud-setup/index.md) — Install and configure Qdrant Private Cloud in a Kubernetes cluster.
- [Cluster Management](/documentation/private-cloud/qdrant-cluster-management/index.md) — Create, manage, and operate clusters in Private Cloud.
- [Configuration](/documentation/private-cloud/configuration/index.md) — Advanced configuration options for Private Cloud deployments.
- [Backups](/documentation/private-cloud/backups/index.md) — Configure backup and restore for Private Cloud clusters.
- [Logging & Monitoring](/documentation/private-cloud/logging-monitoring/index.md) — Set up observability for Private Cloud environments.
- [API Reference](/documentation/private-cloud/api-reference/index.md) — Private Cloud management API reference.

## Operations

- [Configuration](/documentation/ops-configuration/index.md) — Customize Qdrant via config files and environment variables; runtime administration; GPU-accelerated indexing.
- [Monitoring & Telemetry](/documentation/ops-monitoring/index.md) — Monitor Qdrant with Prometheus and Grafana via built-in OpenMetrics endpoints.
- [Optimization](/documentation/ops-optimization/index.md) — Tune for high-speed search, high precision, or low memory; understand the background optimizer.

## Security & Troubleshooting

- [Security](/documentation/security/index.md) — API keys, JWT-based collection-scoped access control, TLS encryption, and network binding.
- [Troubleshooting](/documentation/common-errors/index.md) — Diagnose common runtime errors: open-file limits, filesystem incompatibilities, corrupted collection metadata.
