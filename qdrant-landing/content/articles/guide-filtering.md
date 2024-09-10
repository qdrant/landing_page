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

Though we may not be able to decipher the vector, we are able to derive additional information about the item from its metadata, In this specific case, **we are looking at a data point for a laptop that costs $899.99**. 

## What is filtering?

When searching for the perfect computer, your customers may end up with results that are mathematically similar to the search entry, but not exact. For example, if they are searching for **laptops under $1000**, a simple vector search without constraints might still show laptops over $1000. 

This is why semantic search alone **may not be enough**. In order to get the exact result, you would need to enforce a payload filter on the `price`. Only then can you be sure that the search results abide by the chosen characteristic.

> This is called **filtering** and it is the most important feature of vector databases. 

Here is how a **filtered vector search** looks behind the scenes. We'll cover its mechanics in the following section.

<img src="/articles_data/guide-filtering/vector-search-filtering.png" alt="vector-search-ecommerce" width="80%">

The filtered result is a combination of the semantic search and the filtering conditions imposed upon the query.

#### What happens if you don't use filtering?

If you rely on **searching for the nearest vector**, Qdrant will have to go through the entire vector index in the collection. It will have to calculate vector similarities and against each vector and filter every payload in the collection. This can get progressively slower as your dataset grows and the compute requirement will always be increasing.

## What you will learn in this guide:

![guide-filtering-vector-search](/articles_data/guide-filtering/scanning-lens.png)

In vector search, the processes of filtering and sorting aren't as straightforward as they are in traditional databases, where you might use SQL commands like `WHERE` and `ORDER BY`.

Most people use default settings and build vector search apps that aren't properly configured or even setup for precise retrieval. In this guide, we will show you how to **use filtering to get the most out of vector search** with some basic and advanced strategies that are easy to implement. 

- With filtering, you can **dramatically increase search precision**. 
- You can use filtering for resource control and **reduce compute use**. 

The easiest way to reach that "Hello World" moment is to **try filtering in a live cluster**. Our [**Cloud Quickstart**](/documentation/quickstart-cloud/) tutorial will show you how to create a cluster, add data and try some filtering clauses. 

**Qdrant's Web UI dashboard** can helps you visualize all of the exercises in this guide: 

![qdrant-filtering-tutorial](/articles_data/guide-filtering/qdrant-filtering-tutorial.png)

## Qdrant's innovative filtering technology

Let's take a look at this **3-stage diagram**. In this case, we are trying to find the nearest neighbour to the query vector **(green)**. Your search journey starts at the bottom **(orange)**.

By default, Qdrant connects all your data points within the [**vector index**](/documentation/concepts/indexing/). After you [**introduce filters**](/documentation/concepts/filtering/), some data points become disconnected. Vector search can't cross the grayed out area and it won't reach the nearest neighbor. 
How can we bridge this gap? 

![filterable-vector-index](/articles_data/guide-filtering/filterable-vector-index.png)

[**Filterable vector index**](/documentation/concepts/indexing/): This innovative technology builds additional links **(orange)** between leftover data points. The filtered points which stay behind are now traversible once again. Qdrant uses special category-based methods to connect these data points. 

### Qdrant's approach vs traditional filtering methods

![stepping-lens](/articles_data/guide-filtering/stepping-lens.png)

The filterable vector index is Qdrant's solves pre and post-filtering problems by adding specialized links to the search graph. It aims to maintain the speed advantages of vector search while allowing for precise filtering, addressing the inefficiencies that can occur when applying filters after the vector search.

#### Pre-filtering reduces your search options
In pre-filtering, a search engine first narrows down the dataset based on chosen metadata values, and then searches within that filtered subset. This reduces unnecessary computation over a dataset that is potentially much larger.

> If the filters are too restrictive, you might exclude potentially relevant results too early in the process. When the semantic search process begins, it won’t be able to retrieve the pre-excluded data points. 

