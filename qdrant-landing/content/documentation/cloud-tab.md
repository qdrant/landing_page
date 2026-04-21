---
title: Welcome to Qdrant Cloud
slug: cloud-intro
breadcrumb: false
content:
  - partial: documentation/banners/banner-b
    title: Deploy & Operate Qdrant
    description: Deploy & Operate Qdrant
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
---
