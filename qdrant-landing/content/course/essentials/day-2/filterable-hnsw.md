---
title: Combining Vector Search and Filtering
weight: 2
---

{{< date >}} Day 2 {{< /date >}}

# Combining Vector Search and Filtering

We've talked about how Qdrant uses the [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) graph to efficiently search dense vectors. But in real-world applications, you'll often want to constrain your search using filters. This creates unique challenges for graph traversal that Qdrant solves elegantly.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## The Challenge: Filters Break Graph Connectivity

Consider retrieving items from an online store collection where you only want to show laptops priced under $1,000. That price information, along with the category 'laptop', isn't part of the vector - it lives in the [payload](/documentation/concepts/payload/).

<img src="/courses/day2/point-vector-payload.png" alt="Point structure showing vector vs payload" width="600">

When you apply a filter like `price < 1000`, you're essentially restricting which points are eligible during search. This introduces challenges for graph traversal because HNSW depends on both short-range and long-range edges to efficiently explore the vector space. It assumes any point in the graph could be reachable.

But if filtering removes a large portion of those points, the search path may break down. You risk missing relevant results - not because they weren't similar, but because they were unreachable under the filter.

## Naive Approaches and Their Problems

### Post-Filtering Strategy

One approach is to ignore the filter initially: run the search across the whole dataset, get the top K most similar vectors, then apply the filter afterward.

**The problem:** You might discard most of the top K results. If the best match that satisfies the filter wasn't in that top K, you won't see it. You spent compute evaluating vectors you can't use and dropped recall because relevant points were never retrieved.

### Pre-Filtering Strategy

Another approach is to filter first, then search within the filtered subset.

**The problem:** When filters are too restrictive, they fragment the HNSW graph, breaking connectivity and making traversal inefficient or impossible.

## Qdrant's Solution: Filterable HNSW

Qdrant solves this with a smarter approach. We guarantee that the HNSW graph remains connected by creating additional edges to maintain connectivity under filtering. Qdrant builds subgraphs per payload value, then merges them back into the full graph.

So if you filter `brand = Apple`, Qdrant has already built a connected subgraph of just Apple points, and traversal works fine within that subset.

<img src="/courses/day2/filterable-hnsw-diagram.png" alt="Filterable HNSW subgraph connectivity" width="700">

## The Query Planner: Adaptive Strategy Selection

At query time, Qdrant uses a query planner to determine the most efficient way to run your search. Depending on how complex your filters are and how many points they match, it can take different routes:

### When the filter is broad (matches many points):
Qdrant performs regular HNSW search but skips over nodes that don't match during traversal. This avoids the cost of pre-filtering a large result set while keeping the search fast and approximate.

### When the filter is narrow (matches few points):
Qdrant performs pre-filtering using payload indexes to find the set of points that match the filter, then searches only among this subgraph using HNSW.

### When the filter is very narrow:
If the filter matches just a tiny portion of the collection, Qdrant might skip HNSW entirely and fall back to a simple full scan if that's faster.

This planning happens per segment and is based on filter cardinality, index availability, and thresholds like `full_scan_threshold`.

## Payload Indexing: The Performance Foundation

**Critical point:** Qdrant does not automatically index payload fields - you need to explicitly define which fields should be indexed. Always create a payload index on any field you plan to filter, especially when filtering large datasets.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Index frequently filtered fields
client.create_payload_index(
    collection_name="store",
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD
)

client.create_payload_index(
    collection_name="store", 
    field_name="price",
    field_schema=models.PayloadSchemaType.FLOAT
)

# For multi-tenant applications, mark tenant fields
client.create_payload_index(
    collection_name="store",
    field_name="tenant_id", 
    field_schema=models.KeywordIndexParams(type="keyword", is_tenant=True)
)
```

### Memory Considerations

Payload indexes consume additional memory, so it's recommended to only index fields used in filtering conditions. If memory limits prevent indexing all fields, choose the field that limits the search result the most. The more different values a payload field has, the more efficiently the index will be used.

## Practical Implementation

### Setting Up Filterable Search

```python
# Create filter combining multiple conditions
filter_conditions = models.Filter(
    must=[
        models.FieldCondition(
            key="category", 
            match=models.MatchValue(value="laptop")
        ),
        models.FieldCondition(
            key="price", 
            range=models.Range(lte=1000)
        ),
        models.FieldCondition(
            key="brand",
            match=models.MatchAny(any=["Apple", "Dell", "HP"])
        )
    ]
)

# Execute filtered search
results = client.query_points(
    collection_name="store",
    query=query_vector,
    query_filter=filter_conditions,
    limit=10,
    search_params=models.SearchParams(hnsw_ef=128)
)
```

### Query Planner Decision Matrix

| Filter Cardinality | Strategy | When Used |
|-------------------|----------|-----------|
| **High (broad)** | HNSW traversal with node skipping | Filter matches many points |
| **Medium** | Pre-filter + HNSW subset search | Moderate selectivity |
| **Very low (narrow)** | Full scan over candidates | Tiny result set |

## Performance Optimization Tips

1. **Index strategically**: Create payload indexes for all filtered fields, prioritizing high-selectivity fields when memory is constrained

2. **Monitor cardinality**: Fields with more distinct values provide better filtering efficiency

3. **Test filter combinations**: Complex multi-field filters benefit most from proper indexing

4. **Tune thresholds**: Adjust `full_scan_threshold` based on your data distribution and query patterns

5. **Measure real performance**: Benchmark with your actual data and query patterns to validate planner decisions

## Key Takeaways

**Filterable HNSW is not a separate indexing mechanism** - it's an enhancement of the base HNSW graph designed to maintain traversal performance under filtering constraints.

**The query planner** automatically selects the optimal strategy based on filter selectivity, available indexes, and segment characteristics.

**Payload indexing** is essential for filtered search performance, especially with large datasets and complex filter conditions.

**Always benchmark** with your specific data to understand how the planner behaves and optimize accordingly.

In the next section, we'll define a collection with structured payloads, configure payload indexing, and evaluate how different HNSW parameters impact filtered search performance.

Learn more: [Filterable HNSW in Qdrant Documentation](https://qdrant.tech/documentation/concepts/indexing/?q=filtrable+hnsw#filtrable-index) 