**Figure 1:** We start with five products with different prices. First, the $1000 price **filter** is applied, narrowing down the selection of laptops. Then, a vector search finds the relevant **results** within this filtered set. Unfortunately, one result is missed. 

![pre-filtering-vector-search](/articles_data/guide-filtering/pre-filtering.png)

These issues become more pronounced when dealing with HNSW graph structures, where pre-filtering can disrupt the connections within the graph, leading to fragmented search paths. 

#### Post-filtering wastes good search results
In post-filtering, a search engine first looks for similar vectors and retrieves a larger set of results. Then, it applies filters to those results based on metadata. The problem with post-filtering becomes apparent when using low-cardinality filters. 

> When you apply a low-cardinality filter after performing a vector search, you often end up discarding a large portion of the results that the vector search returned.  

**Figure 2:** In the same example, we have five laptops. First, the vector search finds the relevant **results**, but they may not meet the price match. When the $1000 price **filter** is applied, two other potential results are discarded.

![post-filtering-vector-search](/articles_data/guide-filtering/post-filtering.png)

The system will waste computational resources by first finding similar vectors and then discarding many that don't meet the filter criteria. You're also limited to filtering only from the initial set of vector search results. If your desired items aren't in this initial set, you won't find them, even if they exist in the database.

## Basic filtering example

We know that there are three possible laptops that suit our price point. 
Let's see how Qdrant's filterable vector index works and why it is the best method of capturing all available results.  

First, add five new laptops to your online store. Here is a sample input:

```python
laptops = [
    (1, [0.1, 0.2, 0.3, 0.4], {"price": 899.99, "category": "laptop"}),
    (2, [0.2, 0.3, 0.4, 0.5], {"price": 1299.99, "category": "laptop"}),
    (3, [0.3, 0.4, 0.5, 0.6], {"price": 799.99, "category": "laptop"}),
    (4, [0.4, 0.5, 0.6, 0.7], {"price": 1099.99, "category": "laptop"}),
    (5, [0.5, 0.6, 0.7, 0.8], {"price": 949.99, "category": "laptop"})
]
```

The four-dimensional vector can represent features like laptop CPU, RAM or battery life, but that isn’t specified. The payload, however, specifies the exact price and product category.

Now, set the filter to "price is less than $1000":

```http
{
  "key": "price",
  "range": {
    "gt": null,
    "gte": null,
    "lt": 1000,
    "lte": null
  }
}
```

