---
title: "A Complete Guide to Filtering"
short_description: "Merging different search methods to improve the search quality was never easier"
description: "Qdrant 1.10 introduces a new Query API to build a search system that combines different search methods to improve the search quality."
preview_dir: /articles_data/guide-filtering/preview
social_preview_image: /articles_data/guide-filtering/social-preview.png
weight: -200
author: Sabrina Aquino, David Myriel
author_link: 
date: 2024-09-01T00:00:00.000Z
---

<img src="/articles_data/guide-filtering/vector-search-ecommerce.png" alt="vector-search-ecommerce" width="80%">

Imagine you sell computer hardware. To help shoppers easily find products on your website, you need to have a **user-friendly search bar**. If you’re selling computers and have extensive data on laptops, desktops, and accessories, your search feature should guide customers to the exact device they want - or a **very similar** match needed.

When storing data in Qdrant, each product is a point, consisting of an `id`, a `vector` and `payload`:

```json
{
  "id": 1, 
  "vector": [0.1, 0.2, 0.3, 0.4],
  "payload": {
    "price": 899.99,
    "category": "laptop"
  }
}
```
The `id` is a unique identifier for the point in your collection. The `vector` is a mathematical measure of similarity to other points in the collection. 
Finally, the `payload` holds metadata that directly describes the point.

Though we may not be able to decipher the vector, we are able to derive additional information about the item from its metadata, In this specific case, **we are looking at a laptop that costs $899.99**. 

## What is Filtering?

When searching for the perfect computer, your customers may end up with results that are mathematically similar to the search entry, but not exact. For example, if they are searching for **laptops under $1000**, a simple vector search might still show laptops over $1000. 

This is why semantic search alone **may not be enough**. In order to get the exact result, you would need to enforce a payload filter on `price`. Only then can you be sure that the search results abide by the chosen characteristic.

> This is called **filtering** and it is the most important feature of vector databases. 

Here is how a **filtered vector search** looks behind the scenes:

<img src="/articles_data/guide-filtering/vector-search-filtering.png" alt="vector-search-ecommerce" width="80%">

## What you will learn in this guide:

![guide-filtering-vector-search](/articles_data/guide-filtering/scanning-lens.png)

In vector search, the processes of filtering and sorting aren't as straightforward as they are in traditional databases, where you might use SQL commands like `WHERE` and `ORDER BY`.

Most people use default settings and build vector search apps that aren't properly configured or even setup for precise retrieval. In this guide, we will show you how to **use filtering to get the most out of vector search** with some basic and advanced strategies that are easy to implement. 

- With filtering, you can **dramatically increase search precision**. 
- You can use filtering for resource control and **reduce compute use**. 

On its own, semantic searching over terabytes of data can take up lots of RAM. [**Filtering**](/documentation/concepts/filtering/) and [**Indexing**](/documentation/concepts/indexing/) are two easy strategies to reduce your compute usage and still get the best results. Remember, this is only a guide. For an exhaustive list of filtering options, you should read the [filtering documentation](/documentation/concepts/filtering/). 

## How Filtering Works in Qdrant

Let's take a look at this **3-stage diagram**. In this case, we are trying to find the nearest neighbour to the query vector **(green)**. Your search journey starts at the bottom **(orange)**.

By default, Qdrant connects all your data points within the [**Vector Index**](/documentation/concepts/indexing/). After you [**Introduce Filters**](/documentation/concepts/filtering/), some data points become disconnected. Vector search can't cross the grayed out area and it won't reach the nearest neighbor. 
How can we bridge this gap? 

![filterable-vector-index](/articles_data/guide-filtering/filterable-vector-index.png)

[**Filterable Vector Index**](/documentation/concepts/indexing/): This innovative technology builds additional links **(orange)** between leftover data points. The filtered points which stay behind are now traversible once again. Qdrant uses special category-based methods to connect these data points. 

#### What Happens If You Don't Use Filtering?

If you rely on the default **Vector Index**, Qdrant will have to search the collection by travelling through the entire index. It will have to calculate vector similarities and against each vector and filter every payload in the collection. This can get progressively slower as your dataset grows and the compute requirement will always be increasing.

## Basic Filtering Example

Let's add five new laptops to your online store. Here is a sample input:

