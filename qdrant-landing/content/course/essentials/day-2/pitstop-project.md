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

- **Strategic upload optimization**: Fast bulk loading with `m=0` → HNSW switching
- **HNSW parameter tuning**: Testing different `m` and `ef_construct` values for your data
- **Payload indexing impact**: Measuring filtering performance improvements
- **Domain-specific insights**: Understanding what works best for your content type

## Step-by-Step Implementation

### Step 1: Extend Your Day 1 Project

Start with your domain search engine from Day 1, or create a new one with 1000+ items:

```python
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
import time
import numpy as np

# Initialize (use Qdrant Cloud for better performance testing)
client = QdrantClient(
    "https://your-cluster-url.cloud.qdrant.io", 
    api_key="your-api-key"
)

encoder = SentenceTransformer("all-MiniLM-L6-v2")
```

### Step 2: Create Multiple Test Collections

Test different HNSW configurations to find what works best:

```python
# Test configurations
configs = [
    {"name": "fast_upload", "m": 0, "ef_construct": 100},
    {"name": "balanced", "m": 16, "ef_construct": 200}, 
    {"name": "high_quality", "m": 32, "ef_construct": 400},
    {"name": "memory_optimized", "m": 8, "ef_construct": 100}
]

for config in configs:
    collection_name = f"my_domain_{config['name']}"
    
    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        hnsw_config=models.HnswConfigDiff(
            m=config["m"],
            ef_construct=config["ef_construct"],
            full_scan_threshold=1000
        )
    )
    
    print(f"Created collection: {collection_name}")
```

### Step 3: Upload and Time the Process

Measure upload performance for each configuration:

```python
def upload_with_timing(collection_name, data, config_name):
    start_time = time.time()
    
    points = []
    for i, item in enumerate(data):
        embedding = encoder.encode(item["description"]).tolist()
        
        points.append(models.PointStruct(
            id=i,
            vector=embedding,
            payload={
                **item,
                "length": len(item["description"]),
                "word_count": len(item["description"].split()),
                "has_keywords": any(keyword in item["description"].lower() 
                                  for keyword in ["important", "key", "main"])
            }
        ))
    
    client.upload_points(collection_name=collection_name, points=points)
    upload_time = time.time() - start_time
    
    print(f"{config_name}: Uploaded {len(points)} points in {upload_time:.2f}s")
    return upload_time

# Upload to each collection
upload_times = {}
for config in configs:
    collection_name = f"my_domain_{config['name']}"
    upload_times[config['name']] = upload_with_timing(
        collection_name, your_dataset, config['name']
    )
```

### Step 4: Benchmark Search Performance

Test search speed with different `ef` values:

```python
def benchmark_search(collection_name, query_embedding, ef_values=[64, 128, 256]):
    results = {}
    
    for ef in ef_values:
        times = []
        
        # Run multiple queries for reliable timing
        for _ in range(5):
            start_time = time.time()
            
            response = client.query_points(
                collection_name=collection_name,
                query=query_embedding,
                limit=10,
                search_params=models.SearchParams(hnsw_ef=ef)
            )
            
            times.append((time.time() - start_time) * 1000)
        
        results[ef] = {
            "avg_time": np.mean(times),
            "min_time": np.min(times),
            "max_time": np.max(times)
        }
    
    return results

# Test with domain-specific queries
test_queries = [
    "your first test query",
    "your second test query", 
    "your third test query"
]

performance_results = {}
for config in configs:
    if config["m"] > 0:  # Skip m=0 collections for search tests
        collection_name = f"my_domain_{config['name']}"
        query_embedding = encoder.encode(test_queries[0]).tolist()
        
        performance_results[config['name']] = benchmark_search(
            collection_name, query_embedding
        )
```

### Step 5: Test Payload Indexing Impact

Measure filtering performance with and without indexes:

