---
title: Payload Index
weight: 2
---

{{< date >}} Day 2 {{< /date >}}

# Filterable HNSW

Learn how to maintain search speed while applying complex filters.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## What You'll Learn

- How filtering works with HNSW indexing
- Performance implications of different filter strategies
- When to use pre-filtering vs post-filtering
- Optimizing for filtered search scenarios

---

## Filtering Strategies & Payload Indexing in Practice

Real systems rarely search over vectors alone—you almost always constrain by metadata (payload). For example, retrieving “laptops” priced under $1,000 requires the vector similarity plus `category=laptop` and `price<1000`. Those fields live in the payload, not the vector.

If you ignore filters during graph traversal and only filter the top‑K at the end, you risk discarding most results and missing relevant matches that were not in the initial K. Worse, the HNSW graph assumes connectivity; removing many nodes via filters can break the traversal path.

### Filterable HNSW

Qdrant augments the base HNSW with filter‑aware connectivity. It builds subgraphs per payload value and merges them back, so traversal remains connected under filters. If you filter `brand="Apple"`, the “Apple‑only” subgraph remains navigable.

### The Query Planner

Qdrant chooses the fastest route per segment based on filter cardinality, index availability, and thresholds (e.g., `full_scan_threshold`):

- Broad filters (match many points): run HNSW and skip non‑matching nodes during traversal.
- Narrow filters (match few points): pre‑filter with payload indexes to get candidate IDs, then search only inside that subset using HNSW.
- Very narrow filters: skip HNSW and run a full scan if it’s faster for the tiny candidate set.

This is not a separate index—it’s an enhancement of HNSW and a planner that decides whether to pre‑filter, traverse, or fall back.

### Payload Indexes: When and How

Qdrant does not auto‑index payload fields. Create payload indexes for any field you will filter on, especially at scale or under low‑recall risk.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Create a numeric index for price
client.create_payload_index(
    collection_name="store",
    field_name="price",
    field_schema=models.PayloadSchemaType.FLOAT,
)

# Create a keyword index for brand
client.create_payload_index(
    collection_name="store",
    field_name="brand",
    field_schema=models.PayloadSchemaType.KEYWORD,
)

# Create a nested index for attributes.color
client.create_payload_index(
    collection_name="store",
    field_name="attributes.color",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

Use multi‑field and nested indexes when your filters combine structured fields. If memory is tight and you can’t index all fields, index those with the highest selectivity (most distinct values) because they prune the candidate set the most.

### Running Filtered Search

```python
from qdrant_client import models

flt = models.Filter(
    must=[
        models.FieldCondition(key="category", match=models.MatchValue(value="laptop")),
        models.FieldCondition(key="price", range=models.Range(lte=1000)),
    ]
)

results = client.search(
    collection_name="store",
    query_vector=query,
    limit=10,
    query_filter=flt,
    search_params=models.SearchParams(hnsw_ef=128),
)
```

### Planner Behavior, Recap

| Filter cardinality | Planner choice |
|---|---|
| High (broad) | Traverse HNSW and skip non‑matching nodes |
| Medium | Pre‑filter with payload index, then HNSW inside subset |
| Very low (tiny) | Direct full scan over the tiny set |

### Design Notes

- Filterable HNSW retains traversal quality under filters; it is not a separate index.
- Payload indexes speed up finding candidates; they consume memory, so pick fields that prune most.
- Always benchmark with your data. Cardinality and distribution drive planner choices.

In the next video, we’ll define a collection with structured payloads, configure payload indexing, and evaluate how different HNSW parameters impact filtered search performance. 