---
title: Update Clusters
weight: 55
---

# Updating Qdrant Cloud Clusters

As soon as a new Qdrant version is available. Qdrant Cloud will show you an update notification in the Cluster list and on the Cluster details page.

To update to a new version, go to the Cluster details page, choose the new version from the version dropdown and click **Update**.

![Cluster Updates](/documentation/cloud/cluster-upgrades.png)

If you have a multi-node cluster and if your collections have a replication factor of at least **2**, the update process will be zero-downtime and done in a rolling fashion. You will be able to use your database cluster normally. 

If you have a single-node cluster or a collection with a replication factor of **1**, the update process will require a short downtime period to restart your cluster with the new version.