```python
def test_filtering_performance(collection_name):
    query_embedding = encoder.encode("your filter test query").tolist()
    
    # Test filter without index
    filter_condition = models.Filter(
        must=[
            models.FieldCondition(
                key="length",
                range=models.Range(gte=100, lte=500)
            )
        ]
    )
    
    # Timing without index
    start_time = time.time()
    response = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        query_filter=filter_condition,
        limit=10
    )
    time_without_index = (time.time() - start_time) * 1000
    
    # Create payload index
    client.create_payload_index(
        collection_name=collection_name,
        field_name="length",
        field_schema="integer"
    )
    
    # Timing with index
    start_time = time.time()
    response = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        query_filter=filter_condition,
        limit=10
    )
    time_with_index = (time.time() - start_time) * 1000
    
    return {
        "without_index": time_without_index,
        "with_index": time_with_index,
        "speedup": time_without_index / time_with_index
    }

# Test on your best performing collection
best_collection = "my_domain_balanced"  # Choose based on your results
filtering_results = test_filtering_performance(best_collection)
```

## Analysis Framework

### Performance Comparison

Create a summary of your findings:

```python
print("=" * 60)
print("PERFORMANCE OPTIMIZATION RESULTS")
print("=" * 60)

print("\n1. UPLOAD PERFORMANCE:")
for config_name, time_taken in upload_times.items():
    print(f"   {config_name}: {time_taken:.2f}s")

print("\n2. SEARCH PERFORMANCE (ef=128):")
for config_name, results in performance_results.items():
    if 128 in results:
        print(f"   {config_name}: {results[128]['avg_time']:.2f}ms")

print("\n3. FILTERING IMPACT:")
print(f"   Without index: {filtering_results['without_index']:.2f}ms")
print(f"   With index: {filtering_results['with_index']:.2f}ms")
print(f"   Speedup: {filtering_results['speedup']:.1f}x")
```

## Your Deliverables

### 1. Performance Report

Document your findings:

**Domain & Dataset:**
- Content type and size
- Why performance optimization matters for your use case
- Specific performance requirements (speed vs. accuracy)

**Configuration Results:**
```
Upload Performance:
- m=0: Fastest upload (X.Xs), enables bulk loading strategy
- m=16: Balanced upload/search (X.Xs)
- m=32: Slower upload (X.Xs) but potentially better accuracy

Search Performance:
- m=16: X.Xms average, good for real-time applications
- m=32: X.Xms average, better for batch processing
- ef tuning: ef=128 optimal for speed/accuracy balance

Filtering Impact:
- Payload indexes provided XXx speedup
- Critical for production filtering workloads
```

**Recommendations:**
- Best configuration for your specific use case
- When to use different settings
- Production deployment considerations

### 2. Share Your Discovery

Post in [Discord](https://discord.com/invite/qdrant) with:
- **Domain**: "I optimized performance for [your domain]"
- **Winner**: "Best config was m=X, ef_construct=Y because..."
- **Surprise**: "Most unexpected finding was..."
- **Impact**: "Payload indexes improved filtering by XXx"

## Key Questions to Answer

1. **Which HNSW configuration worked best for your domain?**
2. **How did upload vs. search performance trade off?**
3. **What was the impact of payload indexing?**
4. **How do your results compare to the DBpedia demo?**

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> You've tested multiple HNSW configurations with real timing data  
<input type="checkbox"> You can explain which settings work best for your domain and why  
<input type="checkbox"> You've measured the concrete impact of payload indexing  
<input type="checkbox"> You have clear recommendations for production deployment

## Optional Extensions

### Advanced HNSW Tuning
Test more granular parameters:

```python
# Test ef_construct impact on accuracy
# Test different distance metrics (cosine vs. dot product)
# Measure memory usage differences
```

### Production Considerations
```python
# Test with larger datasets (10K+ vectors)
# Measure concurrent query performance
# Test index rebuild time after updates
```

**Ready for production?** You now understand how to optimize Qdrant for your specific use case, balancing upload speed, search performance, and memory usage based on real measurements. 