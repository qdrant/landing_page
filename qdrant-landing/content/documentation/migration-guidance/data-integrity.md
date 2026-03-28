---
title: Data Integrity
weight: 10
partition: ecosystem
aliases:
  - /documentation/migration-guidance/data-integrity/
---

# Data Integrity Verification

Once you've established a [baseline](/documentation/migration-guidance/pre-migration-baseline/), you first need to check data integrity. Data integrity answers the question: "Did all my data arrive, and did it arrive correctly?" These are the fastest checks to run and catch the most common migration failures.

## 1. Vector Count Verification

The simplest check: does the number of vectors in Qdrant match your source system?

```py
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

# Get collection info
collection_info = client.get_collection("your_collection")
qdrant_count = collection_info.points_count

# Compare against baseline
source_count = baseline["total_vector_count"]  # From pre-migration capture

if qdrant_count == source_count:
    print(f"✓ Vector count matches: {qdrant_count}")
else:
    diff = source_count - qdrant_count
    pct = (diff / source_count) * 100
    print(f"✗ Count mismatch: source={source_count}, qdrant={qdrant_count}, "
          f"missing={diff} ({pct:.2f}%)")
```

**Common causes of count mismatches:**

| Symptom | Likely Cause |
| ----- | ----- |
| Qdrant count is lower | Migration script failed partway through; duplicate IDs in source were deduplicated; source count included soft-deleted records |
| Qdrant count is higher | Duplicate inserts from a retried migration; source count didn't include all namespaces/partitions |
| Counts match but data is wrong | ID collision: different vectors mapped to the same point ID |

**When exact match isn't expected:** Some source systems count differently. Pinecone's `describe_index_stats` counts across all namespaces; if you migrated only a subset, the counts won't match. pgvector's `n_live_tup` is an estimate. Document these expected discrepancies before concluding the migration failed.

## 2. Vector Dimension Verification

Confirm that vector dimensions match your source configuration:

```py
collection_info = client.get_collection("your_collection")
qdrant_dim = collection_info.config.params.vectors.size
# For named vectors:
# qdrant_dim = collection_info.config.params.vectors["dense"].size

source_dim = baseline["dimension"]

assert qdrant_dim == source_dim, (
    f"Dimension mismatch: source={source_dim}, qdrant={qdrant_dim}"
)
```

**If dimensions don't match:** This almost always indicates a migration script error (e.g., truncated vectors, wrong embedding model used for re-embedding). Do not proceed with further verification until this is resolved.

## 3. Distance Metric Verification

Verify the distance metric matches your source system's configuration:

```py
qdrant_metric = collection_info.config.params.vectors.distance
# Returns: "Cosine", "Euclid", or "Dot"

# Map source system metrics to Qdrant equivalents
METRIC_MAP = {
    # Pinecone
    "cosine": "Cosine",
    "euclidean": "Euclid",
    "dotproduct": "Dot",
    # Weaviate
    "l2-squared": "Euclid",
    # Milvus
    "COSINE": "Cosine",
    "L2": "Euclid",
    "IP": "Dot",
}

expected_metric = METRIC_MAP.get(baseline["metric"])
assert qdrant_metric == expected_metric, (
    f"Distance metric mismatch: source={baseline['metric']} "
    f"(expected {expected_metric}), qdrant={qdrant_metric}"
)
```

A distance metric mismatch is a silent error. When migrating, the vectors still load, and queries still return results. For example, cosine similarity and dot product produce identical rankings only when vectors are unit-normalized. If your vectors aren't normalized and you switch between cosine and dot product, every search result changes.

## 4. Metadata (Payload) Verification

Metadata verification checks three things: field presence, field types, and field values.

### 4a. Field Presence

Check that all expected metadata fields exist in Qdrant:

```py
import random

# Sample points from Qdrant using scroll
records, _next = client.scroll(
    collection_name="your_collection",
    limit=1000,
    with_payload=True,
    with_vectors=False,  # Skip vectors to speed up the check
)

# Collect all field names across sampled records
qdrant_fields = set()
for record in records:
    if record.payload:
        qdrant_fields.update(record.payload.keys())

source_fields = set(baseline["metadata_fields"])
missing = source_fields - qdrant_fields
extra = qdrant_fields - source_fields

if missing:
    print(f"✗ Fields missing in Qdrant: {missing}")
if extra:
    print(f"⚠ Extra fields in Qdrant (may be expected): {extra}")
if not missing and not extra:
    print(f"✓ All {len(source_fields)} metadata fields present")
```

### 4b. Field Type Consistency

Check that field types survived the migration:

