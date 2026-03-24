---
title: Pre-Migration Baseline
weight: 5
partition: ecosystem
---

# Pre-Migration Baseline

Establishing a baseline is paramount for migration verification. If you don't capture what "correct" looks like before you migrate, you have nothing to compare against afterward. This page covers what to record from your source system before starting the migration.

## What to Capture

There are four pieces of information that need to be accounted for when establishing a baseline: collection/index inventory, metadata samples, baseline search results, and system configuration snapshots.

### 1. Collection/Index Inventory

For every index/collection you plan to migrate, record the following information:

```
For each collection:
- Name / identifier
- Vector count
- Vector dimensions
- Distance metric (cosine, dot product, euclidean)
- Index type and parameters (e.g., HNSW ef_construction, M)
- Quantization settings (if any)
- Replication factor (if applicable)
```

Pay close attention to the distance metric. Distance metric mismatches are the single most common cause of search quality regressions after migration. Cosine similarity vs. dot product vs. Euclidean distance will produce different rankings from the same vectors. If your source system uses cosine and you accidentally configure Qdrant for dot product, every search result changes.

<details>
<summary><b>Pinecone</b></summary>

```py
# Pinecone baseline capture
import pinecone

# Record index stats
index = pinecone.Index("your-index")
stats = index.describe_index_stats()

baseline = {
    "total_vector_count": stats.total_vector_count,
    "dimension": stats.dimension,
    "namespaces": {
        ns: {"vector_count": ns_stats.vector_count}
        for ns, ns_stats in stats.namespaces.items()
    },
    # Pinecone doesn't expose distance metric via API;
    # check your index creation code or dashboard
    "metric": "cosine",  # VERIFY THIS MANUALLY
}
```

</details>

<details>
<summary><b>Weaviate</b></summary>

```py
# Weaviate baseline capture
import weaviate

client = weaviate.Client("http://localhost:8080")

schema = client.schema.get()
for cls in schema["classes"]:
    baseline = {
        "class_name": cls["class"],
        "vector_count": client.query.aggregate(cls["class"]).with_meta_count().do(),
        "distance_metric": cls.get("vectorIndexConfig", {}).get("distance", "cosine"),
        "ef_construction": cls.get("vectorIndexConfig", {}).get("efConstruction"),
        "vector_dimensions": None,  # Weaviate infers from data; check a sample vector
    }
```

</details>

<details>
<summary><b>Milvus / Zilliz</b></summary>

```py
# Milvus baseline capture
from pymilvus import connections, Collection

connections.connect("default", host="localhost", port="19530")
collection = Collection("your_collection")
collection.load()

baseline = {
    "collection_name": collection.name,
    "num_entities": collection.num_entities,
    "schema_fields": [
        {"name": f.name, "dtype": str(f.dtype), "dim": getattr(f, "dim", None)}
        for f in collection.schema.fields
    ],
    "index_params": collection.indexes,  # Capture index type + params
}
```

</details>

<details>
<summary><b>Elasticsearch</b></summary>

```py
# Elasticsearch baseline capture
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200")

# Get mapping to find vector field config
mapping = es.indices.get_mapping(index="your_index")
stats = es.count(index="your_index")

baseline = {
    "index_name": "your_index",
    "document_count": stats["count"],
    "mapping": mapping,  # Contains vector field type, dims, similarity metric
}
```

</details>

<details>
<summary><b>pgvector</b></summary>

```sql
-- pgvector baseline capture
SELECT
    relname AS table_name,
    n_live_tup AS approximate_row_count
FROM pg_stat_user_tables
WHERE relname = 'your_embeddings_table';

-- Vector dimensions (check first row)
SELECT vector_dims(embedding) FROM your_embeddings_table LIMIT 1;

-- Index configuration
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_embeddings_table';

-- Distance metric: check your index definition
-- ivfflat with vector_cosine_ops = cosine
-- ivfflat with vector_l2_ops = euclidean
-- ivfflat with vector_ip_ops = inner product (dot)
```

</details>

### 2. Metadata Sample

Export a representative sample of metadata (or payloads) from your source system. You'll use this for field-by-field comparison after migration.

**How much to sample:** At least 1,000 records or 1% of your data, *whichever is larger*. For datasets under 100K vectors, consider exporting all metadata.

**What to record for each sample:**

```
- Point/document ID
- All metadata fields with their values
- Metadata field types (string, integer, float, boolean, array, nested object)
- Any null/missing fields (important: some systems drop nulls on export)
```

Metadata type coercion is a subtle migration failure. A field stored as an integer in Pinecone might arrive as a float in Qdrant. A boolean stored as `"true"` (string) in Elasticsearch will need explicit type handling. These mismatches don't cause errors during import, but they break filtered search queries.

### 3. Baseline Search Queries

The most valuable baseline you can capture is search quality. Select 10 to 50 queries that represent your actual search workload:

```py
# Structure for recording baseline queries
baseline_queries = [
    {
        "query_id": "q001",
        "description": "Product search: running shoes",
        "query_vector": [...],  # The actual query vector
        "filters": {"category": "footwear", "in_stock": True},  # If applicable
        "top_k": 10,
        "source_results": [
            {"id": "doc_123", "score": 0.95, "rank": 1},
            {"id": "doc_456", "score": 0.91, "rank": 2},
            # ... full top-k
        ],
        "timestamp": "2026-03-10T14:30:00Z",
        "source_system": "pinecone",
        "source_index": "products-v2",
    },
]
```

**How to choose representative queries:**

* Include your most frequent production queries (check logs)
* Include edge cases: queries with highly selective filters, queries that return few results, queries across multiple data types
* Include queries from different parts of the vector space (test across multiple clusters, not a single region of similar queries)
* If you use hybrid search (dense + sparse), capture both components

**What to record for each query:**

* The query vector itself (exact floats, not re-embedded)
* Any metadata filters applied
* The top-k value used
* The full ranked result list with scores
* Whether re-ranking was applied

### 4. System Configuration Snapshot

Record the configuration of your source system that affects search behavior:

```
- Software version (e.g., Pinecone API version, Weaviate 1.24, Milvus 2.3)
- Index/collection creation parameters
- Quantization settings (PQ, SQ, none)
- HNSW parameters (ef_construction, M, ef_search) if applicable
- Segment/shard configuration
- Any custom scoring, re-ranking, or post-processing logic
- Client library version
```

When search results differ post-migration, you need to determine whether the difference comes from the data or the configuration. Without a configuration snapshot, you can't distinguish between "the vectors migrated incorrectly" and "the indexing parameters produce different recall characteristics."

## Output

After completing this step, you should have four artifacts:

1. **Collection inventory** (JSON or YAML): names, counts, dimensions, metrics, index params
2. **Metadata sample** (JSONL): representative records with all fields and types
3. **Baseline queries** (JSON): query vectors, filters, and source system results
4. **Configuration snapshot** (text): source system settings that affect search behavior

Store these alongside your migration scripts. You'll reference them in every subsequent verification step.

---

**Next:** [Data Integrity Verification](/documentation/migration-verification/data-integrity/)
