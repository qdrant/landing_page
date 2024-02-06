---
title: "Best Practices for Massive-Scale Deployments: Multitenancy and Custom Sharding"
short_description: "Combining our most popular features to support scalable machine learning solutions."
description: "Combining our most popular features to support scalable machine learning solutions."
social_preview_image: /articles_data/multitenancy/preview/social_preview.jpg
preview_dir: /articles_data/multitenancy/preview
small_preview_image: /articles_data/multitenancy/scatter-graph.svg
weight: -101
author: David Myriel
date: 2024-02-06T13:21:00.000Z
draft: false
keywords:
  - multitenancy
  - custom sharding
  - multiple partitions
  - vector database
---

Whether you're building a fraud-detection analytics app, a RAG solution for e-commerce sites, or a healthcare portal for the government - you need to leverage a multitenant architecture and ensure access to your data is controlled. In the world of SaaS and large-scale enterprise solutions, this setup is the norm and it will considerably increase performance and lower your hosting costs. A single Qdrant cluster has the potential to support all of your customers, while each one of them would only see their own data. At times, if this data is location-sensitive, Qdrant gives you the option to divide your cluster by region or other criteria. 

We are seeing the topics of multitenancy and distributed deployment pop-up daily on our [free support Discord](https://qdrant.to/discord) channel, which tells us that users are looking to scale Qdrant along with the rest of their ML setup. If you are currently mulling over your vector database implementation and are thinking of creating multiple collections for each user, read on. 

[Multitenancy](https://qdrant.tech/documentation/guides/multiple-partitions/) is one of the most useful features Qdrant can offer, whereby you can partition one database instance for a vast number of users. Combining this with [Custom Sharding](https://qdrant.tech/documentation/guides/distributed_deployment/#user-defined-sharding) will result in an efficiently-partitioned architecture that further leverages the convenience of a single Qdrant cluster. This article will briefly explain the benefits and show how you can get started using both features.

## Multitenancy: one collection, many users

Multitenant architectures are almost required when scaling out your service and we recommend our multitenancy feature to most users. Under this setup you can upsert all your data to a single Qdrant collection, and then partition each vector via its payload. This means that all your users are leveraging the power of a single Qdrant cluster, but their data is still kept separate.

**Figure 1:** Each individual vector is assigned a specific payload that denotes which user it belongs to. This is how a large number of different users can share a single Qdrant collection.
![Qdrant Multitenancy](/articles_data/multitenancy/multitenancy-single.png)

As a vector search engine, Qdrant is built to excel in multitenant environments. You should only create multiple collections when you have a limited number of users and you need isolation. Creating numerous collections may result in resource overhead and may cause dependencies. You always need to ensure that they do not affect each other in any way, including performance-wise. 

## Defining your deployment via Custom Sharding

Qdrant lets you specify a shard for each point individually. This feature is useful if you want to control where your data is kept in the cluster. Your operations will be able to hit only the subset of shards they actually need. In massive-scale deployments, this can significantly improve the performance of operations that do not require the whole collection to be scanned.

This works in the other direction as well. Whenever you search for something, you can specify a shard or several shards and Qdrant will know where to find them. It will avoid asking all machines in your cluster for results. This will minimize overhead and maximize performance. 

**Figure 2:** Users can both upsert and query shards that are relevant to them, all within the same collection. Regional sharding can help avoid cross-continental traffic. 
![Qdrant Multitenancy](/articles_data/multitenancy/shards.png)

A clear use-case for this feature is managing a multitenant collection, where each tenant (let it be a user or organization) is assumed to be segregated, so they can have their data stored in separate shards. Sharding solves the problem of region-based data placement, whereby certain data needs to be kept within specific locations.  

Custom sharding also gives you precise control over other use cases. A time-based data placement means that data streams can index shards that represent latest updates. If you organize your shards by date, you can have great control over the recency of retrieved data. This is relevant for social media platforms, which greatly rely on time-sensitive data. 

## Before I go any further.....how secure is my user data?

By design, Qdrant offers three levels of isolation. We initially introduced collection-based isolation, but your scaled setup has to move beyond this level. In this scenario, you will leverage payload-based isolation (from multitenancy) and resource-based isolation (from sharding). The ultimate goal is to have a single collection, where you can manipulate and customize placement of shards inside your cluster more precisely and avoid any kind of overhead. 

**Figure 3:** Users can query the collection based on two filters: the `group_id` and the individual `shard_key_selector`. This gives your data two additional levels of isolation.
![Qdrant Multitenancy](/articles_data/multitenancy/multitenancy.png)

## Create custom shards for a single collection

When creating a collection, you will need to configure user-defined sharding. This lets you control the shard placement of your data, so that operations can hit only the subset of shards they actually need. In big clusters, this can significantly improve the performance of operations, since you won't need to go through the entire collection to retrieve data.

```python
client.create_collection(
    collection_name="{collection_name}",
    shard_number=2,
    sharding_method=models.ShardingMethod.CUSTOM,
    # ... other collection parameters
)
client.create_shard_key("{collection_name}", "canada", "usa")
```
In this example, your cluster is divided between USA and Canada. Canadian law is much more stringent when it comes to international data transfer. Let's say you are creating a RAG application that supports the healthcare industry. Your Canadian customer data will have to be clearly separated for compliance purposes. Sharding and multitenancy can be combined to create a powerful scalable solution for real businesss.

## Configure a multitenant setup for users

Let's continue and start adding data. As you upsert your vectors to your new collection, you can add a `group_id` field to each vector. If you do this, Qdrant will assign each vector to its respective group. 

Additionally, each vector can now be allocated to a shard. You can specify the `shard_key_selector` for each individual vector. In this example, you are upserting data belonging to `user_1` to the Canadian region.

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
            shard_key_selector="canada",
        ),
    ],
)
```
Keep in mind that the data for each `group_id` is isolated. In the example below, `user_1` vectors are kept separate from `user_2`. The first user will be able to access their data in the Canadian portion of the cluster, while `user_2 `might only be able to retrieve USA-based information.

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
            shard_key_selector="canada",  
        ),
        models.PointStruct(
            id=2,
            payload={"group_id": "user_1"},
            vector=[0.1, 0.9, 0.1],
            shard_key_selector="canada", 
        ),
        models.PointStruct(
            id=3,
            payload={"group_id": "user_2"},
            vector=[0.1, 0.1, 0.9],
            shard_key_selector="usa", 
        ),
    ],
)
```

