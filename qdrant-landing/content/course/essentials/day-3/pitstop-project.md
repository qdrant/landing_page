---
title: Create a Hybrid Search Engine
weight: 5
---

{{< date >}} Day 3 {{< /date >}}

# Project: Hybrid Search System

Build a hybrid system that combines dense and sparse vectors with Reciprocal Rank Fusion, demonstrating how to get the best of both semantic understanding and keyword precision.

## Your Mission

Create a production-ready hybrid search system that leverages both dense and sparse vectors to deliver superior search results. You'll implement the complete hybrid pipeline and compare its performance against single-vector approaches.

**Estimated Time:** 75 minutes

## What You'll Build

A hybrid search system that demonstrates:

- **Dense vector search** for semantic understanding
- **Sparse vector search** for exact keyword matching  
- **Reciprocal Rank Fusion** to combine results intelligently
- **Performance comparison** between hybrid and single-vector approaches
- **Domain optimization** for your specific use case

## Implementation Steps

### Step 1: Set Up Hybrid Collection

Build on your previous work by creating a collection with both dense and sparse vectors:

```python
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
import time

client = QdrantClient(
    "https://your-cluster-url.cloud.qdrant.io", 
    api_key="your-api-key"
)

# Create hybrid collection
client.create_collection(
    collection_name="hybrid_search",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE)
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            index=models.SparseIndexParams(on_disk=False)
        )
    }
)
```

### Step 2: Implement Dense and Sparse Encoding

```python
# Dense embeddings
encoder = SentenceTransformer("all-MiniLM-L6-v2")

# Simple sparse encoding (BM25-style)
def create_sparse_vector(text, vocabulary=None):
    """Create sparse vector from text using term frequency"""
    from collections import Counter
    import re
    
    # Simple tokenization
    words = re.findall(r'\b\w+\b', text.lower())
    word_counts = Counter(words)
    
    # Convert to sparse vector format
    if vocabulary is None:
        # Create simple vocabulary from unique words
        vocabulary = {word: i for i, word in enumerate(set(words))}
    
    indices = []
    values = []
    
    for word, count in word_counts.items():
        if word in vocabulary:
            indices.append(vocabulary[word])
            values.append(float(count))
    
    return models.SparseVector(indices=indices, values=values)

# Upload hybrid data
points = []
for i, item in enumerate(your_dataset):
    dense_vector = encoder.encode(item["description"]).tolist()
    sparse_vector = create_sparse_vector(item["description"])
    
    points.append(models.PointStruct(
        id=i,
        vector={"dense": dense_vector},
        sparse_vector={"sparse": sparse_vector},
        payload=item
    ))

client.upload_points(collection_name="hybrid_search", points=points)
```

### Step 3: Implement Hybrid Search with RRF

```python
def hybrid_search_with_rrf(query_text, limit=10):
    """Perform hybrid search using Reciprocal Rank Fusion"""
    
    # Encode query for both dense and sparse
    query_dense = encoder.encode(query_text).tolist()
    query_sparse = create_sparse_vector(query_text)
    
    # Use Qdrant's built-in RRF
    response = client.query_points(
        collection_name="hybrid_search",
        prefetch=[
            models.Prefetch(
                query=query_dense,
                using="dense",
                limit=20
            ),
            models.Prefetch(
                query=query_sparse,
                using="sparse",
                limit=20
            )
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=limit
    )
    
    return response.points

# Test hybrid search
results = hybrid_search_with_rrf("your test query")
for i, point in enumerate(results, 1):
    print(f"{i}. {point.payload.get('title', 'No title')} (Score: {point.score:.3f})")
```

### Step 4: Compare Search Approaches

```python
def compare_search_methods(query_text):
    """Compare dense, sparse, and hybrid search results"""
    
    print(f"Query: '{query_text}'\n")
    
    # Dense-only search
    dense_results = client.query_points(
        collection_name="hybrid_search",
        query=encoder.encode(query_text).tolist(),
        using="dense",
        limit=5
    )
    
    # Sparse-only search  
    sparse_results = client.query_points(
        collection_name="hybrid_search",
        query=create_sparse_vector(query_text),
        using="sparse",
        limit=5
    )
    
    # Hybrid search
    hybrid_results = hybrid_search_with_rrf(query_text, limit=5)
    
    print("DENSE SEARCH:")
    for i, point in enumerate(dense_results.points, 1):
        print(f"  {i}. {point.payload.get('title', 'No title')} ({point.score:.3f})")
    
    print("\nSPARSE SEARCH:")
    for i, point in enumerate(sparse_results.points, 1):
        print(f"  {i}. {point.payload.get('title', 'No title')} ({point.score:.3f})")
    
    print("\nHYBRID SEARCH (RRF):")
    for i, point in enumerate(hybrid_results, 1):
        print(f"  {i}. {point.payload.get('title', 'No title')} ({point.score:.3f})")
    
    print("-" * 50)

# Test with different query types
test_queries = [
    "exact keyword match query",
    "semantic concept query", 
    "mixed keyword and concept query"
]

for query in test_queries:
    compare_search_methods(query)
```

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> Your hybrid collection contains both dense and sparse vectors  
<input type="checkbox"> You can perform searches using dense, sparse, and hybrid approaches  
<input type="checkbox"> RRF fusion combines results from both vector types effectively  
<input type="checkbox"> You can demonstrate cases where hybrid search outperforms single-vector approaches  
<input type="checkbox"> You understand the trade-offs between different search methods for your domain

## Optional Extensions

### Advanced Fusion Strategies

Test Distribution-Based Score Fusion (DBSF) as an alternative to RRF:

```python
# Compare RRF vs DBSF
dbsf_results = client.query_points(
    collection_name="hybrid_search",
    prefetch=[
        models.Prefetch(query=query_dense, using="dense", limit=20),
        models.Prefetch(query=query_sparse, using="sparse", limit=20)
    ],
    query=models.FusionQuery(fusion=models.Fusion.DBSF),
    limit=10
)
```

### Performance Benchmarking

Measure and compare search latencies:

```python
def benchmark_search_methods(query_text, iterations=10):
    """Benchmark different search approaches"""
    methods = {
        "dense": lambda: client.query_points(
            collection_name="hybrid_search",
            query=encoder.encode(query_text).tolist(),
            using="dense", limit=10
        ),
        "sparse": lambda: client.query_points(
            collection_name="hybrid_search", 
            query=create_sparse_vector(query_text),
            using="sparse", limit=10
        ),
        "hybrid": lambda: hybrid_search_with_rrf(query_text)
    }
    
    for method_name, method_func in methods.items():
        times = []
        for _ in range(iterations):
            start = time.time()
            method_func()
            times.append((time.time() - start) * 1000)
        
        avg_time = sum(times) / len(times)
        print(f"{method_name}: {avg_time:.2f}ms average")
```

### Custom Sparse Encoding

Implement more sophisticated sparse encoding:

```python
from sklearn.feature_extraction.text import TfidfVectorizer

def create_tfidf_sparse_vector(text, vectorizer):
    """Create sparse vector using TF-IDF"""
    tfidf_matrix = vectorizer.transform([text])
    coo_matrix = tfidf_matrix.tocoo()
    
    return models.SparseVector(
        indices=coo_matrix.col.tolist(),
        values=coo_matrix.data.tolist()
    )
```

## Key Questions to Answer

1. **In which scenarios does hybrid search outperform single-vector approaches?**
2. **How does RRF fusion affect the ranking compared to individual methods?**
3. **What are the latency trade-offs of hybrid vs single-vector search?**
4. **How does the quality of sparse encoding affect hybrid search results?**

*Content to be added* 