---
title: "Project: HNSW Performance Benchmarking"
weight: 4
---

{{< date >}} Day 2 {{< /date >}}

# Project: HNSW Performance Benchmarking

Now that you've seen how [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) parameters and payload indexes affect performance with the DBpedia dataset, it's time to optimize for your own domain and use case.

## Your Mission

Build on your Day 1 search engine by adding performance optimization. You'll discover which HNSW settings work best for your specific data and queries, and measure the real impact of payload indexing.

**Estimated Time:** 90 minutes

## What You'll Build

A performance-optimized version of your Day 1 search engine that demonstrates:

- **Fast bulk load**: Load with `m=0`, then switch to HNSW
- **HNSW parameter tuning**: Try different `m` and `ef_construct`
- **Payload indexing impact**: Time filtering with and without indexes
- **Domain findings**: What works best for your content

## Build Steps

### Step 1: Extend Your Day 1 Project

Start with your domain search engine from Day 1, or create a new one with 1000+ items:

```python
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
import time
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize (use Qdrant Cloud for better performance testing)
client = QdrantClient(os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])

encoder = SentenceTransformer("all-MiniLM-L6-v2")
```

### Step 2: Create Multiple Test Collections

Test different HNSW configurations to find what works best:

```python
# Test configurations
configs = [
    {"name": "fast_initial_upload", "m": 0, "ef_construct": 100},
    {"name": "memory_optimized", "m": 8, "ef_construct": 100},
    {"name": "balanced", "m": 16, "ef_construct": 200},
    {"name": "high_quality", "m": 32, "ef_construct": 400},
]

for config in configs:
    collection_name = f"my_domain_{config['name']}"
    if client.collection_exists(collection_name=collection_name):
        client.delete_collection(collection_name=collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        hnsw_config=models.HnswConfigDiff(
            m=config["m"], ef_construct=config["ef_construct"], full_scan_threshold=10
        ),
        optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0),
        strict_mode_config=models.StrictModeConfig(
            unindexed_filtering_retrieve=True, unindexed_filtering_update=True
        ),
    )
    print(f"Created collection: {collection_name}")
```

### Step 3: Upload and Time

Measure upload performance for each configuration:

```python
def upload_with_timing(collection_name, data, config_name):
    embeddings = [encoder.encode(dat["description"]).tolist() for dat in data]
    points = []
    for i, item in enumerate(data):
        embedding = embeddings[i]

        points.append(
            models.PointStruct(
                id=i,
                vector=embedding,
                payload={
                    **item,
                    "length": len(item["description"]),
                    "word_count": len(item["description"].split()),
                    "has_keywords": any(
                        keyword in item["description"].lower()
                        for keyword in ["important", "key", "main"]
                    ),
                },
            )
        )

    start_time = time.time()
    client.upload_points(collection_name=collection_name, points=points)
    upload_time = time.time() - start_time

    print(f"{config_name}: Uploaded {len(points)} points in {upload_time:.2f}s")
    return upload_time


# Load your dataset here
# your_dataset = [{"description": "This is a description of a product"}, ...]

# Upload to each collection
upload_times = {}
for config in configs:
    collection_name = f"my_domain_{config['name']}"
    upload_times[config["name"]] = upload_with_timing(
        collection_name, your_dataset, config["name"]
    )

# Wait for index to be built
def wait_for_index_built(collection_name, vectors_per_point=1):
    info = client.get_collection(collection_name=collection_name)
    count = 0
    while info.points_count * vectors_per_point - info.indexed_vectors_count != 0 and count < 10:
        time.sleep(1)
        info = client.get_collection(collection_name=collection_name)
        count += 1
    if count == 10:
        raise Exception(
            f"Indexed vectors count ({info.indexed_vectors_count}) is not equal to points count ({info.points_count}). Upload enough points to trigger index rebuild."
        )


for config in configs:
    collection_name = f"my_domain_{config['name']}"
    wait_for_index_built(collection_name)

```

### Step 4: Benchmark Search Performance

Test search speed with different `hnsw_ef` values:

```python
def benchmark_search(collection_name, query_embedding, ef_values=[64, 128, 256]):
    # Warmup
    _ = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        limit=10,
        search_params=models.SearchParams(hnsw_ef=ef_values[0]),
    )

    results = {}
    for hnsw_ef in ef_values:
        times = []

        # Run multiple queries for more reliable timing
        for _ in range(5):
            start_time = time.time()

            _ = client.query_points(
                collection_name=collection_name,
                query=query_embedding,
                limit=10,
                search_params=models.SearchParams(hnsw_ef=hnsw_ef),
            )

            times.append((time.time() - start_time) * 1000)

        results[hnsw_ef] = {
            "avg_time": np.mean(times),
            "min_time": np.min(times),
            "max_time": np.max(times),
        }

    return results


test_query = "your test query"
query_embedding = encoder.encode(test_query).tolist()

performance_results = {}
for config in configs:
    if config["m"] > 0:  # Skip m=0 collections for search
        collection_name = f"my_domain_{config['name']}"
        performance_results[config["name"]] = benchmark_search(
            collection_name, query_embedding
        )
```

