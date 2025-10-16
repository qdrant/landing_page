---
title: "Project: Quantization Performance Optimization"
weight: 4
---

{{< date >}} Day 4 {{< /date >}}

# Project: Quantization Performance Optimization

Apply quantization techniques to your domain search engine and measure the real-world impact on speed, memory, and accuracy. You'll discover how different quantization methods affect your specific use case and learn to optimize the accuracy recovery pipeline.

## Your Mission

Transform your search engine from previous days into a production-ready system by implementing quantization optimization. You'll test different quantization methods, measure performance impacts, and tune the oversampling + rescoring pipeline for optimal results.

**Estimated Time:** 120 minutes

## What You'll Build

A quantization-optimized search system that demonstrates:

- **Performance comparison**: Before and after quantization metrics
- **Method evaluation**: Testing scalar and binary quantization on your data
- **Accuracy recovery**: Implementing oversampling and rescoring pipeline
- **Production deployment**: Memory-optimized storage configuration

## Build Steps
### Step 1: Baseline Measurement

Start by measuring your current system's performance without quantization:

```python
from qdrant_client import QdrantClient, models
import time
import numpy as np

client = QdrantClient(
    "https://your-cluster-url.cloud.qdrant.io", 
    api_key="your-api-key"
)

def measure_search_performance(collection_name, test_queries, label="Baseline"):
    """Measure search performance across multiple queries"""
    latencies = []

    # Don't forget to warm up caches!

    #response = client.query_points(
    #        collection_name=collection_name,
    #        query=query,
    #        limit=10
    #    )
    
    for query in test_queries:
        start_time = time.time()
        
        response = client.query_points(
            collection_name=collection_name,
            query=query,
            limit=10
        )
        
        latency = (time.time() - start_time) * 1000
        latencies.append(latency)
    
    avg_latency = np.mean(latencies)
    p95_latency = np.percentile(latencies, 95)
    
    print(f"{label}:")
    print(f"  Average latency: {avg_latency:.2f}ms")
    print(f"  P95 latency: {p95_latency:.2f}ms")
    print(f"  Memory usage: Check Qdrant Cloud dashboard")
    
    return {"avg": avg_latency, "p95": p95_latency}

# Measure baseline performance
baseline_metrics = measure_search_performance(
    "your_domain_collection", 
    your_test_queries, 
    "Baseline (No Quantization)"
)
```

### Step 2: Test Quantization Methods

Create collections with different quantization methods to compare their impact:

> Note: When creating several collections for educational purposes with different quantization configurations (e.g., original, binary quantized, scalar quantized, 2-bit binary quantized), make sure to monitor available resources. The original vectors are stored for each collection (on disk in this case), in addition to their quantized versions.

```python
# Test configurations
quantization_configs = {
    "scalar": {
        "config": models.ScalarQuantization(
            scalar=models.ScalarQuantizationConfig(
                type=models.ScalarType.INT8,
                quantile=0.99,
                always_ram=True,
            )
        ),
        "expected_speedup": "2x",
        "expected_compression": "4x"
    },
    "binary": {
        "config": models.BinaryQuantization(
            binary=models.BinaryQuantizationConfig(
                encoding=models.BinaryQuantizationEncoding.ONE_BIT,
                always_ram=True,
            )
        ),
        "expected_speedup": "40x",
        "expected_compression": "32x"
    },
    "binary_2bit": {
        "config": models.BinaryQuantization(
            binary=models.BinaryQuantizationConfig(
                encoding=models.BinaryQuantizationEncoding.TWO_BITS,
                always_ram=True,
            )
        ),
        "expected_speedup": "20x",
        "expected_compression": "16x"
    }
}

# Create quantized collections
for method_name, config_info in quantization_configs.items():
    collection_name = f"quantized_{method_name}"
    
    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=1536,  # Adjust to your embedding size
            distance=models.Distance.COSINE,
            on_disk=True,  # Store originals on disk
        ),
        quantization_config=config_info["config"]
    )
    
    print(f"Created {method_name} quantized collection: {collection_name}")
```

### Step 3: Upload Data and Measure Impact

Upload your dataset to each quantized collection and measure the performance differences:

