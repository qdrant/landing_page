---
title: Update Clusters
weight: 55
---

# Updating Qdrant Cloud Clusters

As soon as a new Qdrant version is available. Qdrant Cloud will show you an update notification in the Cluster list and on the Cluster details page.

To update to a new version, go to the Cluster Details page, choose the new version from the version dropdown and click **Update**.

If you are several versions behind, multiple updates might be required to reach the latest version. In this case, Qdrant Cloud will automatically perform the required intermediate updates to ensure a supported update path. You should still ensure that your client applications and used SKDs are compatible with the target version.

![Cluster Updates](/documentation/cloud/cluster-upgrades.png)

If you have a multi-node cluster and if your collections have a replication factor of at least **2**, the update process will be zero-downtime and done in a rolling fashion. You will be able to use your database cluster normally. 

If you have a single-node cluster or a collection with a replication factor of **1**, the update process will require a short downtime period to restart your cluster with the new version.

See also [Restart Mode](/documentation/cloud/configure-cluster/#restart-mode) for more details.
