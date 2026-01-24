---
title: Time-based Sharding
weight: 181
---
# Time-Based Sharding in Qdrant

When working with massive, fast-moving datasets, like social media streams or real-time analytics, it becomes critical to manage storage and retrieval efficiently. 
In many cases, you are only interested in the most recent data, while older data can be archived or deleted. For example, for sentiment analysis on social media posts, you might only need the last 7 days of data to capture current trends, with most queries focusing on the last 24 hours.

If you store everything in a regular Qdrant collection, deleting old points can trigger expensive re-indexing across the whole dataset, impacting performance. A better solution is to use **time-based sharding**, where data is routed to a specific [shard](/documentation/guides/distributed_deployment/?q=shard#sharding) based on its timestamp. Breaking up data based on age enables easy data retention and efficient querying of recent data.

For instance, with daily shards, today's data is stored by today's shard, yesterday's data by yesterday's shard, and so on. Queries can target specific shards (today's shard, for example) or multiple shards to cover a date range.

<figure>
  <img src="/documentation/tutorials/time-based-sharding/time-based-sharding.png">
  <figcaption>
    Time-based sharding routes data to different shards based on timestamp. In a typical scenario, all writes go to the newest shard, while queries can target one or more recent shards. Older shards can be pruned in the background without impacting performance.
  </figcaption>
</figure>

Note that daily sharding is just one example. Depending on your data volume and retention needs, you could shard by hour, week, month, or any other time interval that fits your use case.

This tutorial walks you through implementing time-based sharding. Using Python code snippets, you'll learn how to:

* Create a Qdrant collection with user-defined sharding
* Automatically assign new data to daily shard keys
* Query one or more shards
* Prune older shards

This code is also available as a [Google Colab Notebook](https://colab.research.google.com/github/qdrant/examples/blob/master/time-based-sharding/time-based-sharding.ipynb).

## Install Qdrant Client

First, install the Qdrant client:

```bash
!pip install qdrant-client
```

## Initialize Client

Next, initialize the client: 

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/initialize-client/" >}}

## Create Collection

Create a collection with [user-defined sharding](/documentation/guides/distributed_deployment/#user-defined-sharding) (`ShardingMethod.CUSTOM`). The collection will have up to 8 shards: one for today's data, and up to 7 for each day of the past week:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/create-collection/" >}}

## Ingest Historical Data

Time series data often arrives in streams, with new data points continuously being added. Each data point may include a timestamp indicating when it was created. You can use this timestamp to determine which shard the data point belongs to. If your data does not have timestamps, you can assign the current time when ingesting.

This tutorial uses a [sample dataset of social media posts](https://github.com/qdrant/examples/blob/master/time-based-sharding/social-media-posts.csv) with timestamps. We'll assume today is January 7th, 2026. You'll start by ingesting some historical data from this week (January 1-7). Here are a few sample rows from the dataset:

| datetime                | text
|---|---|
| 2026-01-01T07:43:12 | Starting the year with a fresh cup of coffee and a positive mindset. |
| 2026-01-01T09:18:47 | New year, new goals, same excitement for small wins. |
| 2026-01-01T10:56:03 | January mornings just feel full of possibility. |

Upload the dataset by batching it per day and uploading each day to its own shard:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/upload-vectors/" >}}

## Query Today's Data

Now you can run a semantic search for "coffee" on today's posts. Setting `shard_key_selector="2026-01-07"`  (assuming today is January 7th, 2026) limits the query to the shard that stores today's data:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/search-single-shard/" >}}

## Query the Full Dataset

To query the entire dataset (all shards), omit the `shard_key_selector` parameter:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/search-multiple-shards/" >}}

## Pruning Shards

Every night at midnight, create a new shard for new data that will be ingested today. Delete the oldest shard so we only retain 7 days of data. In a real setup, you could automate this, for example, with a cron job.

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/pruning-shards/" >}}

## Ingest New Data

When ingesting new data, set the `shard_key_selector` to today's date so the data goes to the correct shard:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/ingest-new-data/" >}}

Finally, you can rerun the earlier queries to see how you can still query the whole dataset or just a subset.