```python
def benchmark(collection_name, your_test_queries, method_name):
    """Measure quantized search performance"""
    
    # Test without oversampling/rescoring first
    no_rescoring_metrics = measure_search_performance(
        collection_name, 
        your_test_queries, 
        f"{method_name} (No Rescoring)"
    )
    
    # Test with oversampling and rescoring
    def search_with_rescoring(collection_name, query, oversampling_factor=3.0):
        start_time = time.time()
        
        response = client.query_points(
            collection_name=collection_name,
            query=query,
            limit=10,
            search_params=models.SearchParams(
                quantization=models.QuantizationSearchParams(
                    rescore=True,
                    oversampling=oversampling_factor,
                )
            ),
        )
        
        return (time.time() - start_time) * 1000, response
    
    # Measure with rescoring
    rescoring_latencies = []
    for query in your_test_queries:
        latency, response = search_with_rescoring(collection_name, query)
        rescoring_latencies.append(latency)
    
    avg_rescoring = np.mean(rescoring_latencies)
    p95_rescoring = np.percentile(rescoring_latencies, 95)
    
    print(f"{method_name} (With Rescoring):")
    print(f"  Average latency: {avg_rescoring:.2f}ms")
    print(f"  P95 latency: {p95_rescoring:.2f}ms")
    
    return {
        "no_rescoring": no_rescoring_metrics,
        "with_rescoring": {"avg": avg_rescoring, "p95": p95_rescoring}
    }


# Upload your data (same as it was done in the previous days for a basic unquantized collection) in each collection

# Test each quantization method
quantization_results = {}
for method_name in quantization_configs.keys():
    collection_name = f"quantized_{method_name}"
    quantization_results[method_name] = benchmark(
        collection_name, your_test_queries, method_name
    )
```

### Step 4: Optimize Oversampling Factors

Find the optimal oversampling factor for your best-performing quantization method, based on the balance between latency and retained accuracy:

```python
def measure_accuracy_retention(original_collection, quantized_collection, test_queries, factors=[2, 3, 5, 8, 10]):
    """Compare search results between original and quantized collections"""

    results = {}

    for factor in factors:
        accuracy_scores = []
        
        for query in test_queries:
            # Get baseline results
            baseline_results = client.query_points(
                collection_name=original_collection,
                query=query,
                limit=10
            )
            baseline_ids = [point.id for point in baseline_results.points]

            # Get quantized results with rescoring
            quantized_results = client.query_points(
                collection_name=quantized_collection,
                query=query,
                limit=10,
                search_params=models.SearchParams(
                    quantization=models.QuantizationSearchParams(
                        rescore=True,
                        oversampling=factor,
                    )
                ),
            )
            quantized_ids = [point.id for point in quantized_results.points]
            
            # Calculate overlap (simple accuracy measure)
            overlap = len(set(baseline_ids) & set(quantized_ids))
            accuracy = overlap / len(baseline_ids)
            accuracy_scores.append(accuracy)
        
        results[factor] = {
            "avg_accuracy": np.mean(accuracy_scores)
        }
    
    return results


def tune_oversampling(collection_name, test_queries, factors=[2, 3, 5, 8, 10]):
    """Find optimal oversampling factor"""
    results = {}
    
    for factor in factors:
        latencies = []
        
        for query in test_queries:
            start_time = time.time()
            
            response = client.query_points(
                collection_name=collection_name,
                query=query,
                limit=10,
                search_params=models.SearchParams(
                    quantization=models.QuantizationSearchParams(
                        rescore=True,
                        oversampling=factor,
                    )
                ),
            )
            
            latencies.append((time.time() - start_time) * 1000)
        
        results[factor] = {
            "avg_latency": np.mean(latencies),
            "p95_latency": np.percentile(latencies, 95)
        }
    
    return results

# Tune oversampling for your method of choice
best_method = "binary"  # Choose based on your results
oversampling_factors = [2, 3, 5, 8, 10]

oversampling_results_latency = tune_oversampling(
    f"quantized_{best_method}", 
    your_test_queries,
    oversampling_factors
)

oversampling_results_accuracy = measure_accuracy_retention(
    "your_domain_collection",
    f"quantized_{best_method}", 
    your_test_queries,
    oversampling_factors
)


print("Oversampling Factor Optimization:")
for factor in oversampling_factors:
    print(f"  {factor}x:")
    print(f"  {oversampling_results_latency[factor]['avg_latency']:.2f}ms avg latency, {oversampling_results_latency[factor]['p95_latency']:.2f}ms P95 latency")
    print(f"  {oversampling_results_accuracy[factor]['avg_accuracy']:.2f} avg accuracy retention")
```

## Analysis Framework

Create a comprehensive analysis of your quantization experiments:

