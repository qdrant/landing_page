---
title: "A Complete Guide to Filtering"
short_description: "Merging different search methods to improve the search quality was never easier"
description: "Qdrant 1.10 introduces a new Query API to build a search system that combines different search methods to improve the search quality."
preview_dir: /articles_data/guide-filtering/preview
social_preview_image: /articles_data/guide-filtering/social-preview.png
weight: -200
author: David Myriel
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

#### What Happens If You Don't Use Filtering?

If you don’t use filtering, Qdrant will have to search the collection by travelling through the HNSW index. It will have to calculate vector similarities against each point in the collection. This can get progressively slower as your dataset grows and the compute requirement will always be increasing.

## What you will learn in this guide:

![guide-filtering-vector-search](/articles_data/guide-filtering/scanning-lens.png)

In vector search, the processes of filtering and sorting aren't as straightforward as they are in traditional databases, where you might use SQL commands like `WHERE` and `ORDER BY`.

Most people use default settings and build vector search apps that aren't properly configured or even setup for precise retrieval. In this guide, we will show you how to **use filtering to get the most out of vector search** with some basic and advanced strategies that are easy to implement. 

- With filtering, you can **dramatically increase search precision**. 
- You can use filtering for resource control and **reduce compute use**. 

On its own, semantic searching over terabytes of data can take up lots of RAM. [**Filtering**](/documentation/concepts/filtering/) and [**Indexing**](/documentation/concepts/indexing/) are two easy strategies to reduce your compute usage and still get the best results. Remember, this is only a guide. For an exhaustive list of filtering options, you should read the [filtering documentation](/documentation/concepts/filtering/). 



## Basic Concepts: Pre-Filtering in Vector Search

Pre-filtering in Qdrant lets you apply conditions to the data before running the vector search. This helps narrow down the dataset based on chosen metadata values. This way, you can optimize the search by focusing only on a subset of relevant vectors.

In pre-filtering, Qdrant first carries out the filtering, and then searches within the filtered subset. This reduces unnecessary computation over a dataset that is potentially much larger.

To see how pre-filtering works, let's add five new laptops to your online store. Here is a sample input:

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

**Figure 1:** In pre-filtering, the $1000 **price filter** is applied first, creating a smaller dataset of affordable laptops. Then, a **vector search** finds the most relevant options within this filtered set.

![pre-filtering-vector-search](/articles_data/guide-filtering/pre-filtering-vector-search.png)

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

## Advanced Concepts: HNSW Filtering 












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



## Filtering With the Payload Index

When you index a specific piece of metadata, you are creating an additional data structure to aid your search process. A payload index is similar to conventional document-oriented databases. It connects metadata fields with their corresponding point id’s for quick retrieval. 

Let’s take a look at a sample payload index for “color”: “red”: 

```json
Payload Index by keyword:
+------------+-------------+
| color      | id          |
+------------+-------------+
| red        | 1, 4, 7     |
| blue       | 2, 5, 9     |
| green      | 3, 6, 8     |
| purple     | 10, 11      |
+------------+-------------+
```
You may create as many payload indexes as you want, and we recommend you do so for each field that is frequently used. If your users are often filtering by colors when looking up clothing garments, indexing all color metadata will speed up retrieval and make the results more precise.
Again, we recommend you index every metadata field that is frequently used.

### How to create a payload index
Here is how to add a payload index for the color field to an existing collection: 

```json
client.create_payload_index(
   collection_name="{collection_name}",
   field_name="color",
   field_schema="keyword",
)
```

There are five types of payload indexes:

Full-text index
Enables efficient text search in large datasets.
Tenant Index
For data isolation and retrieval efficiency in multi-tenant architectures.
Principal Index
Manages data based on primary entities like users or accounts.
On-Disk Index
Stores indexes on disk to manage large datasets without memory usage.
Parameterized Index
Allows for dynamic querying, where the index can adapt based on different parameters or conditions provided by the user. This is useful in applications where the query logic may change frequently or need to be tailored to specific situations. If you're filtering by numeric data like prices or timestamps, this can significantly speed up searches by allowing the database to efficiently handle range queries.

….more info

When fields are properly indexed, the search engine roughly knows where it can start its journey. It can start looking up points that contain relevant metadata, and it doesn’t need to scan the entire dataset. This reduces the engine’s workload by a lot. As a result, query results are faster and the system can easily scale.