```py
def check_field_types(source_record, qdrant_record):
    """Compare field types between source and Qdrant records."""
    issues = []
    for field, source_value in source_record.items():
        if field not in qdrant_record:
            issues.append(f"  {field}: missing in Qdrant")
            continue
        qdrant_value = qdrant_record[field]
        if type(source_value) != type(qdrant_value):
            issues.append(
                f"  {field}: type changed from "
                f"{type(source_value).__name__} to {type(qdrant_value).__name__} "
                f"(source={source_value!r}, qdrant={qdrant_value!r})"
            )
    return issues
```

**Common type coercion issues:**

| Source Type | Qdrant Arrival | Impact |
| ----- | ----- | ----- |
| Integer → Float | `42` → `42.0` | Filter `= 42` may fail; use range filter instead |
| Boolean → String | `true` → `"true"` | Filter `= true` returns no results |
| Nested object → Flattened | `{"a": {"b": 1}}` → `{"a.b": 1}` | Nested filter syntax won't match |
| Array → Single value | `["tag1", "tag2"]` → `"tag1"` | Array containment filters break |
| Null → Missing field | `null` → (field absent) | `is_null` filter won't find it |

### 4c. Field Value Spot-Check

For your sampled records, compare actual values:

```py
def spot_check_values(source_sample, qdrant_collection, client):
    """Compare metadata values for sampled records."""
    mismatches = []

    for source_record in source_sample:
        point_id = source_record["id"]
        qdrant_points = client.retrieve(
            collection_name=qdrant_collection,
            ids=[point_id],
            with_payload=True,
        )
        if not qdrant_points:
            mismatches.append({"id": point_id, "issue": "Point not found in Qdrant"})
            continue

        qdrant_payload = qdrant_points[0].payload
        for field, source_value in source_record["metadata"].items():
            qdrant_value = qdrant_payload.get(field)
            if source_value != qdrant_value:
                mismatches.append({
                    "id": point_id,
                    "field": field,
                    "source": source_value,
                    "qdrant": qdrant_value,
                })

    return mismatches
```

## 5. Point ID Verification

Check for duplicate or orphaned point IDs:

```py
# Scroll through all points and collect IDs
all_ids = []
next_offset = None
while True:
    records, next_offset = client.scroll(
        collection_name="your_collection",
        limit=1000,
        offset=next_offset,
        with_payload=False,
        with_vectors=False,
    )
    all_ids.extend([r.id for r in records])
    if next_offset is None:
        break

# Check for duplicates
if len(all_ids) != len(set(all_ids)):
    duplicates = [id for id in all_ids if all_ids.count(id) > 1]
    print(f"✗ Found {len(duplicates)} duplicate point IDs")
else:
    print(f"✓ No duplicate point IDs ({len(all_ids)} unique)")
```

**Note on ID mapping:** If your source system uses string IDs and you mapped them to integer IDs (or vice versa) during migration, maintain a mapping file and verify it's consistent.

## 6. Vector Value Spot-Check

For a small sample, verify that the actual vector values match:

```py
import numpy as np

def verify_vectors(source_vectors, qdrant_collection, client, tolerance=1e-6):
    """Spot-check that vector values match between source and Qdrant."""
    mismatches = []

    for source in source_vectors:
        qdrant_points = client.retrieve(
            collection_name=qdrant_collection,
            ids=[source["id"]],
            with_vectors=True,
        )
        if not qdrant_points:
            mismatches.append({"id": source["id"], "issue": "not found"})
            continue

        source_vec = np.array(source["vector"])
        qdrant_vec = np.array(qdrant_points[0].vector)

        if not np.allclose(source_vec, qdrant_vec, atol=tolerance):
            max_diff = np.max(np.abs(source_vec - qdrant_vec))
            mismatches.append({
                "id": source["id"],
                "max_difference": float(max_diff),
            })

    return mismatches
```

**Expected tolerance:** Exact float equality (tolerance=0) is too strict if quantization is applied on either side. If you're using scalar quantization in Qdrant, expect small differences. If neither system uses quantization, values should match exactly.

## Passing Criteria

| Check | Pass | Investigate |
| ----- | ----- | ----- |
| Vector count | Exact match (or within documented tolerance) | Any unexplained difference |
| Dimensions | Exact match | Any mismatch (stop here) |
| Distance metric | Maps correctly to Qdrant equivalent | Any mismatch (stop here) |
| Metadata fields | All source fields present | Missing fields |
| Metadata types | Types preserved or intentionally converted | Unexpected type changes |
| Metadata values | Spot-check sample matches | >1% mismatch rate |
| Point IDs | No duplicates, all source IDs present | Missing or duplicate IDs |
| Vector values | Within tolerance (1e-6 without quantization) | Differences exceeding tolerance |

---

**Next:** [Search Quality Verification](/documentation/migration-guidance/search-quality/)
