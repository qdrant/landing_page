---
title: Deploy Qdrant
slug: deploy-intro
aliases:
  - /documentation/cloud-intro/
breadcrumb: false
content:
  - partial: documentation/banners/banner-b
    title: Deploy Qdrant
    description: Everything you need to run Qdrant in production — from self-hosted installations to fully managed cloud deployments.
    image:
      src: /img/dev-portal-cloud/dev-portal-cloud-hero.png
      alt: Qdrant cloud dashboard
    startedButton:
      text: Get Started
      url: /documentation/cloud-getting-started/
  - partial: documentation/sections/cards-section
    title: General Operations
    description: Install, configure, and operate Qdrant on your own infrastructure or in the Cloud. Covers Docker and Kubernetes deployments, runtime configuration, distributed clustering, performance tuning, and observability.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      icon:
        src: /icons/outline/documentation-blue.svg
        alt: Documents
      title: Installation
      description: Get Qdrant running on Docker, Kubernetes, or as a standalone binary. Covers hardware requirements, networking, and production setup options.
      link:
        url: /documentation/installation/
        text: Read More
    - id: 2
      icon:
        src: /icons/outline/documentation-blue.svg
        alt: Documents
      title: Configuration
      description: Customize Qdrant with configuration files and environment variables. Includes distributed deployment, administration tools, and GPU acceleration.
      link:
        url: /documentation/configuration-ops/
        text: Read More
    - id: 3
      icon:
        src: /icons/outline/documentation-blue.svg
        alt: Documents
      title: Monitoring & Telemetry
      description: Observe your Qdrant nodes using Prometheus and OpenMetrics endpoints, with ready-made Grafana dashboard guides for cloud and self-hosted setups.
      link:
        url: /documentation/monitoring-telemetry/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Qdrant Cloud
    description: Deploy and manage high-performance vector search clusters across cloud environments. Choose fully managed SaaS, bring-your-own-infrastructure with Hybrid Cloud, or fully self-managed with Private Cloud.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-cloud/managed-cloud.png
        alt: Managed Cloud
      title: Managed Cloud
      description: Fully managed Qdrant clusters on AWS, GCP, and Azure. One-click deployment, automatic upgrades, built-in backups, and integrated monitoring.
      link:
        url: /documentation/cloud/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-cloud/hybrid-cloud.png
        alt: Hybrid Cloud
      title: Hybrid Cloud
      description: Run Qdrant in your own Kubernetes infrastructure while managing clusters through the Qdrant Cloud console. Your data never leaves your environment.
      link:
        url: /documentation/hybrid-cloud/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-cloud/private-cloud.png
        alt: Private Cloud
      title: Private Cloud
      description: Deploy the Qdrant Kubernetes Operator with no connection to Qdrant Cloud. Full control over scheduling, scaling, backups, and security.
      link:
        url: /documentation/private-cloud/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Support
    description: Get help from the Qdrant community or reach out to our support team.
    cardsPartial: documentation/cards/docs-cards
    cardsPerRow: 2
    cards:
    - id: 1
      icon:
        src: /icons/outline/discord-purple.svg
        alt: Discord icon
      title: Community Support
      description: Join 8,000+ active members to learn, collaborate, and participate in Qdrant's latest activities.
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
        text: Get Support
        url: /documentation/support/
partition: deploy
hideInSidebar: true
---