```python
print("=" * 60)
print("QUANTIZATION PERFORMANCE ANALYSIS")
print("=" * 60)

print(f"\nBaseline Performance:")
print(f"  Average latency: {baseline_metrics['avg']:.2f}ms")
print(f"  P95 latency: {baseline_metrics['p95']:.2f}ms")

print(f"\nQuantization Results:")
for method, results in quantization_results.items():
    no_rescoring = results['no_rescoring']
    with_rescoring = results['with_rescoring']
    
    speedup_no_rescoring = baseline_metrics['avg'] / no_rescoring['avg']
    speedup_with_rescoring = baseline_metrics['avg'] / with_rescoring['avg']
    
    print(f"\n{method.upper()}:")
    print(f"  Without rescoring: {no_rescoring['avg']:.2f}ms ({speedup_no_rescoring:.1f}x speedup)")
    print(f"  With rescoring: {with_rescoring['avg']:.2f}ms ({speedup_with_rescoring:.1f}x speedup)")
```

## Your Deliverables

Document your quantization optimization results:

**Domain & Dataset:**
- Content type and size
- Embedding model and dimensions
- Why quantization matters for your use case

**Quantization Method Comparison:**
```bash
Example format:

Baseline (No Quantization):
- Average latency: X.Xms
- P95 latency: X.Xms
- Memory usage: X GB RAM

Scalar Quantization:
- Average latency: X.Xms (Xx speedup)
- Memory reduction: 4x compression
- Accuracy impact: Minimal

Binary Quantization:
- Average latency: X.Xms (XXx speedup)
- Memory reduction: 32x compression
- Accuracy impact: Recovered with Xx oversampling

Optimal Configuration:
- Method: XX quantization
- Oversampling factor: Xx
- Final speedup: XXx with YY% accuracy retention
```

**Key Insights:**
- Which quantization method worked best for your domain and why
- How oversampling factor affected the accuracy/speed tradeoff
- RAM savings achieved with quantization

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> You've achieved measurable search speed improvements  
<input type="checkbox"> You've maintained acceptable accuracy through oversampling optimization  
<input type="checkbox"> You've demonstrated significant hot memory savings with `on_disk` configuration  
<input type="checkbox"> You can make informed recommendations about quantization for your domain


## Key Questions to Answer

1. **Which quantization method delivered the best speed/accuracy tradeoff for your domain?**
2. **How did oversampling factor affect your results?**
3. **What was the real-world memory and cost impact?**
4. **How do your results compare to the theoretical maximums (40x speedup, 32x compression)?**


## Share Your Discovery

**Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **with:**
- **Domain**: "I optimized [your domain] search with quantization"
- **Winner**: "Best method was [X] quantization with [Y]x oversampling"
- **Performance**: "Achieved [Z]x speedup with [A]% accuracy retention"
- **Surprise**: "Most unexpected finding was..."


## Advanced Challenges

### Challenge 1: Dynamic Oversampling

Implement adaptive oversampling based on query characteristics:

```python
def adaptive_oversampling(query, base_factor=3.0):
    """Adjust oversampling based on query complexity"""
    # Simple heuristic: longer queries may need more oversampling (adapt to your domain/use case)
    query_length = len(query) if isinstance(query, str) else len([x for x in query if x != 0])
    
    if query_length > 1000:  # Complex query
        return base_factor * 1.5
    elif query_length < 100:  # Simple query
        return base_factor * 0.8
    else:
        return base_factor

# Test adaptive oversampling vs fixed oversampling
```

### Challenge 2: Cost-Performance Analysis

Calculate the true cost impact of quantization:

```python
def calculate_cost_savings(baseline_memory_gb, compression_ratio, ram_cost_per_gb_monthly=10):
    """Calculate monthly cost savings from quantization"""
    quantized_memory_gb = baseline_memory_gb / compression_ratio
    monthly_savings = (baseline_memory_gb - quantized_memory_gb) * ram_cost_per_gb_monthly
    
    return {
        "baseline_cost": baseline_memory_gb * ram_cost_per_gb_monthly,
        "quantized_cost": quantized_memory_gb * ram_cost_per_gb_monthly,
        "monthly_savings": monthly_savings,
        "annual_savings": monthly_savings * 12
    }

# Calculate cost impact for your deployment
cost_analysis = calculate_cost_savings(
    baseline_memory_gb=10,  # Your baseline memory usage
    compression_ratio=32,   # Your best quantization compression
)

print(f"Annual cost savings: ${cost_analysis['annual_savings']:.2f}")
```

## Optional Extensions

### Memory Usage Monitoring

Track actual memory usage changes:

```python
# Monitor collection memory usage
collection_info = client.get_collection("quantized_binary")
print(f"Vectors count: {collection_info.points_count}")
print(f"Memory usage: Check Qdrant Cloud metrics")

# Compare RAM usage with and without on_disk configuration
```

**Ready for production?** You now understand how to optimize vector search performance through quantization while maintaining the accuracy your applications require. 