When a price filter of < $1000 is applied, vector search returns the following results:

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
  },
  {
    "id": 5,
    "score": 0.9903751498208603,
    "payload": {
      "price": 949.99,
      "category": "laptop"
    }
  }
]
```

The simultaneous filtering method has the greatest chance of capturing all possible search results. 

This specific example uses the `range` condition for filtering. Qdrant, however, offers many other possible ways to structure a filter

> For detailed usage examples, read Qdrant's [Filtering](/documentation/concepts/filtering/) documentation. 

#### Available filtering conditions

| **Condition**         | **Usage**                                | **Condition**         | **Usage**                                |
|-----------------------|------------------------------------------|-----------------------|------------------------------------------|
| **Match**             | Exact value match.                       | **Range**             | Filter by value range.                   |
| **Match Any**         | Match multiple values.                   | **Datetime Range**    | Filter by date range.                    |
| **Match Except**      | Exclude specific values.                 | **UUID Match**        | Filter by unique ID.                     |
| **Nested Key**        | Filter by nested data.                   | **Geo**               | Filter by location.                      |
| **Nested Object**     | Filter by nested objects.                | **Values Count**      | Filter by element count.                 |
| **Full Text Match**   | Search in text fields.                   | **Is Empty**          | Filter empty fields.                     |
| **Has ID**            | Filter by unique ID.                     | **Is Null**           | Filter null values.                      |

#### Filtering clauses to remember

| **Clause**          | **Description**                                       | **Clause**          | **Description**                                       |
|---------------------|-------------------------------------------------------|---------------------|-------------------------------------------------------|
| **Must**            | Includes items that meet the condition. | **Should**          | Filters if at least one condition is met (similar to **OR**). |
| **Must Not**        | Excludes items that meet the condition.               | **Clauses Combination** | Combines multiple clauses to refine filterin (similar to **AND**).        |

## Advanced filtering examples

We can also use nested filtering to query arrays of objects within the payload. In this example, we have two points. They each represent a dinosaur with a list of food preferences (diet) that indicate what type of food they like or dislike:

```json
[
  {
    "id": 1,
    "dinosaur": "t-rex",
    "diet": [
      { "food": "leaves", "likes": false},
      { "food": "meat", "likes": true}
    ]
  },
  {
    "id": 2,
    "dinosaur": "diplodocus",
    "diet": [
      { "food": "leaves", "likes": true},
      { "food": "meat", "likes": false}
    ]
  }
]
```
To ensure that both conditions are applied to the same array element (e.g., food = meat and likes = true must refer to the same diet item), you need to use a nested filter.

Nested filters are used to apply conditions within an array of objects. They ensure that the conditions are evaluated per array element, rather than across all elements.

```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            {
                "key": "diet[].food",
                  "match": {
                    "value": "meat"
                }
            },
            {
                "key": "diet[].likes",
                  "match": {
                    "value": true
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="diet[].food", match=models.MatchValue(value="meat")
            ),
            models.FieldCondition(
                key="diet[].likes", match=models.MatchValue(value=True)
            ),
        ],
    ),
)
```

```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "diet[].food",
        match: { value: "meat" },
      },
      {
        key: "diet[].likes",
        match: { value: true },
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
            Condition::matches("diet[].food", "meat".to_string()),
            Condition::matches("diet[].likes", true),
        ])),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addAllMust(
                        List.of(matchKeyword("diet[].food", "meat"), match("diet[].likes", true)))
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("diet[].food", "meat") & Match("diet[].likes", true)
);
```

This happens because both points are matching the two conditions:

- the "t-rex" matches food=meat on `diet[1].food` and likes=true on `diet[1].likes`
- the "diplodocus" matches food=meat on `diet[1].food` and likes=true on `diet[0].likes`

To retrieve only the points where the conditions apply to a specific element within an array (such as the point with id 1 in this example), you need to use a nested object filter.

Nested object filters enable querying arrays of objects independently, ensuring conditions are checked within individual array elements.

This is done by using the `nested` condition type, which consists of a payload key that targets an array and a filter to apply. The key should reference an array of objects and can be written with or without bracket notation (e.g., "data" or "data[]").

```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [{
            "nested": {
                "key": "diet",
                "filter":{
                    "must": [
                        {
                            "key": "food",
                            "match": {
                                "value": "meat"
                            }
                        },
                        {
                            "key": "likes",
                            "match": {
                                "value": true
                            }
                        }
                    ]
                }
            }
        }]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="diet",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="food", match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes", match=models.MatchValue(value=True)
                            ),
                        ]
                    ),
                )
            )
        ],
    ),
)
```

```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        nested: {
          key: "diet",
          filter: {
            must: [
              {
                key: "food",
                match: { value: "meat" },
              },
              {
                key: "likes",
                match: { value: true },
              },
            ],
          },
        },
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, NestedCondition, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([NestedCondition {
            key: "diet".to_string(),
            filter: Some(Filter::must([
                Condition::matches("food", "meat".to_string()),
                Condition::matches("likes", true),
            ])),
        }
        .into()])),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ConditionFactory.nested;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(
                        nested(
                            "diet",
                            Filter.newBuilder()
                                .addAllMust(
                                    List.of(
                                        matchKeyword("food", "meat"), match("likes", true)))
                                .build()))
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: Nested("diet", MatchKeyword("food", "meat") & Match("likes", true))
);
```

The matching logic is adjusted to operate at the level of individual elements within an array in the payload.

Nested filters function as though each element of the array is evaluated separately. The parent document will be considered a match if at least one array element satisfies the nested filter conditions.

**Note:** The `has_id` condition is not supported within the nested object filter. If you need it, place it in an adjacent `must` clause.

```http
POST /collections/{collection_name}/points/scroll
{
   "filter":{
      "must":[
         {
            "nested":{
               "key":"diet",
               "filter":{
                  "must":[
                     {
                        "key":"food",
                        "match":{
                           "value":"meat"
                        }
                     },
                     {
                        "key":"likes",
                        "match":{
                           "value":true
                        }
                     }
                  ]
               }
            }
         },
         {
            "has_id":[
               1
            ]
         }
      ]
   }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="diet",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="food", match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes", match=models.MatchValue(value=True)
                            ),
                        ]
                    ),
                )
            ),
            models.HasIdCondition(has_id=[1]),
        ],
    ),
)
```

```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        nested: {
          key: "diet",
          filter: {
            must: [
              {
                key: "food",
                match: { value: "meat" },
              },
              {
                key: "likes",
                match: { value: true },
              },
            ],
          },
        },
      },
      {
        has_id: [1],
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, NestedCondition, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
            NestedCondition {
                key: "diet".to_string(),
                filter: Some(Filter::must([
                    Condition::matches("food", "meat".to_string()),
                    Condition::matches("likes", true),
                ])),
            }
            .into(),
            Condition::has_id([1]),
        ])),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ConditionFactory.nested;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(
                        nested(
                            "diet",
                            Filter.newBuilder()
                                .addAllMust(
                                    List.of(
                                        matchKeyword("food", "meat"), match("likes", true)))
                                .build()))
                    .addMust(hasId(id(1)))
                    .build())
            .build())
    .get();
