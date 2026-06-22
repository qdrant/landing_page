---
title: Blue-Green Cluster Deployment
short_description: "Deploy changes to Qdrant with zero production risk using a blue-green cluster strategy: build and test on a new cluster, then switch traffic over."
description: "Tutorial: use a blue-green cluster deployment to perform version upgrades, dataset refreshes, or resharding on Qdrant without risking production downtime."
aliases:
  - /documentation/tutorials/blue-green-deployment/
weight: 35
---

# Blue-Green Cluster Deployment

| Time: 30 min | Level: Intermediate |
| :---- | :---- |

A blue-green deployment runs two clusters in parallel: one live cluster serving production traffic (blue), and one staging cluster (green) where you prepare and validate changes. Once the green cluster is ready, you switch application traffic to it and decommission the old cluster.

This is different from a [blue-green migration at the collection level](http:///documentation/tutorials-operations/embedding-model-migration/), where both collections live inside the same cluster. With collection-level blue-green, a bad upload or a heavy indexing run can still affect the production cluster. A cluster-level strategy removes that risk entirely by keeping the risky work on a separate cluster.

## When to Use It

Use a blue-green cluster deployment when:

- You do a **monthly or regular full dataset replacement** and want to build and index the new data without touching the live cluster.  
- You are doing a **version upgrade** and want to test the new Qdrant version on real data before committing production to it. For example, going from 1.15 to 1.18.  
- You are **resharding or increasing the shard count**. Do the resharding on a new cluster so the live cluster never takes the load.  
- You are making any **large structural change** where a mistake could take production down.  
- You want an extra fallback option to improve availability.

## How It Works

The process has five stages:

1. Create a new cluster.  
2. Load all data into it.  
3. Test and validate the new cluster.  
4. Switch application traffic to the new cluster.  
5. (Optional) Decommission the old cluster.

## Prerequisites

- A running Qdrant cluster serving production traffic (the blue cluster).  
- Access to [Qdrant Cloud](https://cloud.qdrant.io/) or your self-hosted infrastructure to spin up a new cluster.  
- If you use private link on Qdrant Cloud, read the [private link note](#private-link-on-qdrant-cloud) before you start. You need to request the Private Link setup for the new cluster before cutover.

## Step 1: Create the New Cluster

Create a new cluster. This will be the green cluster. Configure it the way you want the end state to look:

- If you are upgrading Qdrant, **pick the target version explicitly**. Do not accept the default version without checking. The version you choose here is what you are testing and what will serve production after the switch.  
- If you need a specific cluster size or node count, set them now.

The green cluster starts empty.

## Step 2: Load Data into the New Cluster

You have several options for getting data into the green cluster.

### Option A: Load from Your Primary Data Source

If your primary data source is outside of Qdrant (for example, a database, or an object store), you can load the green cluster directly from there using your own ingestion script. This is often a natural fit for a full dataset replacement: re-embed and re-index from scratch using the same pipeline that populated the blue cluster originally.

This approach gives you full control over the process and enables you to apply any changes to the data, embedding model, or collection schema at the same time.

### Option B: Use the Migration Tool

If you prefer a live, streaming migration, for example, to keep the green cluster closer to up-to-date with the blue cluster while you test or when you want to reshard,  use the [Qdrant Migration Tool](http:///documentation/tutorials-operations/migration/).

```shell
docker run --rm -it \
    registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'https://your-blue-cluster.cloud.qdrant.io:6334' \
    --source.api-key 'blue-cluster-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-green-cluster.cloud.qdrant.io:6334' \
    --target.api-key 'green-cluster-api-key' \
    --target.collection 'your-collection'
```

The migration tool streams data in batches and can resume if interrupted. It also supports collection reconfiguration, such as changing replication settings or quantization or changing shard count, as part of the migration.

### Option C: Restore from a Snapshot

Create a snapshot of each collection on the blue cluster and restore it to the green cluster. This is fast and reliable, and is the preferred approach for large datasets.

Follow the [Snapshots tutorial](http:///documentation/tutorials-operations/create-snapshot/) to create and download snapshots, then restore them to the new cluster.

### Option D: Restore from a Volume Backup

If you take disk-level backups of the Qdrant storage volume, for example, EBS snapshots on AWS, persistent disk snapshots on GCP, or equivalent block storage snapshots on other platforms, [you can restore one of those to the green cluster's storage volume directly](https://qdrant.tech/documentation/cloud/backups/#restore-a-backup).

This is the fastest way to populate a new cluster for large datasets, because it is a block-level copy that bypasses any Qdrant-level data transfer entirely. It restores all collections, their configurations, indexes, and the write-ahead log in one operation.

## Step 3: Test and Validate

Before switching traffic, validate the green cluster thoroughly. At a minimum, check:

- [**Point counts**](https://qdrant.tech/documentation/manage-data/points/#counting-points)**.** Verify that each collection on the green cluster has the expected number of points. If the goal is to mirror the blue cluster, check that the counts match. If you loaded a new dataset, verify against the expected count from that source.  
- [**Search quality**](https://qdrant.tech/documentation/migration-guidance/search-quality/)**.** Run a sample of your production queries against the green cluster and compare results.  
- [**Index state**](https://qdrant.tech/documentation/manage-data/collections/#collection-info)**.** Confirm that indexing is complete before cutover. In the Qdrant Cloud console, each collection shows a status indicator. Wait until it is green. Heavy indexing work during cutover can cause elevated latency.  
- **Version behavior.** If you upgraded Qdrant, check the release notes for any breaking changes and test any features you rely on.

Take your time here. The blue cluster is unaffected until you flip the switch.

## Step 4: Switch Traffic to the New Cluster

The cutover is a configuration change in your application. You need to update two values:

1. **The cluster endpoint.** The green cluster has its own URL.  
2. **The API key.** The green cluster has its own API key with read and write scope.

How you deploy this change depends on your application stack: a config map update, an environment variable change, a feature flag, or a code deploy. The key point is that this is the only change needed for the traffic switch itself.

After the switch, monitor error rates and latency before decommissioning the blue cluster. Keep the blue cluster running until you are confident the green cluster is healthy. 

### Private Link or Private Service Connect on Qdrant Cloud

If you use private link (AWS) or private service connect (GCP) on Qdrant Cloud, the endpoint switch is more involved. These connections are set up per-cluster and require a support ticket. The green cluster needs its own private link or private service connect configured **before** you can route production traffic to it.

Plan for this ahead of time:

1. When you create the green cluster, immediately open a support ticket to set up a private link or private service connect for it.  
2. Do not start the cutover until the private link or private service connect for the green cluster is confirmed.  
3. Update your private link or private service connect configuration to point to the green cluster's connection before changing your application config.

## Step 5 (optional): Decommission the Old Cluster

Once you have confirmed that the green cluster is healthy and serving traffic correctly, you may take down the blue cluster.

Before deleting it, consider whether you want to keep a snapshot as a rollback point. If something unexpected surfaces in the days after cutover, having a snapshot of the blue cluster's state enables you to restore quickly.

## Cost Considerations

During the switch window, you are running two clusters simultaneously. Depending on cluster size, this cost can be significant. Plan to keep the window short: complete testing on the green cluster before you begin the cutover, and decommission the blue cluster promptly once you are satisfied.

## Rollback

If you need to roll back after the cutover:

- If the blue cluster is still running, switch your application config back to the blue cluster's endpoint and API key.  
- If you have already decommissioned the blue cluster, restore from a snapshot into a new cluster and point your application at that.

Because the cutover is a config change rather than a data mutation, rollback is straightforward as long as the blue cluster or a snapshot of it is available.
