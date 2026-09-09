---
label: CAPABILITIES
description: These capabilities apply to replicated collections. <br>See cluster configuration above for the node count and replication factor requirements.
link:
  url: /documentation/cloud/configure-cluster/
  text: Configure a Cluster (Docs)
banner:
  title: What Qdrant Cloud Manages, By Tier
  containedButton:
    text: Start Free
    url: https://cloud.qdrant.io/signup
  outlinedButton:
    text: Talk to Engineering
    url: /contact-us/
tabs:
  - id: 0
    tab: Automatic Failover
    cards:
      - id: 0
        label:
          icon:
            src: /icons/outline/copy-purple.svg
            alt: Copy
          text: ALL REPLICATED CLUSTERS
        title: Automatic Failover
        description1: <span>Mechanics</span> Qdrant Cloud runs health checks across nodes and routes around unhealthy nodes, so queries continue from healthy nodes. Every replica is equal, so there is no primary to promote.
        description2: <span>Guarantees</span> Qdrant Cloud detects failures and keeps serving traffic from healthy nodes. No client-side changes required.
        link:
          url: /documentation/cloud/create-cluster/
          text: Set Up a Replicated Cluster (Docs)
      - id: 1
        image:
          src: /img/resilience/capabilities/card1.png
          mobileSrc: /img/resilience/capabilities/card1-mobile.png
          alt: Cloud cluster UI
  - id: 1
    tab: Zero-Downtime Upgrades
    cards:
      - id: 0
        label:
          icon:
            src: /icons/outline/copy-teal.svg
            alt: Copy
          text: ALL REPLICATED CLUSTERS
        title: Zero-Downtime Upgrades
        description1: <span>Mechanics</span> When a new version is available, you choose when to upgrade. Qdrant Cloud upgrades in a rolling fashion. If you are several versions behind, the required intermediate updates run automatically.
        description2: <span>Guarantees</span> Multi-node clusters where all collections have replication factor 2 or higher stay fully available throughout the upgrade.
        link:
          url: /documentation/cloud/cluster-upgrades/
          text: Update Your Cluster (Docs)
      - id: 1
        image:
          src: /img/resilience/capabilities/card2.png
          mobileSrc: /img/resilience/capabilities/card2-mobile.png
          alt: Cluster overview UI
  - id: 2
    tab: Backup & Recovery
    cards:
      - id: 0
        label:
          icon:
            src: /icons/outline/dollar-sign-green.svg
            alt: Dollar
          text: ALL PAID CLUSTERS
        title: Backups and Disaster Recovery
        description1: <span>Mechanics</span> Schedule backups, set days of retention, or take an on-demand backup any time. Backups restore into the same cluster or a new one.
        description2: <span>Guarantees</span> Restore your cluster to the exact state of any backup within your retention window, including its configuration. No recovery scripts needed, so your team can focus on getting back online.
        link:
          url: /documentation/cloud/backups/
          text: Back Up Your Cluster (Docs)
      - id: 1
        image: 
          src: /img/resilience/capabilities/card3.png
          mobileSrc: /img/resilience/capabilities/card3-mobile.png
          alt: Backups UI
        addition: <span>Honest Note</span> Backups protect against data loss; they are not a fast-failover substitute. For low recovery time, run replicated and Multi-AZ. For planned data-center switchovers or full region loss, talk to us about an active-active pattern.
  - id: 3
    tab: Support
    cards:
      - id: 0
        label:
          icon:
            src: /icons/outline/phone-blue.svg
            alt: Phone
          text: TIER-DEPENDENT
        title: Engineering Support
        description1: <span>Mechanics</span> Premium support covers production incidents 24/7, with severity-based response-time SLAs. Standard covers business hours.
        description2: <span>Guarantees</span> Faster response times and around-the-clock coverage on Premium, with SLAs defined per severity level in the Qdrant Cloud SLA.
        link:
          url: https://cloud.qdrant.io/sla
          text: See Support SLAs
  - id: 4
    tab: Multi-AZ Placement
    cards:
      - id: 0
        label:
          icon:
            src: /icons/outline/trophy-orange.svg
            alt: Trophy
          text: PREMIUM-TIER
        title: Multi-AZ Placement
        description1: <span>Mechanics</span> Qdrant Cloud places your shard replicas across three availability zones, so each shard has a replica in a different zone. Traffic is routed between zones automatically, so the cluster stays available if one zone goes down. Enable Multi-AZ Deployment when you create the cluster.
        description2: <span>Guarantees</span> An uptime SLA of up to 99.95% on the Premium tier with Multi-AZ enabled. Traffic reroutes across zones automatically, with no client-side changes.
        link:
          url: https://cloud.qdrant.io/signup
          text: Start Free
sitemapExclude: true
---
