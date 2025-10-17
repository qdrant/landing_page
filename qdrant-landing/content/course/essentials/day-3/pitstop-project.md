---
title: "Project: Building a Hybrid Search Engine"
weight: 5
---

{{< date >}} Day 3 {{< /date >}}

# Project: Building a Hybrid Search Engine

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

## Setup
### Prerequisites

* Qdrant Cloud cluster (URL + API key)
* Python 3.9+ (or Google Colab)
* Packages: `qdrant-client`, `sentence-transformers`

### Models

* Dense encoder: `sentence-transformers/all-MiniLM-L6-v2` (384-dim)

### Dataset

* A small domain dataset (e.g., 100–500 items) with at least:

  * `title` (string)
  * `description` (string) — used for both dense and sparse encoders
  * Optional metadata fields for later filtering

## Build Steps

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

collection_name = "day3_hybrid_search"

# Create hybrid collection
client.create_collection(
    collection_name=collection_name,
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

# Global vocabulary - automatically extends as new texts are processed
global_vocabulary = {}

# Simple sparse encoding (BM25-style)
def create_sparse_vector(text):
    """Create sparse vector from text using term frequency"""
    from collections import Counter
    import re
    
    # Simple tokenization
    words = re.findall(r"\b\w+\b", text.lower())
    word_counts = Counter(words)
    
    # Convert to sparse vector format, extending vocabulary as needed
    indices = []
    values = []
    
    for word, count in word_counts.items():
        if word not in global_vocabulary:
            # Add new word to vocabulary with next available index
            global_vocabulary[word] = len(global_vocabulary)
        
        indices.append(global_vocabulary[word])
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

client.upload_points(collection_name=collection_name, points=points)
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
        collection_name=collection_name,
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
        collection_name=collection_name,
        query=encoder.encode(query_text).tolist(),
        using="dense",
        limit=5
    )
    
    # Sparse-only search  
    sparse_results = client.query_points(
        collection_name=collection_name,
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

### Step 5: Analyze Your Results

Use the outputs from Step 4 to evaluate how hybrid compares to the single approaches. Focus on when hybrid fixes dense misses (rare keywords, exact identifiers) and when sparse misses (synonyms/semantic paraphrases). Optionally, time each method (dense/sparse/hybrid) on a few queries and note average latency.

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> Your hybrid collection contains both dense and sparse vectors  
<input type="checkbox"> You can perform searches using dense, sparse, and hybrid approaches  
<input type="checkbox"> RRF fusion combines results from both vector types effectively  
<input type="checkbox"> You can demonstrate cases where hybrid search outperforms single-vector approaches  
<input type="checkbox"> You understand the trade-offs between different search methods for your domain  

## Share Your Discovery

### Step 1: Reflect on Your Findings

1. When did hybrid search beat dense-only or sparse-only (give concrete query types)?
2. How did RRF change the ranking vs. the individual methods?
3. How did latency compare across dense, sparse, and hybrid (avg + P95)?
4. How did your sparse encoding choice (e.g., TF-IDF/BM25/SPLADE) affect results?

### Step 2: Post Your Results

**Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord"> <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
    alt="Post your results in Discord"
    style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" /> </a> **using this:**

```markdown
**[Day 3] Building a Hybrid Search Engine**

**High-Level Summary**
- **Domain:** "I built hybrid search for [your domain]"
- **Winner:** "Hybrid/Dense/Sparse worked best because [one clear reason]"

**Reproducibility**
- **Collection:** day3_hybrid_search
- **Models:** dense=[id, dim], sparse=[method]
- **Dataset:** [N items] (snapshot: YYYY-MM-DD)

**Settings (today)**
- **Fusion:** RRF, k_dense=[..], k_sparse=[..]
- **Search:** hnsw_ef=[..] (if used)
- **Sparse encoding:** [TF-IDF/BM25/SPLADE], notes: [e.g., stopwords/stemming]

**Head-to-Head (demo query: "[your query]")**
- **Dense top-3:** 1) …, 2) …, 3) …
- **Sparse top-3:** 1) …, 2) …, 3) …
- **Hybrid top-3:** 1) …, 2) …, 3) …

**Latency**
- **Dense:** avg=[..] ms (P95=[..] ms)
- **Sparse:** avg=[..] ms (P95=[..] ms)
- **Hybrid (RRF):** avg=[..] ms (P95=[..] ms)

**Why these won**
- [one line on synonyms vs exact IDs/keywords, etc.]

**Surprise**
- "[one unexpected finding]"

**Next step**
- "[one concrete action for tomorrow]"
```

## Optional: Go Further

### Advanced Fusion Strategies

Test Distribution-Based Score Fusion (DBSF) as an alternative to RRF:

```python
# Compare RRF vs DBSF
dbsf_results = client.query_points(
    collection_name=collection_name,
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
            collection_name=collection_name,
            query=encoder.encode(query_text).tolist(),
            using="dense", limit=10
        ),
        "sparse": lambda: client.query_points(
            collection_name=collection_name, 
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

Implement TFIDF sparse encoding trained on your dataset:

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