```


```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: Nested("diet", MatchKeyword("food", "meat") & Match("likes", true)) & HasId(1)
);
```
## Other creative uses for filters

You can use filters to retrieve data points without knowing their `id`. You can search through data and manage it, solely by using filters. Let's take a look at some creative uses for filters:

| Action | Description | Action | Description |
|--------|-------------|--------|-------------|
| [Delete Points](/documentation/concepts/points/#delete-points) | Deletes all points matching the filter. | [Set Payload](/documentation/concepts/payload/#set-payload) | Adds payload fields to all points matching the filter. |
| [Scroll Points](/documentation/concepts/points/#scroll-points) | Lists all points matching the filter. | [Update Payload](/documentation/concepts/payload/#overwrite-payload) | Updates payload fields for points matching the filter. |
| [Order Points](/documentation/concepts/points/#order-points-by-payload-key) | Lists all points, sorted by the filter. | [Delete Payload](/documentation/concepts/payload/#delete-payload-keys) | Deletes fields for points matching the filter. |
| [Count Points](/documentation/concepts/points/#counting-points) | Totals the points matching the filter. | | |

### Scrolling instead of searching

In Qdrant, scrolling is used to iteratively retrieve large sets of points from a collection. It is particularly useful when you’re dealing with a large number of points and don’t want to load them all at once. Instead, Qdrant provides a way to scroll through the points in chunks or batches.

You start by sending a scroll request to Qdrant with specific conditions like filtering by payload, vector search, or other criteria.

```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    },
    "limit": 1,
    "with_payload": true,
    "with_vector": false
}
```
The response contains a batch of points that match the criteria and a reference (offset or next page token) to retrieve the next set of points.

Scrolling is designed to be efficient, especially when working with large datasets, because it minimizes the load on the server and reduces memory consumption on the client side by returning only manageable chunks of data at a time.

## Real-life use cases of filtering

Filtering in a vector database like Qdrant can significantly enhance search capabilities by enabling more precise and efficient retrieval of data. Here are some real-life use cases where filtering is crucial:

| **Use Case**                         | **Vector Search**                                                | **Filtering**                                                           |
|--------------------------------------|------------------------------------------------------------------|-------------------------------------------------------------------------|
| **E-Commerce Product Search**        | Search for products by style or visual similarity                | Filter by price, color, brand, size, ratings                            |
| **Recommendation Systems**           | Recommend similar content (e.g., movies, songs)                  | Filter by release date, genre, etc. (e.g., movies after 2020)           |
| **Healthcare Diagnostics**           | Search for similar medical images                                | Filter by age, condition (e.g., patients over 50)                       |
| **Geospatial Search in Ride-Sharing**| Find nearby drivers or delivery partners                         | Filter by rating, distance, vehicle type                                |
| **Fraud Detection**                  | Detect transactions similar to known fraud cases                 | Filter by amount, time, location                                        |


## Filtering with the payload index

When you start working with Qdrant, your data is by default organized in a vector index. 
In addition to this, we recommend adding a secondary data structure - **the payload index**. 

Just how the vector index organizes vectors, the payload index will structure your metadata.

**Figure 4:** The payload index is an additional data structure that supports vector search. A payload index (in green) organizes candidate results by cardinality, so that semantic search (in red) can traverse the vector index quickly.

![payload-index-vector-search](/articles_data/guide-filtering/payload-index-vector-search.png)

On its own, semantic searching over terabytes of data can take up lots of RAM. [**Filtering**](/documentation/concepts/filtering/) and [**Indexing**](/documentation/concepts/indexing/) are two easy strategies to reduce your compute usage and still get the best results. Remember, this is only a guide. For an exhaustive list of filtering options, you should read the [filtering documentation](/documentation/concepts/filtering/). 

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

## How does the payload index look?

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

#### Different types of payload indexes

| Index Type          | Description                                                                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Full-text Index](/documentation/concepts/indexing/#full-text-index)     | Enables efficient text search in large datasets.                                                                                                      |
| [Tenant Index](/documentation/concepts/indexing/#tenant-index)        | For data isolation and retrieval efficiency in multi-tenant architectures.                                                                            |
| [Principal Index](/documentation/concepts/indexing/#principal-index)     | Manages data based on primary entities like users or accounts.                                                                                        |
|[On-Disk Index](/documentation/concepts/indexing/#on-disk-payload-index)       | Stores indexes on disk to manage large datasets without memory usage.                                                                                 |
| [Parameterized Index](/documentation/concepts/indexing/#parameterized-index) | Allows for dynamic querying, where the index can adapt based on different parameters or conditions provided by the user. Useful for numeric data like prices or timestamps. |


### Indexing payloads in multitenant setups

Some applications need to have data segregated, whereby different users need to see different data inside of the same program. When setting up storage for such a complex application, many users think they need multiple databases for segregated users.    

We see this quite often. Users very frequently make the mistake of creating a separate collection for each tenant inside of the same cluster. This can quickly exhaust the cluster’s resources. Running vector search through too many collections can start using up too much RAM. You may start seeing out-of-memory (OOM) errors and degraded performance. 

To mitigate this, we offer extensive support for multitenant systems, so that you can build an entire global application in one single Qdrant collection. 

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
The tenant index is another variant of the payload index. When creating or updating a collection, you can mark a metadata field as indexable. This time, the request will specify the field as a tenant. This means that you can mark various user types and customer id’s as `is_tenant`: true. 

## Key takeaways in filtering and indexing
![best-practices](/articles_data/guide-filtering/best-practices.png)

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

### Working with pagination in queries

When you're implementing pagination in filtered queries, indexing becomes even more critical. When paginating results, you often need to exclude items you've already seen. This is typically managed by applying filters that specify which IDs should not be included in the next set of results. 

However, an interesting aspect of Qdrant's data model is that a single point can have multiple values for the same field, such as different color options for a product. This means that during filtering, an ID might appear multiple times if it matches on different values of the same field. 

Proper indexing ensures that these queries are efficient, preventing duplicate results and making pagination smoother.
