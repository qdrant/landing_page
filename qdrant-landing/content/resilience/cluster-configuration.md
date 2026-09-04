---
label: CLUSTER CONFIGURATION
title: Configure the Right Resilience for Your Workload
description: "Replication and node count give you high availability. Multi-AZ is the zone-resilience upgrade on top, for teams that need to survive a full availability-zone outage. These three properties define your cluster's resilience on Qdrant Cloud:"
cards: 
  - id: 0
    title: Replication Factor
    image:
      src: /img/resilience/cluster-configuration/replication-factor.png
      alt: Replication factor
    description1: <span>What Qdrant Cloud Does</span> Keeps equal copies of every shard across your nodes
    description2: <span>What it Means</span> Searches and writes continue when a node goes down.
  - id: 1
    title: Node Count
    image:
      src: /img/resilience/cluster-configuration/node-count.png
      alt: Node Count
    description1: <span>What Qdrant Cloud Does</span> Distributes shard replicas across more nodes.
    description2: <span>What it Means</span> More headroom for your cluster to stay healthy.
  - id: 0
    title: Multi-AZ
    image:
      src: /img/resilience/cluster-configuration/multi-az.png
      alt: Multi-AZ
    description1: <span>What Qdrant Cloud Does</span> Spreads those nodes across three availability zones.
    description2: <span>What it Means</span> Your cluster stays up across a full zone outage.
banner:
  title: Multi-AZ
  icon:
    src: /icons/outline/boxes-purple.svg
    alt: Boxes
  list1:
    - id: 0
      text: Enabled at cluster creation
    - id: 1
      text: Available on the Premium tier
  list2:
    - id: 0
      text: Changes where your replicas are placed, not how many
    - id: 1
      text: Without it, a multi-node cluster keeps all replicas in one zone
  link:
    url: /documentation/scaling/distributed_deployment/
    text: Read Documentation
sitemapExclude: true
---