```python
laptops = [
    (1, [0.1, 0.2, 0.3, 0.4], {"price": 899.99, "category": "laptop"}),
    (2, [0.2, 0.3, 0.4, 0.5], {"price": 1299.99, "category": "laptop"}),
    (3, [0.3, 0.4, 0.5, 0.6], {"price": 799.99, "category": "laptop"}),
    (4, [0.4, 0.5, 0.6, 0.7], {"price": 1099.99, "category": "laptop"}),
    (5, [0.5, 0.6, 0.7, 0.8], {"price": 1149.99, "category": "laptop"})
]
```

The four-dimensional vector can represent features like laptop CPU, RAM or battery life, but that isn’t specified. The payload, however, specifies the exact price and product category.

**Figure 1:** After you **store data** in Qdrant, the $1000 price **filter** is applied, narrowing down the selection of laptops. Then, a vector search finds the top 2 relevant **results** within this filtered set.

![filtering-vector-search](/articles_data/guide-filtering/filtering-vector-search.png)

When a price filter of $1000 is applied, vector search returns the following top 2 results:

```python
[
  {
    "id": 3,
    "score": 0.9978443564622781,
    "payload": {
      "price": 799.99,
      "category": "laptop"
    }
  },
  {
    "id": 1,
    "score": 0.9938079894227599,
    "payload": {
      "price": 899.99,
      "category": "laptop"
    }
  }
]
```
## Creative Uses for Filters

You can use filters to retrieve data points without knowing their `id`. You can search through data and manage it, solely by using filters. Let's take a look at some creative uses of filters:

|||
|-|-|
| Delete Points | Deletes all points that match the specified filter.|
| Scroll Points | Lists all points that match the specified filter.|
| Order Points | Lists all points, sorted by the specified filter.|
| Count Points | Totals the number of points that match the specified filter.|
| Set Payload | Adds payload fields to all points that match the specified filter.|
| Update Payload | Update payload fields for all points that match the specified filter.|
| Delete Payload | Delete payload fields for all points that match the specified filter.|

### Scrolling 


### Pagination

When you're implementing pagination in filtered queries, indexing becomes even more critical. When paginating results, you often need to exclude items you've already seen. This is typically managed by applying filters that specify which IDs should not be included in the next set of results. 

However, an interesting aspect of Qdrant's data model is that a single point can have multiple values for the same field, such as different color options for a product. This means that during filtering, an ID might appear multiple times if it matches on different values of the same field. 

Proper indexing ensures that these queries are efficient, preventing duplicate results and making pagination smoother.


## Advanced Filtering Examples

Let's take a look at two MacBooks. Both have the MagSafe Charger, but the Air is missing a Touch Bar. How can the shopper find a laptop with the addition feature?

```json
[
  {
    "id": 1,
    "laptop": "MacBook Pro",
    "specs": [
      { "feature": "Touch Bar", "has": true },
      { "feature": "MagSafe Charger", "has": true }
    ]
  },
  {
    "id": 2,
    "laptop": "Macbook Air",
    "specs": [
      { "feature": "Touch Bar", "has": false },
      { "feature": "MagSafe Charger", "has": true }
    ]
  }
]
```
We would need to structure our query using a **nested filter**: 
```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            {
                "key": "specs[].feature",
                "match": {
                    "value": "Touch Bar"
                }
            },
            {
                "key": "specs[].has",
                "match": {
                    "value": true
                }
            }
        ]
    }
}
```

## Filtering With the Payload Index

When you start working with Qdrant, your data is by default organized in a vector index. 
In addition to this, we recommend adding a secondary data structure - **the payload index**. 

Just how the vector index organizes vectors, the payload index will structure your metadata.

![payload-index-vector-search](/articles_data/guide-filtering/payload-index-vector-search.png)

Here is how you can create a single index for a metadata field "category":

```http
PUT /collections/computers/index
{
    "field_name": "category",
    "field_schema": "keyword"
}
```
```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.create_payload_index(
   collection_name="computers",
   field_name="category",
   field_schema="keyword",
)
```
Once you mark a field indexable, **you don't need to do anything else**. Qdrant will handle all optimizations in the background.

#### Why should you index metadata?

![payload-index-filtering](/articles_data/guide-filtering/payload-index-filtering.png)

The payload index acts as a secondary data structure that speeds up retrieval. Whenever you run vector search with a filter, Qdrant will consult a payload index - if there is one. 

> If you are indexing your metadata, the difference in search performance can be dramatic. 

As your dataset grows in complexity, Qdrant takes up additional resources to go through all data points. Without a proper data structure, the search can take longer - or run out of resources.

