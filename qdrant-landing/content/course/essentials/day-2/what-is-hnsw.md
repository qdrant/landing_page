---
title: Understanding HNSW
weight: 1
---

{{< date >}} Day 2 {{< /date >}}

# HNSW Algorithm

At this point, you've learned how vector search retrieves the most similar vectors to a query using distance metrics like cosine similarity, dot product, or Euclidean distance. But how exactly does this work under the hood?

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## The Vector Search Challenge

You might wonder if Qdrant calculates the distance to every single vector in your collection for each query. This method, known as brute force search, technically works, but it has a major drawback: efficiency.

If your collection contains millions or even billions of vectors, performing a single retrieval would mean calculating distances millions or billions of times. This makes brute force search impractical for large-scale vector search.

Fortunately, Qdrant takes a smarter approach using an efficient method called **[HNSW - Hierarchical Navigable Small World](/documentation/concepts/indexing/#vector-index)**.

## The Library Analogy

To understand HNSW, imagine walking into a library with millions of books, looking for a specific book based on a brief description of the content. If the books were all piled up randomly, you'd have to check every book individually to find the one that matches your description best - that's brute force. While it would eventually work, it would take forever.

But libraries aren't organized like that. They're structured to naturally guide you to the right section. You walk into a library and at the top level, you choose whether your book is in the fiction or nonfiction section. Then, you narrow it down by genre - history, science, or biography. After that, you move to more specific subcategories or alphabetical order until you reach the exact shelf where your book is located.

<img src="/courses/day2/library-hierarchy.png" alt="Library organization hierarchy" width="600">

## How HNSW Works

HNSW works similarly by building a multi-layered graph where each vector is a node. The idea is that the graph has a hierarchical structure, where the top layer contains a smaller number of nodes that are broadly connected, and each lower layer has more nodes with increasingly specific connections.

<img src="/courses/day2/hnsw-layers.png" alt="HNSW multi-layer structure" width="700">

### The Search Process

When a query is performed, HNSW starts from an entry point at the top layer and navigates down through the graph, progressively moving from broader to more precise connections. At each layer, the algorithm explores the nearest neighbors of the current node to determine the best path forward. It continues this process, refining the search as it descends through the layers, until it reaches the lowest level, where it selects the final nearest neighbors.

This way, Qdrant avoids brute force and efficiently narrows down the search space, making large-scale vector search fast and practical.

### Real-World Example

Imagine your query is the embedding of "striped blue shirt made of cotton." The search begins at the entry point in the top layer of the graph. At this level, vectors are loosely grouped by broad categories like clothing or accessories.

The algorithm searches for a neighbor that's closer to the query vector than the current node using your chosen distance metric. If it finds one, it moves to that neighbor and repeats the process. Once the current node is the best candidate at that layer, the algorithm descends to the next layer.

Each time the search becomes more refined, narrowing down to "shirts" first, then further by characteristics like "blue" and "striped." At the deepest layer, it hones in on the most precise match: a cotton maritime shirt.

<img src="/courses/day2/hnsw-search-process.png" alt="HNSW search refinement process" width="700">

## Tuning HNSW for Search Efficiency

We can fine-tune how our HNSW graph is built to balance search speed, accuracy, memory usage, and indexing time, depending on our use case needs. Qdrant allows you to control how the HNSW index behaves with three key parameters: `m`, `ef`, and `ef_construct`.

### The m Parameter: Structuring the Graph

The `m` parameter controls the maximum number of connections per node in the graph. Think of it as deciding how many paths each vector should maintain to its neighbors.

**Increasing m** results in a denser graph where each vector is connected to more neighbors, which improves search accuracy because the graph has more pathways to traverse, making it less likely to miss relevant vectors. However, this also increases memory usage and indexing time since more connections must be maintained.

**Decreasing m** makes the graph sparser, reducing memory and speeding up insertion. However, search may become less accurate since fewer paths are available for traversal.

```python
from qdrant_client.models import HnswConfig

# Different m values for different needs
fast_config = HnswConfig(m=8)      # Faster build, less memory, lower recall
balanced_config = HnswConfig(m=16) # Default - good balance
accurate_config = HnswConfig(m=32) # Better recall, more memory, slower build
```

In practice, `m` usually ranges between 8 and 64. Choosing the right value is a trade-off between accuracy and memory efficiency.

### The ef_construct Parameter: Building the Graph

When adding a new vector to the HNSW index, the goal is to integrate it efficiently while preserving the graph's structure and performance. The `ef_construct` parameter determines how thoroughly the graph is built when adding a new vector by controlling the number of nearest neighbors considered during insertion.

**Higher ef_construct** means more neighbors are evaluated, resulting in a more comprehensive and accurate graph. However, this also makes the indexing process slower and more computationally demanding.

**Lower ef_construct** speeds up the insertion process, but the graph may end up with less optimal connections, which can impact search accuracy.

```python
# ef_construct examples
fast_build = HnswConfig(ef_construct=100)  # Faster indexing, lower quality
balanced_build = HnswConfig(ef_construct=200) # Default balance
quality_build = HnswConfig(ef_construct=400)  # Slower indexing, higher quality
```

Choosing the right `ef_construct` value balances indexing speed and graph quality. For most cases, values between 100 and 500 work well, but more complex data may need higher values to maintain reliable connections.

### The ef Parameter: Controlling Search Quality

The `ef` parameter determines the number of candidate neighbors evaluated during a search query.

**Higher ef values** lead to more accurate search results since the algorithm explores a larger neighborhood. However, they also increase query time because more nodes are processed.

**Lower ef values** speed up the search but may reduce accuracy since fewer candidate vectors are considered.

```python
# ef is set at search time, not build time
from qdrant_client.models import SearchParams

# Different ef values for different needs
fast_search = SearchParams(hnsw_ef=32)   # Very fast, lower recall
balanced_search = SearchParams(hnsw_ef=128) # Good balance
accurate_search = SearchParams(hnsw_ef=256) # Higher recall, slower
```

The ideal `ef` value typically ranges from 50 to 200, depending on your use case and how much accuracy you're willing to trade for speed.

## Parameter Summary

| Parameter | Description | Effect on Performance |
|-----------|-------------|----------------------|
| **m** | Number of connections per node | Higher m improves accuracy but increases memory usage |
| **ef_construct** | Number of neighbors considered during index build | Higher ef_construct results in better recall but longer indexing times |
| **ef** | Number of candidates explored during search | Higher ef improves accuracy at the cost of slower query times |

## Optimizing for Different Workloads

**For high-speed retrieval:** Lower `m` and `ef`, with `ef_construct` optimized for acceptable recall.

**For maximum accuracy:** Increase `m` and `ef`, accepting slower query speeds.

**For memory-constrained systems:** Reduce `m` while balancing `ef_construct` to avoid excessive memory consumption.

## Memory & Indexing Behavior

Qdrant optimizes memory by storing only indexed vectors in the HNSW graph. Some collections may contain vectors that are not yet indexed due to optimizer settings:

- `indexed_vectors_count < vectors_count` is expected behavior if non-indexed vectors don't exceed the `indexing_threshold` (in kB)
- Small collections or low-dimensional vectors may not trigger HNSW indexing at all
- In such cases, full-scan search (brute force) is used instead until indexing becomes beneficial

## Inspecting Performance and Index Use

To see whether your data is actually indexed, use `get_collection`. This returns fields like `vectors_count`, `indexed_vectors_count`, and your current HNSW config. It also lists any payload indexes you created.

If your queries feel slow, check whether the fields you're filtering on have indexes and confirm that filter cardinality isn't forcing an unintended brute force approach.

```python
# Inspect collection status
info = client.get_collection("products")
print(f"Total vectors: {info.vectors_count}")
print(f"Indexed vectors: {info.indexed_vectors_count}")
print(f"HNSW config: {info.config.hnsw_config}")

# Check if indexing is complete
if info.indexed_vectors_count < info.vectors_count:
    print("Some vectors are not yet indexed - this is normal for recent uploads")
```

## HNSW in Action: Why It's Fast & Scalable

### Logarithmic Search Scaling
Unlike brute force search (O(N)), HNSW achieves approximately O(log N) time complexity. This makes million-scale datasets searchable in milliseconds rather than minutes.

### Filter-Compatible
Qdrant extends HNSW with filter-aware indexing (Filterable HNSW), allowing fast searches with structured conditions. This eliminates the need for costly full scans when filtering by metadata.

### Efficient for Large-Scale Applications
- Supports real-time updates while maintaining high recall
- Ideal for semantic search, recommendation systems, and image retrieval
- Scales efficiently from thousands to billions of vectors

## Collection Design Best Practices

### How Many Collections Should You Create?

In most cases, you should use a single collection per domain. Creating multiple collections can significantly increase memory usage and operational complexity, as each collection maintains its own independent vector index and payload structures.

**Multiple collections are justified only if:**
- Your datasets use significantly different vector dimensions or distance metrics
- You need strong isolation between datasets due to distinct usage scenarios or security requirements

Otherwise, consolidating data into one collection simplifies operations and reduces overhead.

### Practical Configuration Examples

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://your-cluster.cloud.qdrant.io", api_key="your-key")

# Production-ready configuration
client.create_collection(
    collection_name="production_vectors",
    vectors_config=models.VectorParams(
        size=768,
        distance=models.Distance.COSINE,
        hnsw_config=models.HnswConfig(
            m=16,                    # Balanced connections
            ef_construct=200,        # Good build quality
            full_scan_threshold=10000 # Use brute force below this size
        )
    )
)

# Development/testing configuration (faster builds)
client.create_collection(
    collection_name="dev_vectors", 
    vectors_config=models.VectorParams(
        size=384,
        distance=models.Distance.COSINE,
        hnsw_config=models.HnswConfig(
            m=8,           # Fewer connections for speed
            ef_construct=100 # Faster builds
        )
    )
)
```

## Performance Benchmarking

```python
import time

def benchmark_search_performance(collection_name, test_queries, ef_values):
    """Benchmark search performance across different ef values"""
    
    results = {}
    
    for ef in ef_values:
        start_time = time.time()
        
        for query in test_queries:
            client.query_points(
                collection_name=collection_name,
                query=query,
                limit=10,
                search_params=models.SearchParams(hnsw_ef=ef)
            )
        
        avg_time = (time.time() - start_time) / len(test_queries)
        results[ef] = avg_time
        print(f"ef={ef}: {avg_time:.3f}s per query")
    
    return results

# Test different ef values
ef_values = [32, 64, 128, 256]
performance = benchmark_search_performance("my_collection", test_queries, ef_values)
```

## When NOT to Use HNSW

### Small Collections
For collections with fewer than 10,000 vectors, brute force search is often faster and uses less memory than building an HNSW index.

### Exact Search Requirements
HNSW is an approximate algorithm. If you need exactly perfect results every time, brute force search guarantees complete accuracy.

### Extreme Memory Constraints
HNSW uses additional memory proportional to `M × vector_count`. For very tight memory budgets, consider alternatives or reduce the `m` parameter.

## Key Takeaways

1. **HNSW transforms O(N) brute force into O(log N) graph navigation**
2. **The `m` parameter controls graph density** - more connections improve accuracy but use more memory
3. **`ef_construct` affects build quality** - higher values create better graphs but take longer to build
4. **`ef` controls search thoroughness** - tune at query time for the speed/accuracy trade-off you need
5. **Monitor `indexed_vectors_count`** to ensure your data is actually using HNSW indexing
6. **Use single collections when possible** to reduce operational complexity

## What's Next

Now you understand how HNSW makes vector search fast and scalable. Next, we'll learn how to combine this speed with complex filtering using Qdrant's Filterable HNSW approach.

Ready to see how HNSW handles real-world filtering scenarios? Let's continue!

Learn more: [HNSW in Qdrant Documentation](https://qdrant.tech/documentation/concepts/indexing/#vector-index) 