---
title: "A Complete Guide to Filtering in Vector Search"
short_description: "Apply payload filters, build payload indexes, and combine conditions to narrow Qdrant search results to the right data."
description: "Learn how Qdrant filters vector search, which payload fields to index and when, and when to turn on ACORN for strict filter combinations."
preview_dir: /articles_data/vector-search-filtering/preview
social_preview_image: /articles_data/vector-search-filtering/preview/social_preview.jpg
weight: 30
author: Sabrina Aquino, David Myriel
author_link: 
date: 2024-09-10T00:00:00.000Z
aliases:
  - /articles/vector-search-filtering/
---

# A Complete Guide to Filtering in Vector Search

Imagine you sell computer hardware. To help shoppers find products on your website, you need a search that understands what they mean and also respects hard constraints like price.

![vector-search-ecommerce](/articles_data/vector-search-filtering/vector-search-ecommerce.png)

If you sell laptops, desktops, and accessories, your search should guide customers to the exact device they want, or at least a **very similar** match.

When storing data in Qdrant, each product is a point, consisting of an `id`, a `vector`, and a `payload`:

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

The `id` identifies the point in your collection. The `vector` represents the item so that similar items have similar vectors. The `payload` holds metadata that directly describes the point: in this case, a laptop that costs $899.99.

## What Is Filtering?

Shoppers often search with constraints. A customer looking for **laptops under $1000** wants similar laptops, but a plain [vector search](/advanced-search/) without constraints can still return laptops over $1000.

To guarantee that every result meets the constraint, you add a payload filter on `price`. This is **filtering**, and Qdrant applies it during the vector search itself.

Here is a filtered vector search with the [Query API](/documentation/search/search/):

```http
POST /collections/online_store/points/query
{
  "query": [0.2, 0.1, 0.9, 0.7],
  "filter": {
    "must": [
      { "key": "category", "match": { "value": "laptop" } },
      { "key": "price", "range": { "lte": 1000 } }
    ]
  },
  "limit": 3,
  "with_payload": true
}
```

Filtering does two things for you:

