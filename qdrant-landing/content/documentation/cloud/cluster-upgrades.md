---
title: Update Clusters
short_description: "Upgrade Qdrant Cloud clusters to new versions with rolling, zero-downtime updates on multi-node clusters with replicated collections."
description: "Upgrade a Qdrant Cloud cluster to a new version: checks to run first, the update steps, how to verify, and how to roll back with a backup."
weight: 35
---

# Updating Qdrant Cloud Clusters

When a new Qdrant version is available, Qdrant Cloud shows an update notification in the Cluster list and on the Cluster details page. Qdrant Cloud supports the latest and the previous 3 minor versions. A cluster on an older version triggers an alert, and its support requests are not covered by the SLA.

## Before You Update

1. **Check SDK compatibility.** Make sure that your client applications and SDKs are compatible with the target version. Keep your client SDK within one minor version of your cluster version. Larger gaps might work, but are not tested.
2. **Check for downtime.** On a multi-node cluster whose collections have a replication factor of at least **2**, the update is zero-downtime and rolling. On a single-node cluster, or for a collection with a replication factor of **1**, the update needs a short downtime period to restart the cluster with the new version. See [Restarts and Downtime](/documentation/cloud/configure-cluster/#restarts-and-downtime) for the full rules. Free clusters update with downtime.
3. **Take a backup.** A backup is your way to roll back. See [Backups](/documentation/cloud/backups/).
4. **Read the release notes** for the versions you skip over. If you are several versions behind, Qdrant Cloud performs the required intermediate updates automatically to keep a supported update path. See the [release notes](https://github.com/qdrant/qdrant/releases).

## Update the Cluster

Update the cluster first, then update the client SDKs.

![Cluster Updates](/documentation/cloud/cluster-upgrades.png)

1. Go to the Cluster Details page.
2. Choose the new version from the version dropdown.
3. Click **Update**.

## Update the Client SDKs

After the cluster is updated, update your client SDKs. Doing it in this order prevents your applications from using features that the older cluster version does not support yet. If you upgrade across several minor versions, for example from 1.15 to 1.19, update the client SDKs after Qdrant Cloud completes all intermediate updates and the cluster reaches the target version.

## Verify the Update

Request the cluster root. The response contains the running version:

```sh
curl -X GET 'https://<cluster-endpoint>:6333' --header 'api-key: <your-api-key>'
```

Then check that the cluster is healthy in the Console, that your application's queries return results as before, and that no new [alerts](/documentation/cloud/cluster-alerts/) arrive.

## Roll Back

Restore the backup you took before the update. A restore reverts the cluster to the state it had when the backup was taken, including the Qdrant version, and the cluster is unavailable while it runs. Data written after the backup is lost. To test the new version without that risk, restore the backup into a new cluster and update that one instead. See [Restore a Backup](/documentation/cloud/backups/#restore-a-backup).