### Step 5: Measure Payload Indexing Impact

Measure filtering performance with and without indexes:

```python
def test_filtering_performance(collection_name):
    query_embedding = encoder.encode("your filter test query").tolist()

    # Test filter without index
    filter_condition = models.Filter(
        must=[models.FieldCondition(key="length", range=models.Range(gte=100, lte=500))]
    )

    # Timing without payload index
    start_time = time.time()
    _ = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        query_filter=filter_condition,
        limit=10,
    )
    time_without_index = (time.time() - start_time) * 1000

    # Create payload index
    client.create_payload_index(
        collection_name=collection_name, field_name="length", field_schema="integer"
    )

    # Rebuild HNSW to attach filter data structures.
    # Note: This is not advised for production. Better create payload index before uploading any data to avoid rebuild.
    suffix = collection_name.replace("my_domain_", "")
    config = next((c for c in configs if c["name"] == suffix), None)

    client.update_collection(
        collection_name=collection_name, hnsw_config=models.HnswConfigDiff(m=0)
    )

    client.update_collection(
        collection_name=collection_name,
        hnsw_config=models.HnswConfigDiff(
            m=16,
            ef_construct=config["ef_construct"],
            full_scan_threshold=10,
            payload_m=None,
            max_indexing_threads=1,
        ),
        optimizers_config=models.OptimizersConfigDiff(vacuum_min_vector_number=0),
    )

    # Wait for index to be built
    wait_for_index_built(collection_name)

    # Timing with index
    start_time = time.time()
    _ = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        query_filter=filter_condition,
        limit=10,
    )
    time_with_index = (time.time() - start_time) * 1000

    return {
        "without_index": time_without_index,
        "with_index": time_with_index,
        "speedup": time_without_index / time_with_index,
    }


# Test on your best performing collection
best_collection = "my_domain_balanced"  # Choose based on your results
filtering_results = test_filtering_performance(best_collection)
```

## Analysis Framework
### Performance Analysis

Create a summary of your findings:

```python
print("=" * 60)
print("PERFORMANCE OPTIMIZATION RESULTS")
print("=" * 60)

print("\n1) Upload Performance:")
for config_name, time_taken in upload_times.items():
    print(f"   {config_name}: {time_taken:.2f}s")

print("\n2) Search Performance (hnsw_ef=128):")
for config_name, results in performance_results.items():
    if 128 in results:
        print(f"   {config_name}: {results[128]['avg_time']:.2f}ms")

print("\n3) Filtering Impact:")
print(f"   Without index: {filtering_results['without_index']:.2f}ms")
print(f"   With index: {filtering_results['with_index']:.2f}ms")
print(f"   Speedup: {filtering_results['speedup']:.1f}x")
```

## Your Deliverables

```md
**Domain & Dataset:**
- Content type and size
- Why performance optimization matters for your use case
- Specific performance requirements (speed vs. accuracy)

**Configuration Results:**
1) Upload Performance:
- m=0: X.Xs, fastest load, no HNSW index built, good for bulk load then build
- m=16: X.Xs, middle ground, balanced index build/search time
- m=32: X.Xs, slowest load, but potentially better accuracy

2) Search Performance:
- m=16: X.Xms average, good for real-time applications
- m=32: X.Xms average, higher accuracy on hard queries
- hnsw_ef: hnsw_ef=X gave best speed/accuracy balance

3) Filtering Impact:
- Payload indexes gave XXx speedup
- Needed for production filtering workloads

**Recommendations:**
- Best configuration for your specific use case
- When to pick different settings
- Production deployment considerations
```
## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> You've tested multiple HNSW configurations with real timing data  
<input type="checkbox"> You can explain which settings work best for your domain and why  
<input type="checkbox"> You've measured the concrete impact of payload indexing  
<input type="checkbox"> You have clear recommendations for production deployment

## Key Questions to Answer

1. Which HNSW configuration worked best for your domain?
2. How did upload (index building times) vs. search performance trade off?
3. What was the impact of payload indexing?
4. How do your results compare to the DBpedia demo?

## Share Your Discovery

**Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **with:**

- **Domain**: "I optimized performance for [your domain]"
- **Winner**: "Best config was m=X, ef_construct=Y because..."
- **Surprise**: "Most unexpected finding was..."
- **Impact**: "Payload indexes improved filtering by XXx"


## Optional Extensions

**Advanced HNSW Tuning**
Test more granular parameters:

```python
# Test ef_construct impact on accuracy
# Measure memory usage differences
```

**Ready for production?** You now understand how to optimize Qdrant for your specific use case, balancing upload speed, search performance, and memory usage based on real measurements. 


