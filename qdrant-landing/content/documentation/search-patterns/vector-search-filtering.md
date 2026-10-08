---
title: "Filtering in Vector Search: When to Use What"
short_description: "Decide which fields to index, how Qdrant runs a filtered search, and when to turn on ACORN."
description: "A decision guide to filtering in Qdrant: which payload fields to index, how the query planner picks a strategy, and when to turn on ACORN."
preview_dir: /articles_data/vector-search-filtering/preview
social_preview_image: /articles_data/vector-search-filtering/preview/social_preview.jpg
weight: 30
author: Sabrina Aquino, David Myriel
author_link: 
date: 2024-09-10T00:00:00.000Z
aliases:
  - /articles/vector-search-filtering/
---

# Filtering in Vector Search: When to Use What

Imagine you sell computer hardware. A shopper looking for **laptops under $1000** wants similar laptops, but a plain [vector search](/advanced-search/) can still return laptops over $1000. A payload filter guarantees that every result meets the constraint:

![vector-search-ecommerce](/articles_data/vector-search-filtering/vector-search-ecommerce.png)

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

This guide covers the decisions around a filter like this one: which fields to index, how Qdrant runs the search, and when to change the defaults. For the syntax of every filter condition, see the [filtering documentation](/documentation/search/filtering/).

## Quick Reference