1. It makes results **precise**: every result satisfies the conditions you set.
2. With the right [payload indexes](#what-to-index-and-when), it keeps filtered search **fast** as your collection grows.

This guide covers how Qdrant filters, which fields to index and when, how the query planner picks a strategy, and when to turn on ACORN. For the full list of filter conditions and their syntax, see the [filtering documentation](/documentation/search/filtering/).

## Filter Before, After, or During the Search

![stepping-lens](/articles_data/vector-search-filtering/stepping-lens.png)

There are two traditional ways to combine a filter with vector search, and both have a cost.

- **Post-filtering** runs the vector search first and then drops results that fail the filter. If many of the top results fail, you get fewer results than you asked for, and matching items further down the ranking never come back.
- **Pre-filtering** applies the filter first and then compares the query with every matching point. Results are exact, but scoring every match is expensive when many points pass the filter.

The diagram uses the laptops from the [basic example](#basic-filtering-example-ecommerce-and-laptops), ranked by similarity to the query vector `[0.2, 0.1, 0.9, 0.7]`.

{{< island path="content/documentation/headless/search-patterns/filter-order" ratio="700 / 286" title="Post-filtering takes the top 3 and then applies the price filter, so one of the three slots is lost. Pre-filtering applies the filter first and scores only the matches, so all three results fit the filter." >}}
![Post-filtering returns two of three results; pre-filtering returns three](/articles_data/vector-search-filtering/filter-order.svg)
{{< /island >}}

Qdrant avoids both trade-offs. It filters **during** the search: its query planner either scores the matching points directly, which is pre-filtering, when few points match, or searches the HNSW graph while skipping points that fail the filter. To keep that graph walk from getting stuck, Qdrant builds a **filterable HNSW index**: extra edges between points that share a value of an indexed payload field. When a single field's edges are not enough, [ACORN](#when-to-use-acorn) can step through filtered-out neighbors at search time.

{{< island path="content/articles/headless/filtered-vector-search-acorn/repairs" ratio="19 / 11" title="The same graph, repaired two ways. ACORN steps through filtered-out neighbors at search time; filterable HNSW adds extra edges at index time that a filtered query can walk directly. The graph is a toy; the traversals are computed on it." >}}
![The same graph, repaired two ways](/articles_data/filtered-vector-search-acorn/two-repairs.svg)
{{< /island >}}

## Basic Filtering Example: Ecommerce and Laptops

Add five laptops to the `online_store` collection, using cosine distance:

```python
laptops = [
    (1, [0.1, 0.2, 0.3, 0.4], {"price": 899.99, "category": "laptop"}),
    (2, [0.2, 0.3, 0.4, 0.5], {"price": 1299.99, "category": "laptop"}),
    (3, [0.3, 0.4, 0.5, 0.6], {"price": 799.99, "category": "laptop"}),
    (4, [0.4, 0.5, 0.6, 0.7], {"price": 1099.99, "category": "laptop"}),
    (5, [0.5, 0.6, 0.7, 0.8], {"price": 949.99, "category": "laptop"})
]
```

The four-dimensional vectors stand in for real embeddings. The payload specifies the exact price and product category.

Run the filtered query from the [previous section](#what-is-filtering): the query vector `[0.2, 0.1, 0.9, 0.7]` with a filter of `category` is `laptop` and `price` at most $1000. Qdrant returns the three laptops under $1000, ranked by similarity:

```json
[
  { "id": 1, "score": 0.9271, "payload": { "price": 899.99, "category": "laptop" } },
  { "id": 3, "score": 0.9002, "payload": { "price": 799.99, "category": "laptop" } },
  { "id": 5, "score": 0.8808, "payload": { "price": 949.99, "category": "laptop" } }
]
```

Without the filter, laptop 2, which costs $1299.99, would rank second. The filter keeps it out without costing you a result.

This example uses the `range` condition. Qdrant offers many other conditions, including `match`, `match_any`, `match_except`, nested keys, geo, `values_count`, `is_empty`, `is_null`, and `has_id`. You combine them with the `must`, `should`, and `must_not` clauses. The [filtering documentation](/documentation/search/filtering/) covers each one with examples.

### Listing Matches with Scroll

If you only need the points that match a filter, without ranking by similarity, use the [`scroll` API](/documentation/manage-data/points/#scroll-points). It returns matching points one page at a time.

To list laptops ordered by price, first create a payload index on `price` that supports range queries. Ordering by a payload key requires one, and Qdrant rejects `order_by` on a field without it:

```http
PUT /collections/online_store/index
{
    "field_name": "price",
    "field_schema": "float"
}
```

Then scroll with `order_by`:

```http
POST /collections/online_store/points/scroll
{
    "filter": {
        "must": [
            { "key": "category", "match": { "value": "laptop" } }
        ]
    },
    "limit": 10,
    "with_payload": true,
    "order_by": { "key": "price" }
}
```

The response lists the laptops from $799.99 to $1299.99. When you use `order_by`, Qdrant does not return a `next_page_offset`, because an ID offset cannot page through non-unique values. To page through ordered results, see [ordering points by payload key](/documentation/manage-data/points/#order-points-by-payload-key). Without `order_by`, use the `next_page_offset` from each response as the `offset` of the next request.

## Advanced Filtering Example: Dinosaur Diets

![advanced-payload-filtering](/articles_data/vector-search-filtering/advanced-payload-filtering.png)

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
To ensure that both conditions are applied to the same array element (for example, food = meat and likes = true must refer to the same diet item), you need to use a nested filter.

Nested filters are used to apply conditions within an array of objects. They ensure that the conditions are evaluated per array element, rather than across all elements.

```http
POST /collections/dinosaurs/points/scroll
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
    collection_name="dinosaurs",
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

This happens because both points are matching the two conditions:

- the "t-rex" matches food=meat on `diet[1].food` and likes=true on `diet[1].likes`
- the "diplodocus" matches food=meat on `diet[1].food` and likes=true on `diet[0].likes`

To retrieve only the points where the conditions apply to a specific element within an array (such as the point with id 1 in this example), you need to use a nested object filter.

Nested object filters enable querying arrays of objects independently, ensuring conditions are checked within individual array elements.

This is done by using the `nested` condition type, which consists of a payload key that targets an array and a filter to apply. The key should reference an array of objects and can be written with or without bracket notation, such as "data" or "data[]".

```http
POST /collections/dinosaurs/points/scroll
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
    collection_name="dinosaurs",
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

The matching logic is adjusted to operate at the level of individual elements within an array in the payload, rather than on all array elements together.

Nested filters function as though each element of the array is evaluated separately. The parent document will be considered a match if at least one array element satisfies all the nested filter conditions.

For the same filters in TypeScript, Rust, Java, C#, and Go, see [nested key](/documentation/search/filtering/#nested-key) and [nested object filter](/documentation/search/filtering/#nested-object-filter) in the filtering documentation.

## Other Creative Uses for Filters

You can use filters to retrieve data points without knowing their `id`. You can search through data and manage it, solely by using filters. Let's take a look at some creative uses for filters:

| Action | Description | Action | Description |
|--------|-------------|--------|-------------|
| [Delete Points](/documentation/manage-data/points/#delete-points) | Deletes all points matching the filter. | [Set Payload](/documentation/manage-data/payload/#set-payload) | Adds payload fields to all points matching the filter. |
| [Scroll Points](/documentation/manage-data/points/#scroll-points) | Lists all points matching the filter. | [Update Payload](/documentation/manage-data/payload/#overwrite-payload) | Updates payload fields for points matching the filter. |
| [Order Points](/documentation/manage-data/points/#order-points-by-payload-key) | Lists all points, sorted by the filter. | [Delete Payload](/documentation/manage-data/payload/#delete-payload-keys) | Deletes fields for points matching the filter. |
| [Count Points](/documentation/manage-data/points/#counting-points) | Totals the points matching the filter. | | |

## What to Index and When

![payload-index-filtering](/articles_data/vector-search-filtering/payload-index-filtering.png)

A payload index maps payload values to the points that hold them, much like an index in a document database. For example, an index on `category` looks like this:

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

Qdrant uses payload indexes in three ways: to find matching points without scanning every payload, to estimate how many points a filter matches so the [query planner](#how-the-query-planner-chooses-a-strategy) can pick a strategy, and to build the extra filterable HNSW edges.

Follow these rules to decide what to index:

- **Index every field you filter on in dense vector search.** Without an index, the planner cannot estimate accurately how many points match, and Qdrant has to read payloads to evaluate the filter. You can make Qdrant [reject queries that filter on unindexed fields](/documentation/manage-data/indexing/#block-queries-that-filter-on-unindexed-fields) so that a missing index surfaces as an error instead of a slow query.
- **Match the index type to the values and the conditions you use.** Use `keyword` for exact matches on strings, `integer` or `float` for ranges, `bool`, `datetime`, `uuid`, `geo`, and `text` for full-text search. The [payload index documentation](/documentation/manage-data/indexing/#payload-index) lists the types and their parameters.
- **Create payload indexes before you ingest data.** Qdrant builds the extra filterable HNSW edges only for fields that are indexed when the HNSW graph is built. If you add a payload index to a collection that already holds data, filters on that field work, but the graph has no extra edges for it until you [rebuild the HNSW index](/documentation/manage-data/indexing/#rebuild-the-hnsw-index).
- **Skip the extra edges for fields you filter only in sparse search.** Sparse vector search does not use the HNSW graph, so for those fields set `enable_hnsw` to `false` on the payload index to save memory and indexing time. This option is available as of v1.17.
- **Mark a tenant field and a principal field.** Use `is_tenant` for the field that separates customers in a shared collection, as described in the [next section](#indexing-payloads-in-multitenant-setups). Use `is_principal` for the field most of your queries filter on, such as a timestamp. Both options let Qdrant organize storage around the field.

Here is how to create a payload index for the `category` field:

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

## How the Query Planner Chooses a Strategy

![scanning-lens](/articles_data/vector-search-filtering/scanning-lens.png)

For each filtered query, Qdrant's [query planner](/documentation/search/search/#query-planning) estimates the **filter cardinality**: the number of points that satisfy the filter. It uses the payload indexes to make that estimate, and it plans each segment of the collection separately.

{{< island path="content/documentation/headless/search-patterns/query-planner" ratio="700 / 272" title="The query planner estimates how many points match, then scores them directly or searches the filterable HNSW graph. ACORN is an option for strict filter combinations." >}}
![The query planner chooses between scoring the matches directly and searching the filterable HNSW graph](/articles_data/vector-search-filtering/query-planner.svg)
{{< /island >}}

- **Few points match:** if the vectors of the estimated matches take up less than `full_scan_threshold`, Qdrant retrieves the matching points through the payload index and scores each one against the query. The default threshold is 10,000 KB, where 1 KB holds one 256-dimensional vector, so about 10,000 vectors of 256 dimensions or 2,500 vectors of 1024 dimensions. This path gives exact results.
- **Many points match:** Qdrant searches the filterable HNSW graph and skips points that fail the filter.
- **A small share of points match, but still too many to score directly:** this is where the graph can fall apart, especially when you combine two or more strict filters. Turn on [ACORN](#when-to-use-acorn) for these queries.

You can change `full_scan_threshold` in the HNSW configuration of a collection. See [vector indexing](/documentation/manage-data/indexing/#vector-index) for the setting.

## When to Use ACORN

Filterable HNSW builds extra edges for each indexed field separately, not for combinations of fields. When a query combines two or more strict filters, the points that satisfy all of them may not be connected in the graph, and recall drops. The same can happen when a collection holds many deleted points.

[ACORN](/documentation/search/search/#acorn-search-algorithm), available as of v1.16, fixes this at search time. When a direct neighbor is filtered out, the search also looks at that neighbor's neighbors, so it can step over filtered-out points. That costs extra work per query, so use it where it pays off:

- **Turn ACORN on** for queries that combine two or more strict filters, or for collections with many deleted points, when filtered recall is lower than you need.
- **Leave it off** for single-field filters that have payload indexes, because the filterable HNSW edges already cover them.

To check whether you need it, run a sample of your filtered queries twice: once as usual and once with `"params": { "exact": true }`, which scores every matching point and gives the true top results. If the normal results miss too many of the exact ones, turn on ACORN for those queries and compare again.

ACORN is disabled by default. Once you enable it, it only runs when the estimated share of matching points is below `max_selectivity`, which defaults to `0.4`:

```http
POST /collections/online_store/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "filter": {
        "must": [
            { "key": "category", "match": { "value": "laptop" } },
            { "key": "price", "range": { "lte": 1000 } }
        ]
    },
    "params": {
        "acorn": { "enable": true, "max_selectivity": 0.4 }
    },
    "limit": 3
}
```

To see how ACORN and filterable HNSW compare on real filters, read [Filtered Vector Search: What ACORN Fixes, and What Fixes ACORN](/articles/filtered-vector-search-acorn/).

## Indexing Payloads in Multitenant Setups

Some applications must keep each customer's data separate. A common mistake is to create a separate collection for each tenant in the same cluster. With many tenants, this exhausts the cluster's resources and can lead to out-of-memory errors and degraded performance.

Instead, store all tenants in one collection and give each point a tenant field, such as `user_id`. Filter every query by that field, and mark it as the tenant field when you create its payload index:

```http
PUT /collections/{collection_name}/index
{
   "field_name": "user_id",
   "field_schema": {
       "type": "keyword",
       "is_tenant": true
   }
}
```

With `is_tenant` set, Qdrant organizes storage so that each tenant's points sit together, which makes tenant-filtered queries faster. Read more about the [tenant index](/documentation/manage-data/indexing/#tenant-index) and [multitenancy](/documentation/manage-data/multitenancy/).

## Filtering Float Values

![best-practices](/articles_data/vector-search-filtering/best-practices.png)

The `match` condition works on keywords, integers, booleans, and UUIDs, but not on floats. Qdrant rejects a `match` condition with a float value such as `11.99`. To filter float fields, use `range`.

To find an exact stored value, set both bounds to it:

```json
{
  "key": "price",
  "range": {
    "gte": 11.99,
    "lte": 11.99
  }
}
```

This returns only points whose stored `price` is exactly `11.99`. A value such as `11.991` does not match. If your values come from calculations and may carry rounding errors, use a small window around the target instead, such as `"gte": 11.985, "lt": 11.995`. For money, you can also store whole cents as an integer and filter with `match` or `range`.

## Points with Multiple Values for One Field

A payload field can hold multiple values, such as a product that comes in red, blue, and green. A filter matches the point if any of its values satisfies the condition, and the point appears once in the results, even when more than one of its values match. You do not need to remove duplicates yourself when you paginate.

## Conclusion: Real-Life Use Cases of Filtering

Filtering in a [vector search engine](/) like Qdrant lets you combine similarity with exact constraints, so results are both relevant and correct. Here are some use cases where filtering is essential:

| **Use Case**                         | **Vector Search**                                                | **Filtering**                                                           |
|--------------------------------------|------------------------------------------------------------------|-------------------------------------------------------------------------|
| [E-Commerce Product Search](/advanced-search/)        | Search for products by style or visual similarity                | Filter by price, color, brand, size, ratings                            |
| [Recommendation Systems](/recommendations/)           | Recommend similar content, such as movies or songs               | Filter by release date or genre, such as movies after 2020              |
| [Geospatial Search in Ride-Sharing](/documentation/search/filtering/#geo-radius)| Find similar drivers or delivery partners                         | Filter by rating, distance radius, vehicle type                                |
| [Fraud & Anomaly Detection](/data-analysis-anomaly-detection/)                  | Detect transactions similar to known fraud cases                 | Filter by amount, time, location                                        |

## Further Reading

- [Filtering documentation](/documentation/search/filtering/): every filter condition and clause, with examples for each client.
- [Payload indexes](/documentation/manage-data/indexing/#payload-index): index types, their parameters, and the tenant and principal options.
- [Query planning](/documentation/search/search/#query-planning): how Qdrant picks a search strategy for each segment.
- [Filtered Vector Search: What ACORN Fixes, and What Fixes ACORN](/articles/filtered-vector-search-acorn/): benchmarks of ACORN and filterable HNSW on real filters.
- [Filterable HNSW](/articles/filterable-hnsw/): the article behind Qdrant's extra filter edges.
- [Multitenant search](/documentation/production-operations/multitenant-search/): how to serve many tenants from one collection.

#### Try Filtering in a Live Cluster

The easiest way to try filtering is in a [free Qdrant Cloud cluster](/documentation/cloud-quickstart/). The interactive tutorial in the dashboard shows you how to create a collection, add data, and run filters.

![qdrant-filtering-tutorial](/articles_data/vector-search-filtering/qdrant-filtering-tutorial.png)

[![qdrant-hybrid-cloud](/docs/homepage/cloud-cta.png)](https://qdrant.to/cloud)
