---
title: Update Clusters
short_description: "Upgrade Qdrant Cloud clusters to new versions with rolling, zero-downtime updates on multi-node clusters with replicated collections."
description: "Upgrade Qdrant Cloud clusters to new versions through the console, with rolling zero-downtime updates on multi-node clusters that use replication."
weight: 35
---

# Updating Qdrant Cloud Clusters

As soon as a new Qdrant version is available. Qdrant Cloud will show you an update notification in the Cluster list and on the Cluster details page.

To update to a new version, go to the Cluster Details page, choose the new version from the version dropdown and click **Update**.

If you are several versions behind, multiple updates might be required to reach the latest version. In this case, Qdrant Cloud will automatically perform the required intermediate updates to ensure a supported update path. You need to ensure that your client applications and used SDKs are compatible with the target version. Keep your client SDK within one minor version of your cluster version. Larger gaps might work, but are not tested.

Update the cluster first, then update the client SDKs. This prevents your applications from using features that the older cluster version does not support yet. If you upgrade across several minor versions, for example from 1.15 to 1.19, update the client SDKs after Qdrant Cloud completes all intermediate updates and the cluster reaches the target version.

![Cluster Updates](/documentation/cloud/cluster-upgrades.png)

On a multi-node cluster whose collections have a replication factor of at least **2**, the update is zero-downtime and rolling. On a single-node cluster, or for a collection with a replication factor of **1**, the update needs a short downtime period to restart the cluster with the new version. See [Restarts and Downtime](/documentation/cloud/configure-cluster/#restarts-and-downtime) for the full rules.

We advise taking a [backup](/documentation/cloud/backups/) before updating to allow for rollbacks.