| Situation | What to do | Details |
|---|---|---|
| You filter on a field in dense vector search | Create a payload index on it, before you ingest data | [Index Every Field You Filter On](#index-every-field-you-filter-on) |
| You filter on a field only in sparse search | Index it with `enable_hnsw: false` | [Payload indexes](/documentation/manage-data/indexing/#disable-the-creation-of-extra-edges-for-payload-fields) |
| You added an index to a collection that already has data | Rebuild the HNSW index to get the filter edges | [Rebuild the HNSW index](/documentation/manage-data/indexing/#rebuild-the-hnsw-index) |
| Many customers share one collection | Index the tenant field with `is_tenant: true` | [Use One Collection for Many Tenants](#use-one-collection-for-many-tenants) |
| A query combines two or more strict filters and recall drops | Turn on ACORN for that query | [Turn On ACORN for Strict Combined Filters](#turn-on-acorn-for-strict-combined-filters) |
| You filter on a float field | Use `range`, not `match` | [Common Pitfalls](#common-pitfalls) |
| You filter on fields inside an array of objects | Use a `nested` condition | [Common Pitfalls](#common-pitfalls) |
| You need matching points without ranking | Use `scroll` or `count` with the filter | [Scroll points](/documentation/manage-data/points/#scroll-points) |

## Filter During the Search, Not Before or After

![stepping-lens](/articles_data/vector-search-filtering/stepping-lens.png)

There are two traditional ways to combine a filter with vector search, and both have a cost.

- **Post-filtering** runs the vector search first and then drops results that fail the filter. If many of the top results fail, you get fewer results than you asked for.
- **Pre-filtering** applies the filter first and then compares the query with every matching point. Results are exact, but scoring every match is expensive when many points pass the filter.

The diagram ranks five laptops by similarity to the query vector `[0.2, 0.1, 0.9, 0.7]`.

{{< island path="content/documentation/headless/search-patterns/filter-order" ratio="700 / 286" title="Post-filtering takes the top 3 and then applies the price filter, so one of the three slots is lost. Pre-filtering applies the filter first and scores only the matches, so all three results fit the filter." >}}
![Post-filtering returns two of three results; pre-filtering returns three](/articles_data/vector-search-filtering/filter-order.svg)
{{< /island >}}

Qdrant filters **during** the search, so you do not have to choose. Its query planner either scores the matching points directly when few points match, or searches the HNSW graph while skipping points that fail the filter. To keep that graph walk from getting stuck, Qdrant builds a **filterable HNSW index**: extra edges between points that share a value of an indexed payload field. When a single field's edges are not enough, [ACORN](#turn-on-acorn-for-strict-combined-filters) can step through filtered-out neighbors at search time.

{{< island path="content/articles/headless/filtered-vector-search-acorn/repairs" ratio="19 / 11" title="The same graph, repaired two ways. ACORN steps through filtered-out neighbors at search time; filterable HNSW adds extra edges at index time that a filtered query can walk directly. The graph is a toy; the traversals are computed on it." >}}
![The same graph, repaired two ways](/articles_data/filtered-vector-search-acorn/two-repairs.svg)
{{< /island >}}

## Index Every Field You Filter On

![payload-index-filtering](/articles_data/vector-search-filtering/payload-index-filtering.png)

Qdrant uses payload indexes in three ways: to find matching points without scanning every payload, to estimate how many points a filter matches so the [query planner](#let-the-query-planner-choose) can pick a strategy, and to build the extra filterable HNSW edges.

- **Index every field you filter on in dense vector search.** Without an index, the planner cannot estimate how many points match, and Qdrant has to read payloads to evaluate the filter. You can make Qdrant [reject queries that filter on unindexed fields](/documentation/manage-data/indexing/#block-queries-that-filter-on-unindexed-fields), so a missing index surfaces as an error instead of a slow query.
- **Match the index type to the values and conditions.** Use `keyword` for exact matches on strings, `integer` or `float` for ranges, and `bool`, `datetime`, `uuid`, `geo`, or `text` for those value types. The [payload index documentation](/documentation/manage-data/indexing/#payload-index) lists every type and its parameters.
- **Create payload indexes before you ingest data.** Qdrant builds the extra filterable HNSW edges only for fields that are indexed when the graph is built. An index added later still serves filters, but the graph has no extra edges for it until you [rebuild the HNSW index](/documentation/manage-data/indexing/#rebuild-the-hnsw-index).
- **Skip the extra edges for fields you filter only in sparse search.** Sparse vector search does not use the HNSW graph, so set `enable_hnsw` to `false` on those payload indexes to save memory and indexing time. This option is available as of v1.17.
- **Mark a tenant field and a principal field.** Use `is_tenant` for the field that separates customers in a shared collection, and `is_principal` for the field most of your queries filter on, such as a timestamp. Both let Qdrant organize storage around the field.

Here is how to create a payload index for the `category` field:

```http
PUT /collections/online_store/index
{
    "field_name": "category",
    "field_schema": "keyword"
}
```
```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.create_payload_index(
   collection_name="online_store",
   field_name="category",
   field_schema="keyword",
)
```

## Let the Query Planner Choose

![scanning-lens](/articles_data/vector-search-filtering/scanning-lens.png)

For each filtered query, the [query planner](/documentation/search/search/#query-planning) estimates the **filter cardinality**, the number of points that satisfy the filter, from the payload indexes. It plans each segment of the collection separately.

{{< island path="content/documentation/headless/search-patterns/query-planner" ratio="700 / 272" title="The query planner estimates how many points match, then scores them directly or searches the filterable HNSW graph. ACORN is an option for strict filter combinations." >}}
![The query planner chooses between scoring the matches directly and searching the filterable HNSW graph](/articles_data/vector-search-filtering/query-planner.svg)
{{< /island >}}

- **Few points match:** if the vectors of the estimated matches take up less than `full_scan_threshold`, Qdrant scores each match directly and returns exact results. The default is 10,000 KB, about 10,000 vectors of 256 dimensions or 2,500 vectors of 1024 dimensions.
- **Many points match:** Qdrant searches the filterable HNSW graph and skips points that fail the filter.
- **A small share of points match, but too many to score directly:** this is where the graph can fall apart, especially with two or more strict filters. Turn on [ACORN](#turn-on-acorn-for-strict-combined-filters) for these queries.

The defaults suit most collections. You can change `full_scan_threshold` in the collection's [HNSW configuration](/documentation/manage-data/indexing/#vector-index).

## Turn On ACORN for Strict Combined Filters

Filterable HNSW builds extra edges for each indexed field separately, not for combinations of fields. When a query combines two or more strict filters, the points that satisfy all of them may not be connected in the graph, and recall drops. The same can happen when a collection holds many deleted points.

[ACORN](/documentation/search/search/#acorn-search-algorithm), available as of v1.16, fixes this at search time: when a neighbor is filtered out, the search also looks at that neighbor's neighbors. That costs extra work per query, so use it where it pays off.

- **Turn ACORN on** for queries that combine two or more strict filters, or for collections with many deleted points, when filtered recall is lower than you need.
- **Leave it off** for single-field filters with payload indexes, because the filterable HNSW edges already cover them.

To check whether you need it, run a sample of your filtered queries twice: once as usual and once with `"params": { "exact": true }`, which scores every matching point and gives the true top results. If the normal results miss too many of the exact ones, turn on ACORN and compare again.

ACORN is off by default. Once enabled, it runs only when the estimated share of matching points is below `max_selectivity`, which defaults to `0.4`:

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

## Use One Collection for Many Tenants

Do not create a separate collection for each customer in the same cluster. With many tenants, this exhausts the cluster's resources and can lead to out-of-memory errors.

Store all tenants in one collection, give each point a tenant field such as `user_id`, filter every query by it, and mark it as the tenant field when you index it:

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

With `is_tenant` set, Qdrant keeps each tenant's points together, which makes tenant-filtered queries faster. See [multitenancy](/documentation/manage-data/multitenancy/) for the full setup.

## Common Pitfalls

![best-practices](/articles_data/vector-search-filtering/best-practices.png)

- **Floats need `range`, not `match`.** Qdrant rejects a `match` condition with a float value such as `11.99`. To find an exact stored value, set both bounds to it: `"range": { "gte": 11.99, "lte": 11.99 }`. If values carry rounding errors, use a small window instead. For money, you can also store whole cents as an integer.
- **Conditions on an array of objects need `nested`.** Two plain conditions such as `diet[].food` is `meat` and `diet[].likes` is `true` can each match a different element of the array. To require both on the same element, use a [nested object filter](/documentation/search/filtering/#nested-object-filter).
- **Multiple values do not create duplicates.** When a field holds several values, such as a product in red, blue, and green, the point matches if any value satisfies the condition, and it appears once in the results.
- **Ordering by a field needs a range index.** `scroll` with `order_by` fails on a field without a payload index that supports ranges, and it returns no `next_page_offset`. See [ordering points by payload key](/documentation/manage-data/points/#order-points-by-payload-key).

Filters also work outside search: you can [delete](/documentation/manage-data/points/#delete-points), [count](/documentation/manage-data/points/#counting-points), or [update the payload of](/documentation/manage-data/payload/#set-payload) every point that matches one.

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
