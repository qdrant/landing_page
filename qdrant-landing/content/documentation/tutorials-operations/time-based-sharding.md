---
title: Time-Based Sharding
weight: 35
---

# Time-Based Sharding in Qdrant

When working with massive, fast-moving datasets, like social media or image/video streams, efficient storage and retrieval are critical. Often, only the most recent data is relevant, while older data can be archived or deleted. For instance, in sentiment analysis of social media posts, you might only need the last 7 days of data to capture current trends, with most queries focusing on the last 24 hours.

Storing everything in Qdrant collection with default sharding can lead to expensive re-indexing across the entire dataset when deleting old points, impacting performance. A better solution is **time-based sharding**, where points are routed to a specific [shard (or shards)](/documentation/guides/distributed_deployment/#sharding) based on timestamp. For use cases with a natural time-to-live (TTL) segmentation, sharding by a timestamp-based key enables efficient querying of recent data and allows users to seamlessly drop the old.

For example, with daily shards, today's data is stored in today's shard, yesterday's data in yesterday's shard, and so on. Queries can target specific shards (today's shard, for example) or multiple shards to cover a date range.

<figure>
  <img src="/documentation/tutorials/time-based-sharding/time-based-sharding.png">
  <figcaption>
    Time-based sharding routes data to different shards based on timestamp. Typically, all writes go to the newest shard, while queries can target one or more shards. Older shards can be pruned in the background without affecting performance.
  </figcaption>
</figure>

Depending on your data volume and retention needs, you could shard by hour, week, month, or any other time interval that suits your use case.

This tutorial guides you through implementing time-based sharding and covers:

* Creating a Qdrant collection with user-defined sharding
* Batch-ingesting historical data into the correct shards based on timestamps
* Assigning new data to the most recent shard
* Querying one or more shards
* Pruning older shards

## Install and Initialize the Qdrant Client

First, install the Qdrant client:

```bash
!pip install qdrant-client
```

Next, initialize the client: 

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="initialize-client" >}}

This tutorial assumes you are using [Qdrant Cloud Inference](/documentation/concepts/inference/#qdrant-cloud-inference) to generate vector embeddings. If you manage your own embedding infrastructure, you can apply the same principles, but you will need to adapt the code examples to use your embedding service.

## Create Collection

Create a collection with [user-defined sharding](/documentation/guides/distributed_deployment/#user-defined-sharding) by setting the sharding method to custom.

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="create-collection" >}}

Custom shards can be accessed by their shard key. In this tutorial, the shard keys are the dates in `YYYY-MM-DD` format, extracted from the timestamp of each data point.

This collection will have a single shard for each shard key (a separate shard for each day of data). For very large datasets, you can improve write throughput by configuring a `shard_number` for the collection. `shard_number` defaults to 1. Set it to a higher value to create multiple shards per shard key to distribute the write load across multiple peers in the cluster. However, avoid creating too many shards, as each shard consumes resources and adds overhead, which can lead to performance degradation. Test what the optimal number of shards is for your dataset and cluster configuration.

Note that, for regular collections using `auto` sharding, `shard_number` determines the total number of shards for a collection. With user-defined sharding, it determines the number of shards **per shard key**: the total number of shards for a collection equals the number of shard keys (days) multiplied by the `shard_number`.

## Ingest Historical Data

Time series data often arrives in streams, with new data points continuously being added. Each data point may include a timestamp indicating when it was created. You can use this timestamp to determine which shard a data point belongs to. If your data does not have timestamps, you can use the current time.

This tutorial uses a [sample dataset of social media posts](https://github.com/qdrant/examples/blob/master/time-based-sharding/social-media-posts.csv) with timestamps. Let's assume today is April 7th, 2026. You'll start by ingesting some historical data from this week (April 1-7). Here are a few sample rows from the dataset:

| datetime            | text
|---|---|
| 2026-04-06T09:04:28 | April sunshine through the office window makes everything better.
| 2026-04-06T09:04:32 | Morning stretch, good coffee, clear intentions. Monday: sorted.
| 2026-04-06T09:05:52 | Grateful for a productive first day of the week.

Upload the dataset and store each day of data in its own shard:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="upload-vectors" >}}

Let's break down the code:

- First, a list of existing shard keys in the collection is retrieved. There should be none because you just created the collection, but in production, this ensures you take into account any existing data.
- Next, a CSV file is streamed from a URL.
- The CSV file is streamed row by row, buffering points in batches of 100 for efficient uploading. The optimal batch size depends on your data and cluster, so you may want to experiment with different sizes for best performance.
- The date (`YYYY-MM-DD`) is extracted from each row's datetime field. This date is used as the shard key to route the data to the correct shard.
- A new shard is created for each new date encountered if it doesn't already exist.
- The buffer is flushed to the previous date's shard whenever the date changes mid-stream, ensuring posts don't get written to the wrong shard.
- Data is written, where each point gets:
  - A random UUID as the point ID
  - The post `text` and `datetime` as the payload
  - A dense vector embedding generated from the post text using `sentence-transformers/all-MiniLM-L6-v2`
- Each full  batch of 100 points is uploaded to Qdrant, targeting the correct date-based shard via the shard key selector parameter.
- Any remaining points are uploaded in a partial final batch after the loop ends.

## Query the Data

### Query Today's Data

Now you can run a semantic query on the posts. Setting the shard key selector to `2026-04-07`  (assuming today is April 7th, 2026) limits the query to the shard that stores today's data:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="search-single-shard" >}}

### Query Multiple Days of Data

To query multiple shards, set the shard key selector to a list of shard keys. For example, to query the last 2 days of data (April 6-7):

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="search-multiple-shards" >}}

### Query the Full Dataset

To query the entire dataset (all shards), omit the shard key selector parameter:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="search-all-shards" >}}

## Pruning Shards

Every night at midnight, create a new shard for the new data that will be ingested that day. If you only query the last 7 days of data, you can also delete the oldest shard. You can automate this with a cron job.

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="pruning-shards" >}}

## Ingest New Data

When ingesting new data, set the `shard_key_selector` to today's date so the data goes to the correct shard:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="ingest-new-data" >}}

## Conclusion

Time-based sharding is a powerful technique for managing large, time-series datasets in Qdrant. By routing data to different shards based on timestamps, you can efficiently store and query recent data while easily pruning older data without impacting performance. This approach is ideal for use cases like social media analysis, where data relevance decreases over time.