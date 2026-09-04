---
title: How Resilience Works</br>on Qdrant Cloud
description: Run at least 3 nodes with replication factor 2 or higher and the capabilities below apply to your cluster.
link:
  url: /documentation/cloud/configure-cluster/
  text: Configure a Replicated Cluster (Docs) 
cards:
  - id: 0
    icon:
      src: /icons/outline/copy-teal-large.svg
      alt: Copy
    title: Replication
    description: Equal copies of every shard, kept across your nodes.
  - id: 1
    icon:
      src: /icons/outline/file-x-teal.svg
      alt: File
    title: Failover
    description: Searches and writes continue when a node goes down.
  - id: 2
    icon:
      src: /icons/outline/refresh-cw-teal-large.svg
      alt: Refresh
    title: Rolling Upgrades
    description: Updates move through one node at a time while the rest serve traffic.
addition: <span>You set it, Qdrant runs it.</span> You choose the replication factor, the platform maintains the replicas.
sitemapExclude: true
---

