---
title: Time-based Sharding
weight: 181
---
# Time-Based Sharding in Qdrant: A Scalable Approach to Daily Data Ingestion

When working with massive, fast-moving datasets, like social media streams or real-time analytics, it becomes critical to manage storage and retrieval efficiently. One common strategy is to **only keep the most recent N days of data indexed**, and delete older data regularly.

But here’s the catch: if you store everything in a regular Qdrant collection, deleting old points or ingesting new ones can trigger **expensive re-indexing** across the whole dataset.

To fix that, this tutorial walks you through a **time-based [custom sharding](/documentation/guides/distributed_deployment/?q=shard#sharding) setup**, where each day’s data is routed to its own [shard](/documentation/guides/distributed_deployment/?q=shard#sharding). This allows:

* Fast and clean deletion of outdated data
* Efficient writes that don’t interfere with existing segments
* Targeted queries against only the most relevant time slices

We’ll walk through Python code that:

* Creates a Qdrant collection with `CUSTOM` sharding
* Automatically assigns new data to daily shard keys
* Queries only recent shards
* And prunes older ones in the background

## Install Qdrant Client
```bash
pip install qdrant-client datasets
```
## Configure Cluster 
Create a [Qdrant Cluster](/documentation/guides/distributed_deployment/) with at least two nodes. 

## Initialize Client 
Initialize the Qdrant client after creating a [Qdrant Cloud account](/documentation/cloud/) and a [dedicated paid cluster](/documentation/cloud/create-cluster/). 

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/initialize-client/" >}}

## Create Collection 
Qdrant organizes [vectors](/documentation/concepts/vectors/) and their metadata into [collections](/documentation/concepts/collections/). When creating a collection, you must specify the vector parameters. Create a collection with custom [sharding](/documentation/guides/distributed_deployment/?q=shard#sharding) for time-based routing:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/create-collection/" >}}

## Upload Vectors Per Shard 
To upload the [vectors](/documentation/concepts/vectors/) in different shards based on time, your dataset should have a date field. Here is a sample from a [Multi-Language Social Media Dataset](https://huggingface.co/datasets/Exorde/exorde-social-media-one-month-2024):  

| date                | original_text                                              | primary_theme   | english_keywords                                               | sentiment | main_emotion |
|---------------------|------------------------------------------------------------|------------------|----------------------------------------------------------------|-----------|---------------|
| 2024-11-22T01:48:31Z | Esos gobiernos europeos, lacayos de USA, quie...          | Politics         | global war, harakiri, consequences, worse, con...             | -0.75     | neutral       |
| 2024-12-04T17:45:02Z | Dinner time Azerbaijan                                     | Social           | dinner time, azerbaijan, time, dinner, time az...             | 0.17      | neutral       |
| 2024-11-30T06:56:48Z | i hate incest jokes with such a passion                   | Entertainment    | hate incest, hate, incest, jokes, incest jokes...             | -0.46     | anger         |

Upload the streaming dataset by batching it per day and uploading each day to its own shard:

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/upload-vectors/" >}}

##  Perform Semantic Search for a Single Shard
Here, you will ask a question that will allow you to retrieve semantically relevant results from a specific shard.

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/search-single-shard/" >}}

##  Perform a Global Search on all the Shards
Here is how you can search accross all the shards: 

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/search-multiple-shards/" >}}

## Pruning Shards 
You can pune the shards by creating an administrative task that runs on schedule, for example via a cron job. Here is how deleting previous shards looks like:  

{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/pruning-shards/" >}}

## Conclusion
Time-based sharding in Qdrant brings structure and scalability to high-velocity vector data. Whether you're ingesting millions of documents daily, cleaning up expired data, or running real-time queries over recent time slices, this approach helps you keep your collections efficient and responsive, without the overhead of manual cleanup or reindexing. Create a free [Qdrant Cloud account](https://qdrant.tech/cloud/) today and try it. 