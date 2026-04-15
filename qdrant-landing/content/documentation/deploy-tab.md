---
title: Deploy Qdrant
slug: cloud-intro
breadcrumb: false
content:
  - partial: documentation/banners/banner-b
    title: Deploy Qdrant
    image:
      src: /img/dev-portal-cloud/dev-portal-cloud-hero.png
      alt: Qdrant cloud dashboard
    startedButton:
      text: Get Started
      url: https://qdrant.to/cloud
  - partial: documentation/sections/cards-section
    title: Qdrant Operations
    description: Install, configure, and manage Qdrant in your own infrastructure.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      icon:
        src: /icons/outline/server-rack-blue.svg
        alt: Deploy icon
      title: Installation & Setup
      description: Deploy Qdrant with Docker, Kubernetes, or build from source. Covers capacity planning, networking requirements, and distributed deployment.
      link:
        url: /documentation/installation/
        text: Read More
    - id: 2
      icon:
        src: /icons/outline/switches-blue.svg
        alt: Configuration icon
      title: Configuration & Optimization
      description: Tune storage, indexing thresholds, and performance settings. Configure environment variables and optimize for your specific workload.
      link:
        url: /documentation/configuration/
        text: Read More
    - id: 3
      icon:
        src: /icons/outline/chart-bar-blue.svg
        alt: Monitoring icon
      title: Monitoring & Security
      description: Expose Prometheus metrics and health endpoints. Configure API keys, TLS, JWT access control, snapshots, and upgrades.
      link:
        url: /documentation/monitoring/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Qdrant Cloud
    description: Managed Qdrant deployment across fully managed, hybrid, and private cloud environments.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-cloud/managed-cloud.png
        alt: Managed Cloud
      title: Managed Cloud
      description: Fully managed Qdrant clusters on Qdrant Cloud with one-click setup, automatic scaling, continuous backups, and zero-downtime upgrades.
      link:
        url: /documentation/cloud/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-cloud/hybrid-cloud.png
        alt: Hybrid Cloud
      title: Hybrid Cloud
      description: Run Qdrant in your own infrastructure while Qdrant manages the control plane. Ideal for data residency and security requirements.
      link:
        url: /documentation/hybrid-cloud/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-cloud/private-cloud.png
        alt: Private Cloud
      title: Private Cloud
      description: Full control over Qdrant clusters deployed in any Kubernetes environment, on any infrastructure, with no external dependencies.
      link:
        url: /documentation/private-cloud/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Support
    description: Get help from the Qdrant community or our support team.
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
      description: Paying customers have access to our support team. Links to the support portal are available in the Qdrant Cloud Console.
      link:
        text: Get Support
        url: https://qdrant.to/cloud
partition: deploy
hideInSidebar: true
---
