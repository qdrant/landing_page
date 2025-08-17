---
title: Understanding HNSW
weight: 1
---

{{< date >}} Day 2 {{< /date >}}

# HNSW Algorithm

Understand the Hierarchical Navigable Small World algorithm that makes vector search lightning-fast.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## What You'll Learn

- How HNSW creates efficient navigation graphs
- Why it's faster than brute-force search
- Key parameters and their effects
- When HNSW is the right choice

## The Vector Search Challenge

Imagine searching through millions of vectors. A naive approach would compare your query to every single vector - that's what we call "brute force" search. For 1 million vectors, that's 1 million distance calculations!

HNSW solves this by creating a smart navigation structure that can find approximate nearest neighbors in just a few hops.

## Indexing and Vector Storage Architecture

You might wonder if Qdrant calculates the distance to every vector on each query. That would work (brute force), but it does not scale when you have millions or billions of vectors. HNSW — Hierarchical Navigable Small World — avoids exhaustively checking everything by organizing vectors as a multi‑layer graph.

Think of a library. At the entrance you make a broad choice (fiction vs non‑fiction), then a genre (history, science), then a specific shelf. HNSW works the same way: a sparse top layer for long jumps, denser lower layers for precision. A query starts at an entry point in the top layer, walks to a closer neighbor using your distance metric, and repeats until no closer neighbor is found at that level. Then it descends a layer and refines again, until it reaches the bottom and returns the nearest neighbors.

Example: for a query like “striped blue shirt made of cotton,” upper layers quickly steer to “clothing,” then “shirts,” then “blue/striped,” and at the lowest level converge to the best match (e.g., a cotton maritime shirt). The entire search touches only a tiny fraction of the collection.

## How HNSW Works

### The Small World Concept

HNSW is based on "small world" networks - the idea that any two points in a network are connected by just a few hops (like "six degrees of separation").

```python
# Brute force: Check all vectors
def brute_force_search(query, all_vectors):
    distances = []
    for vector in all_vectors:  # O(n) - checks every vector
        distance = calculate_distance(query, vector)
        distances.append(distance)
    return min(distances)

# HNSW: Navigate through graph
def hnsw_search(query, graph):
    current = entry_point
    for level in range(max_level, 0, -1):  # O(log n) - just a few hops
        current = find_closest_neighbor(query, current, level)
    return current
```

### Multi-Level Structure

HNSW creates multiple layers, like a pyramid:

```
Layer 2:  A ←→ E                    (Few long-range connections)
         ↓     ↓
Layer 1:  A ←→ B ←→ D ←→ E          (More medium-range connections)
         ↓     ↓     ↓     ↓
Layer 0:  A ←→ B ←→ C ←→ D ←→ E      (Many short-range connections)
```

**Search Process:**
1. Start at top layer with long jumps
2. Navigate to approximately correct region
3. Drop to lower layers for precision
4. Find exact nearest neighbors at bottom layer

## Key HNSW Parameters

### 1. M (Maximum Connections)

Controls how many connections each node has:

```python
# Example configuration
hnsw_config = {
    "m": 16,  # Each node connects to up to 16 others
}

# Effects:
# M = 4:  Faster build, less accurate search
# M = 16: Balanced performance (default)  
# M = 64: Slower build, very accurate search
```

**Trade-offs:**
- Higher M: Better recall, more memory, slower builds
- Lower M: Faster builds, less memory, lower recall

### 2. ef_construct (Construction Parameter)

Controls search effort during index building:

```python
hnsw_config = {
    "m": 16,
    "ef_construct": 200,  # Search 200 candidates when building
}

# Effects:
# ef_construct = 100: Fast build, lower quality graph
# ef_construct = 200: Balanced (default)
# ef_construct = 400: Slow build, high quality graph  
```

### 3. ef (Search Parameter)

Controls search effort during queries:

```python
# This is set at search time, not build time
search_params = {
    "ef": 128,  # Consider 128 candidates during search
}

# Effects:
# ef = 32:  Very fast search, lower recall
# ef = 128: Balanced performance
# ef = 512: Slower search, high recall
```

### Parameter Summary

| Parameter | Description | Effect on Performance |
|---|---|---|
| m | Number of connections per node | Higher m improves recall but increases memory and build time |
| ef_construct | Neighbors considered during index build | Higher values improve recall but slow indexing |
| ef | Candidates explored during search | Higher values improve recall at the cost of query latency |

## HNSW in Qdrant

```python
from qdrant_client.models import VectorParams, Distance, HnswConfig

# Create collection with HNSW configuration
client.create_collection(
    collection_name="optimized_collection",
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE,
        hnsw_config=HnswConfig(
            m=16,           # Connections per node
            ef_construct=200,  # Build effort
            full_scan_threshold=10000,  # When to use brute force
        ),
    ),
)
```

### When HNSW vs Brute Force

Qdrant automatically chooses based on collection size:

```python
# Small collections (< full_scan_threshold): Brute force
# - Faster for small datasets
# - No index overhead

# Large collections (≥ full_scan_threshold): HNSW  
# - Scales to millions of vectors
# - Approximate but very fast
```

## Performance Characteristics

### Time Complexity

| Operation | Brute Force | HNSW |
|-----------|-------------|------|
| Insert | O(1) | O(log n) |
| Search | O(n) | O(log n) |
| Memory | O(n) | O(n × M) |

### Real-world Performance

