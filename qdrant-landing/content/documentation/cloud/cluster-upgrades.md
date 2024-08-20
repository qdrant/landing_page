---
title: Upgrade Clusters
weight: 55
---

# Upgrading Qdrant Cloud Clusters

As soon as a new Qdrant version is available. Qdrant Cloud will show you an upgrade notification in the Cluster list and on the Cluster details page.

To upgrade to a new version, go to the Cluster details page, choose the new version from the version dropdown and click **Upgrade**.

![Cluster Upgrades](/documentation/cloud/cluster-upgrades.png)

If you have a multi-node cluster and if your collections have a replication factor of at least **2**, the upgrade process will be zero-downtime and done in a rolling fashion. You will be able to use your database cluster normally. 

If you have a single-node cluster or a collection with a replication factor of **1**, the upgrade process will require a short downtime period to restart your cluster with the new version.