## Payload Index Basics

A payload index is similar to conventional document-oriented databases. It connects metadata fields with their corresponding point id’s for quick retrieval. 

In this example, you are indexing all of your computer hardware inside of the `computers` collection. Let’s take a look at a sample payload index for the field `category`. 

```json
Payload Index by keyword:
+------------+-------------+
| category   | id          |
+------------+-------------+
| laptop     | 1, 4, 7     |
| desktop    | 2, 5, 9     |
| speakers   | 3, 6, 8     |
| keyboard   | 10, 11      |
+------------+-------------+
```
When fields are properly indexed, the search engine roughly knows where it can start its journey. It can start looking up points that contain relevant metadata, and it doesn’t need to scan the entire dataset. This reduces the engine’s workload by a lot. As a result, query results are faster and the system can easily scale.

> You may create as many payload indexes as you want, and we recommend you do so for each field that is frequently used. 

If your users are often filtering by **laptop** when looking up a product **category**, indexing all computer metadata will speed up retrieval and make the results more precise.

### Different Types of Payload Indexes

There are five types of payload indexes:

| Index Type          | Description                                                                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| Full-text Index     | Enables efficient text search in large datasets.                                                                                                      |
| Tenant Index        | For data isolation and retrieval efficiency in multi-tenant architectures.                                                                            |
| Principal Index     | Manages data based on primary entities like users or accounts.                                                                                        |
| On-Disk Index       | Stores indexes on disk to manage large datasets without memory usage.                                                                                 |
| Parameterized Index | Allows for dynamic querying, where the index can adapt based on different parameters or conditions provided by the user. Useful for numeric data like prices or timestamps. |


























## Best Practices: Filtering and Indexing
![stepping-lens](/articles_data/guide-filtering/stepping-lens.png)

### Use Collections Efficiently
Some applications need to have data segregated, whereby different users need to see different data inside of the same program. When setting up storage for such a complex application, many users think they need multiple databases for segregated users.    

We see this quite often. Users very frequently make the mistake of creating a separate collection for each tenant inside of the same cluster. This can quickly exhaust the cluster’s resources. Running vector search through too many collections can start using up too much RAM. You may start seeing out-of-memory (OOM) errors and degraded performance. 

To mitigate this, we offer extensive support for multitenant systems, so that you can build an entire global application in one single Qdrant collection. 

#### How to setup the tenant index 

The best way to continue using the same collection is to separate it by tenants.

The tenant index is another variant of the payload index. When creating or updating a collection, you can mark a metadata field as indexable. This time, the request will specify the field as a tenant. This means that you can mark various user types and customer id’s as “is_tenant”: true. 

```http
PUT /collections/{collection_name}/index
{
   "field_name": "payload_field_name",
   "field_schema": {
       "type": "keyword",
       "is_tenant": true
   }
}
```

You should consider strategies like merging related data within shared collections and using payload filters to optimize resource usage while maintaining the necessary data isolation for each tenant.


### Filtering with float-point (decimal) numbers
If you filter by the float data type, your search precision may be limited and inaccurate. 

Float Datatype numbers have a decimal point and are 64 bits in size. Here is an example:

```json
{
   "price": 11.99
}
```

When you filter for a specific float number, such as 11.99, you may get a different result, like 11.98 or 12.00. With decimals, numbers are rounded differently, so logically identical values may appear different. Unfortunately, searching for exact matches can be unreliable in this case.

To avoid inaccuracies, use a different filtering method. We recommend that you try Range Based Filtering instead of exact matches. This method accounts for minor variations in data, and it boosts performance - especially with large datasets. 

Here is a sample JSON range filter for values greater than or equal to 11.99 and less than or equal to the same number. This will retrieve any values within the range of 11.99, including those with additional decimal places.

```json
{
 "key": "price",
 "range": {
   "gt": null,
   "gte": 11.99,
   "lt": null,
   "lte": 11.99
  }
}
```
## Key Takeaways

![best-practices](/articles_data/guide-filtering/best-practices.png)








Pre-filtering in Qdrant lets you apply conditions to the data before running the vector search. This helps narrow down the dataset based on chosen metadata values. This way, you can optimize the search by focusing only on a subset of relevant vectors.

In pre-filtering, Qdrant first carries out the filtering, and then searches within the filtered subset. This reduces unnecessary computation over a dataset that is potentially much larger.

When you index a specific piece of metadata, you are creating an additional data structure to aid your search process. 