```python
# Example performance comparison
import time

def benchmark_search(collection_name, queries, ef_value):
    """Benchmark search with different ef values"""
    
    # Update search parameters
    client.update_collection(
        collection_name=collection_name,
        hnsw_config=HnswConfig(ef=ef_value)
    )
    
    start_time = time.time()
    
    for query in queries:
        results = client.search(
            collection_name=collection_name,
            query_vector=query,
            limit=10
        )
    
    end_time = time.time()
    avg_time = (end_time - start_time) / len(queries)
    
    return avg_time

# Test different ef values
ef_values = [32, 64, 128, 256]
for ef in ef_values:
    avg_time = benchmark_search("my_collection", test_queries, ef)
    print(f"ef={ef}: {avg_time:.3f}s per query")
```

## Optimizing HNSW Performance

### For Build Speed

```python
# Fast building (development/testing)
fast_config = HnswConfig(
    m=8,            # Fewer connections
    ef_construct=100,  # Less build effort
)
```

### For Search Quality

```python
# High quality (production)
quality_config = HnswConfig(
    m=32,           # More connections  
    ef_construct=400,  # More build effort
)
```

### For Memory Efficiency

```python
# Memory optimized
memory_config = HnswConfig(
    m=8,            # Fewer connections = less memory
    ef_construct=150,
)
```

## Optimizing for Different Workloads

- High‑speed retrieval: lower `m` and `ef`, with `ef_construct` tuned for acceptable recall.
- Maximum accuracy: higher `m` and `ef`, accepting more latency.
- Memory‑constrained: reduce `m`, and balance `ef_construct` to avoid over‑spending memory during build.

## Understanding Search Quality

### Recall vs Speed Trade-off

```python
def measure_recall(collection_name, test_queries, ground_truth, ef_value):
    """Measure recall at different ef values"""
    
    # Update ef parameter
    client.update_collection(
        collection_name=collection_name,
        hnsw_config=HnswConfig(ef=ef_value)
    )
    
    correct_results = 0
    total_results = 0
    
    for i, query in enumerate(test_queries):
        results = client.search(
            collection_name=collection_name,
            query_vector=query,
            limit=10
        )
        
        # Compare with ground truth
        found_ids = {r.id for r in results}
        true_ids = set(ground_truth[i][:10])  # Top 10 true results
        
        correct_results += len(found_ids.intersection(true_ids))
        total_results += len(true_ids)
    
    recall = correct_results / total_results
    return recall

# Test recall vs speed
for ef in [32, 64, 128, 256, 512]:
    recall = measure_recall("test_collection", queries, ground_truth, ef)
    speed = benchmark_search("test_collection", queries, ef)
    print(f"ef={ef}: recall={recall:.3f}, speed={speed:.3f}s")
```

## Best Practices

### 1. Start with Defaults

```python
# Qdrant's defaults work well for most cases
default_config = HnswConfig(
    m=16,
    ef_construct=200,
)
```

### 2. Tune Based on Requirements

```python
# High-throughput applications
fast_config = HnswConfig(m=8, ef_construct=100)

# High-accuracy applications  
accurate_config = HnswConfig(m=32, ef_construct=400)

# Memory-constrained environments
memory_config = HnswConfig(m=8, ef_construct=150)
```

### 3. Test with Your Data

```python
# Always benchmark with your specific:
# - Vector dimensions
# - Data distribution  
# - Query patterns
# - Hardware constraints
```

## Memory & Indexing Behavior

Qdrant stores only indexed vectors in the HNSW graph. It’s normal to observe `indexed_vectors_count < vectors_count` when small segments haven’t reached the `indexing_threshold` yet. Small collections or very low‑dimensional vectors may skip HNSW entirely; Qdrant will use full‑scan search until indexing is beneficial.

## Inspecting Performance and Index Use

Use `get_collection` to check index status and payload indexes. If queries feel slow, verify that your filtered fields have payload indexes and that filter cardinality isn’t forcing an unintended full scan.

```python
info = client.get_collection("products")
print(info.vectors_count, info.indexed_vectors_count)
# Inspect info.hnsw_config, payload indexes, and optimizer thresholds
```

## HNSW in Action: Why It’s Fast & Scalable

- Logarithmic‑like search scaling: HNSW queries grow ~O(log N) instead of O(N), keeping million‑scale queries in milliseconds.
- Filter‑compatible: Qdrant extends HNSW with filter‑aware indexing (Filterable HNSW), enabling fast searches with structured predicates without falling back to full scans.
- Update‑friendly: supports real‑time inserts and high recall, ideal for semantic search, recommendations, and image retrieval.

## Collection Definition and Parameters

How many collections should you create? In most cases, a single collection per domain is best. Multiple collections increase memory and operational cost because each maintains its own indexes and payload structures. Create multiple collections only when:

- Datasets have different vector sizes or distance metrics.
- You need strong isolation due to security or radically different usage.

Otherwise, consolidate into one collection to simplify operations and reduce overhead.

## When NOT to Use HNSW

### Small Collections
```python
# For < 10,000 vectors, brute force is often faster
small_config = VectorParams(
    size=384,
    distance=Distance.COSINE,
    # No hnsw_config = automatic brute force
)
```

### Exact Search Requirements
```python
# When you need exactly perfect results
# (HNSW is approximate)
```

### Extreme Memory Constraints
```python
# HNSW uses M * vector_count additional memory
# For very tight memory budgets, consider alternatives
```

## What's Next?

Now you understand how HNSW makes vector search fast. Next, we'll learn how to combine this speed with complex filtering.

[**Next: Filterable HNSW →**](../filterable-hnsw/) 