## Retrieve data via filters

The access control setup is completed as you specify the criteria for data retrieval. When searching for vectors, you need to use a `query_filter` along with `group_id` to filter vectors for each user. 

```python
client.search(
    collection_name="{collection_name}",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="group_id",
                match=models.MatchValue(
                    value="user_1",
                ),
            ),
        ]
    ),
    query_vector=[0.1, 0.1, 0.9],
    limit=10,
)
```

## Performance considerations

The speed of indexation may become a bottleneck if you are adding large amounts of data in this way, as each user's vector will be indexed into the same collection. To avoid this bottleneck, consider _bypassing the construction of a global vector index_ for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

To implement this approach, you should:

1. Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
2. Set `m` in hnsw config to 0. This will disable building global index for the whole collection.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        payload_m=16,
        m=0,
    ),
)
```

3. Create keyword payload index for `group_id` field.

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="group_id",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```
> Note: Keep in mind that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.

## Next steps

Qdrant is ready to support a massive-scale architecture for your machine learning project. If you are just getting started with our vector database, you should try the [quickstart tutorial](https://qdrant.tech/documentation/quick-start/) or read our [documentation](https://qdrant.tech/documentation/).

To spin up a free instance of Qdrant, sign up for [Qdrant Cloud](https://qdrant.to/cloud) - it is forever free.

For support, or to swap ideas, join our [Discord](https://qdrant.to/discord) community, where we talk about vector search and similarity learning, publish other examples and demos of machine learning applications and vector database setups.








