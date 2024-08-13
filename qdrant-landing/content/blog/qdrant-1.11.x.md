---
title: "Qdrant 1.11 - The Vector Stronghold: Optimizing Data Structures."
draft: false
short_description: "On-Disk Payload Index. UUID Payload Support. Tenant Defragmentation."
description: "Enhanced payload flexibility with on-disk indexing, UUID support, and tenant-based defragmentation." 
preview_image: /blog/qdrant-1.11.x/social_preview.png
social_preview_image: /blog/qdrant-1.11.x/social_preview.png
date: 2024-08-12T00:00:00-08:00
author: David Myriel
featured: true
tags:
  - vector search
  - on-disk payload index
  - tenant defragmentation
  - group-by search
  - random sampling
---

[Qdrant 1.11.0 is out!](https://github.com/qdrant/qdrant/releases/tag/v1.11.0) This release largely focuses on improvements that imrpove memory usage and optimize segments. However, there are a few cool minor features, so let's look at the whole list:

Optimized Data Structures:</br>
**Defragmentation:** Storage for multitenant workloads is more optimized and scales better.</br>
**On-Disk Payload:** You can now store less frequently used data on disk, rather than on RAM.</br>
**UUID Support:** Additional data type for payload can result in significant memory savings.

Improved Query API:</br>
**GroupBy Endpoint:** Use this query method to group results by a certain payload field.</br>
**Random Sampling:** Select a subset of data points from a larger dataset in a random manner.</br>
**Hybrid Search Fusion:** We are adding the Distribution-Based Score Fusion (DBSF) method.</br>

New Web UI Tools:</br>
**Search Quality Tool:** Test the precision of your semantic search requests in real time.</br>
**Graph Exploration Tool:** Visualize vector search in context-based exploratory scenarios.</br>

### Quick Recap: Multitenant Workloads

Before we dive into the specifics of our optimizations, let's first go over Multitenancy. This is one of our most significant features, [best used for at scaling and data isolation](https://qdrant.tech/articles/multitenancy/).

If you’re using Qdrant to manage data for multiple users, regions, or workspaces (tenants), we suggest setting up a [multitenant environment](/documentation/guides/multiple-partitions/). This approach keeps all tenant data in a single global collection, with points separated and isolated by their payload.

To avoid slow and unnecessary indexing, it’s better to create an index for each relevant payload rather than indexing the entire collection globally. Since some data is indexed more frequently, you can focus on building indexes for specific regions, workspaces, or users.

*For more details on scaling best practices, read [How to Implement Multitenancy and Custom Sharding](https://qdrant.tech/articles/multitenancy/).*

### Defragmentation of Tenant Storage 

With version 1.11, Qdrant changes how vectors from the same tenant are stored on disk, placing them **closer together** for faster bulk reading and reduced scaling costs. This approach optimizes storage and retrieval operations for different tenants, leading to more efficient system performance and better resource utilization.

> Defragmentation can significantly improve performance. In the coming weeks, we will share **benchmark data** to demonstrate performance gains.

**Figure 1:** Re-ordering by payload can significantly speed up access to hot and cold data.

![defragmentation](/blog/qdrant-1.11.x/defragmentation.png)

**Example:** When creating an index, you may set `is_tenant=true`. This configuration will optimize the storage based on your collection’s usage patterns.

```http
PUT /collections/{collection_name}/index
{
    "field_name": "workspace_2",
    "field_schema": {
        "type": "keyword",
        "is_tenant": true
    }
}
```
As a result, the storage structure will be organized in a way to co-locate vectors of the same tenant together. 

*To learn more about defragmentation, read the [Multitenancy documentation](/documentation/guides/multiple-partitions/).*

### On-Disk Support for the Payload Index

When managing billions of records across millions of tenants, keeping all data in RAM is inefficient, especially when only a small subset is frequently accessed. As of 1.11, you can offload "cold" data to disk and cache the “hot” data in RAM. 

*This feature can help you manage a high number of different payload indexes, which is beneficial if you are working with large varied datasets.*

**Figure 2:** By moving the Workspace 2 index to disk, the system can free up valuable memory resources for Workspaces 1,3 and 4, that are accessed more frequently.

![on-disk-payload](/blog/qdrant-1.11.x/on-disk-payload.png)

**Example:** As you create an index for Workspace 2, set the `on_disk` parameter. 

```html
PUT /collections/{collection_name}/index
{
    "field_name": "workspace_2",
    "field_schema": {
        "type": "keyword",
        "is_tenant": true,
        "on_disk": true
    }
}
```

By moving the index to disk, Qdrant can handle larger datasets that exceed the capacity of RAM, making the system more scalable and capable of storing more data without being constrained by memory limitations.

*To learn more about this, read the [Indexing documentation](/documentation/concepts/index/).*

### UUID Datatype for the Payload Index

Many Qdrant users rely on UUIDs in their payloads, but storing these as strings comes with a substantial memory overhead—approximately 60 bytes per UUID. In reality, UUIDs only require 16 bytes of storage when stored as raw bytes. 

To address this inefficiency, we’ve developed a new index type tailored specifically for UUIDs that stores them internally as bytes, **reducing memory usage by up to 3.75x.**

**Example:** When adding two separate points, indicate their UUID in the payload. In this example, both data points belong to the same user (with the same UUID).

```html
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": [0.05, 0.61, 0.76, 0.74],
            "payload": {"id": 550e8400-e29b-41d4-a716-446655440000}
        },
        {
            "id": 2,
            "vector": [0.19, 0.81, 0.75, 0.11],
            "payload": {"id": 550e8400-e29b-41d4-a716-446655440000}
        },
    ]
}
```

> For organizations that have numerous users and UUIDs, this simple fix can significantly reduce the cluster size and improve efficiency.

*To learn more about this, read the [Payload documentation](/documentation/concepts/payload/).*

### Query API: Groups Endpoint 

When searching over data, you can group results by specific payload field, which is useful when you have multiple data points for the same item and you want to avoid redundant entries in the results.

**Example:** If a large document is divided into several chunks, and you need to search or make recommendations on a per-document basis, you can group the results by the `document_id`.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_point_groups(
    collection_name="{collection_name}",
    query=[0.01, 0.45, 0.67],
    group_by="document_id",
    limit=4,
    group_size=2,
)
```

This endpoint will retrieve the best N points for each document, assuming that the payload of the points contains the document ID. Sometimes, the best N points cannot be fulfilled due to lack of points or a big distance with respect to the query. In every case, the `group_size` is a best-effort parameter, similar to the limit parameter.

*For more information on grouping capabilities refer to our [Hybrid Queries documentation](/documentation/concepts/hybrid-queries/).*


### Query API: Random Sampling 

Our [Food Discovery Demo](https://food-discovery.qdrant.tech) always shows a random sample of foods from the larger dataset. Now you can set the randomization from a basic Query API endpoint.

When calling the Query API, you will be able to select a subset of data points from a larger dataset in a random manner. 

*This technique is often used to reduce the computational load, improve query response times, or provide a representative sample of the data for various analytical purposes.* 

**Example:**  When querying the collection, you can configure it to retrieve a random sample of data.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

# Random sampling (as of 1.11.0)
sampled = client.query_points(
    collection_name="{collection_name}",
    query=models.SampleQuery(sample=models.Sample.Random)
)
```
*To learn more, check out the [Query API documentation](/documentation/concepts/hybrid-queries/).*

### Query API: Distribution-Based Score Fusion

In version 1.10, we added Reciprocal Rank Fusion (RRF) as a way of fusing results from Hybrid Queries. Now we are adding Distribution-Based Score Fusion (DBSF). Michelangiolo Mazzeschi talks more about this fusion method in his latest [Medium article](https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18).

*DBSF normalizes the scores of the points in each query, using the mean +/- the 3rd standard deviation as limits, and then sums the scores of the same point across different queries.* 


**Example:** To fuse `prefetch` results from sparse and dense queries, set the `"fusion": "dbsf"`
```html
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { 
                "indices": [1, 42],    // <┐
                "values": [0.22, 0.8]  // <┴─Sparse vector
             },
            "using": "sparse",
            "limit": 20
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- Dense vector
            "using": "dense",
            "limit": 20
        }
    ],
    "query": { "fusion": “dbsf" }, // <--- Distribution Based Score Fusion
    "limit": 10
}
```

Note that `dbsf` is stateless and calculates the normalization limits only based on the results of each query, not on all the scores that it has seen.

*To learn more, check out the [Hybrid Queries documentation](/documentation/concepts/hybrid-queries/).*

## Web UI: Search Quality Tool 

We have updated the Qdrant Web UI with additional testing functionality. Now you can check the quality of your search requests in real time and measure it against exact search. 

**Try it:** In the Dashboard, go to collection settings and test the **Precision** from the Search Quality menu tab. 

> The feature will conduct semantic search for each point and produce a report below.

<iframe width="560" height="315" src="https://www.youtube.com/embed/PJHzeVay_nQ?si=u-6lqCVECd-A319M" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


## Web UI: Graph Exploration Tool

Deeper exploration is highly dependant on expanding context. This is something we previously covered in the [Discovery Needs Context](/articles/discovery-search/) article earlier this year. Now, we have developed a UI feature to help you visualize how semantic search can be used for exploratory and recommendation purposes. 

**Try it:** Using the feature is pretty self-explanatory. Each collection's dataset can be explored from the **Graph** tab. As you see the images change, you can steer your search in the direction of specific characteristics that interest you. 

*Search results will become more "distilled" and tailored to your preferences.*

<iframe width="560" height="315" src="https://www.youtube.com/embed/PXH4WPYUP7E?si=nFqLBIcxo-km9i4V" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Next Steps

If you’re new to Qdrant, now is the perfect time to start. Check out our [documentation](/documentation/) guides and see why Qdrant is the go-to solution for vector search.

We’re very happy to bring you this latest version of Qdrant, and we can’t wait to see what you build with it. As always, your feedback is invaluable—feel free to reach out with any questions or comments on our [community forum](https://qdrant.to/discord).