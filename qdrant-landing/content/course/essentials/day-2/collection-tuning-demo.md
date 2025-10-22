---
title: "Demo: HNSW Performance Tuning"
weight: 3
---

{{< date >}} Day 2 {{< /date >}}

# Demo: HNSW Performance Tuning

Learn how to improve vector search speed with [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) tuning and payload indexing on a real 100K dataset.

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course/day_2/hnsw_performance_tuning.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

## What You’ll Do

Yesterday you learned the theory behind HNSW indexing. Today you'll see it in action on a 100,000-vector dataset, measuring performance differences and applying optimization strategies that work in production.

**You'll learn to:**
- Optimize bulk upload speed with strategic HNSW configuration
- Measure the performance impact of payload indexes
- Tune HNSW params
- Compare full-scan vs. HNSW search performance

## The Performance Challenge

Working with 100K high-dimensional vectors (1536 dimensions from OpenAI's text-embedding-3-large) presents real performance challenges:
- **Upload speed**: How fast can we ingest vectors?
- **Search speed**: How quickly can we find similar vectors?
- **Filtering speed**: How much overhead do payload filters add?
- **Memory efficiency**: How do different configurations affect RAM needs?

## Step 1: Environment Setup

### Install Required Libraries


**Library purposes:**  
 
`datasets`: Access to Hugging Face datasets, specifically our [DBpedia 100K dataset](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K)   
`qdrant-client`: Official Qdrant Python client for vector search operations   
`tqdm`: Progress bars for bulk operations (essential for 100K upload tracking)   
`openai`: Generate query embeddings compatible with the dataset   
`python-dotenv`: Secure environment variable management

### Set Up API Keys

You'll need an OpenAI API key for query embeddings:

- Visit [OpenAI's API platform](https://platform.openai.com)
- Create an account or sign in
- Navigate to [API Keys](https://platform.openai.com/api-keys) and create a new key
- **Important**: You'll need credits in your OpenAI account (~$1 should be sufficient for this demo)

### Environment Configuration

Create a `.env` file your project directory or use Google Colab secrets.

```bash
# .env file
QDRANT_URL=https://your-cluster-url.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Security Note**: Never commit the .env file.

## Step 2: Connect to Qdrant Cloud

We’ll use Qdrant Cloud for stable resources at 100K scale.

```python
from datasets import load_dataset
from qdrant_client import QdrantClient, models
from tqdm import tqdm
import openai
import time
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

# Verify connection
try:
    collections = client.get_collections()
    print(f"Connected to Qdrant Cloud successfully!")
    print(f"Current collections: {len(collections.collections)}")
except Exception as e:
    print(f"Connection failed: {e}")
    print("Check your QDRANT_URL and QDRANT_API_KEY in .env file")
```

**Why Cloud:**
- **Convenience**: No local setup hassles
- **Free Tier**: We are well within the free tier with a 100k dataset
- **Realistic testing**: Production-like environment for accurate benchmarks
- **Scalability**: Easy to scale up later

## Step 3: Load the DBpedia Dataset

We're using a curated dataset of 100K Wikipedia articles with pre-computed 1536-dimensional embeddings from OpenAI's `text-embedding-3-large` model:

```python
# Load the dataset (this may take a few minutes for first download)
print("Loading DBpedia 100K dataset...")
ds = load_dataset("Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K")
collection_name = "dbpedia_100K"

print("Dataset loaded successfully!")
print(f"Dataset size: {len(ds['train'])} articles")

# Explore the dataset structure
print("\nDataset structure:")
print("Available columns:", ds["train"].column_names)

# Look at a sample entry
sample = ds["train"][0]
print(f"\nSample article:")
print(f"Title: {sample['title']}")
print(f"Text preview: {sample['text'][:200]}...")
print(f"Embedding dimensions: {len(sample['text-embedding-3-large-1536-embedding'])}")
```

**About this dataset:**
- **Source**: [Hugging Face DBpedia dataset](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K)
- **Content**: Pre-computed Wikipedia article embeddings
- **Size**: 100,000 articles
- **Embeddings**: with OpenAI's `text-embedding-3-large` truncated to 1536 dims
- **Metadata**: `_id`, `title` and `text`


## Step 4: Strategic Collection Creation

Set `m=0` to skip HNSW graph links during bulk upload. Switch to a normal `m` after ingest to build the graph. This speeds up inserts 5-10x because link creation is deferred.

**Warning:** Do not toggle back to `m=0` on a collection that already has an HNSW index if you care about keeping that index. Rebuilding from scratch is slow and uses more resources.


```python
# Delete collection if it exists (for clean restart)
try:
    client.delete_collection(collection_name)
    print(f"Deleted existing collection: {collection_name}")
except Exception:
    pass  # Collection doesn't exist, which is fine

# Create collection with optimized settings
print(f"Creating collection: {collection_name}")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,  # Matches dataset dims
        distance=models.Distance.COSINE,  # Good for normalized embeddings
    ),
    hnsw_config=models.HnswConfigDiff(
        m=0,  # Bulk load fast: m=0 (build links after ingest).
        ef_construct=100,  # Build quality: used after we set m>0
        full_scan_threshold=10000,
    ),
    strict_mode_config=models.StrictModeConfig(
        enabled=False,
    ),  # More flexible while testing
)

print(f"Collection '{collection_name}' created successfully!")

# Verify collection settings
collection_info = client.get_collection(collection_name)
print(f"Vector size: {collection_info.config.params.vectors.size}")
print(f"Distance metric: {collection_info.config.params.vectors.distance}")
print(f"HNSW m: {collection_info.config.hnsw_config.m}")
```


**Configuration details:**
- **`size=1536`**: To match the dimensions parameter we set for the OpenAI `text-embedding-3-large`
- **`distance=COSINE`**: Standard for normalized embeddings and semantic similarity
- **`full_scan_threshold=10000`**: Uses exact search for smaller result sets
- **`strict_mode_config`**: Managed Cloud runs in strict mode by default. We set `enabled=False` to let you experiment with unindexed payload keys during the demo.

**Side note:** `text-embedding-3-large` outputs 3072 dims. Truncating that to only 1536 dimensions cuts compute and memory, with some accuracy loss.

## Step 5: Bulk Upload with Rich Payloads

We'll upload 100K vectors in 10K batches. The payload includes `title`, `length`, and `has_numbers` for filter tests.

```python
def upload_batch(start_idx, end_idx):
    points = []
    for i in range(start_idx, min(end_idx, total_points)):
        example = ds["train"][i]

        # Get the pre-computed embedding
        embedding = example["text-embedding-3-large-1536-embedding"]

        # Create payload with fields for filtering tests
        payload = {
            "text": example["text"],
            "title": example["title"],
            "_id": example["_id"],
            "length": len(example["text"]),
            "has_numbers": any(char.isdigit() for char in example["text"]),
        }

        points.append(models.PointStruct(id=i, vector=embedding, payload=payload))

    if points:
        client.upload_points(collection_name=collection_name, points=points)
        return len(points)
    return 0


batch_size = 64 * 10
total_points = len(ds["train"])
print(f"Uploading {total_points} points in batches of {batch_size}")

# Upload all batches with progress tracking
total_uploaded = 0
for i in tqdm(range(0, total_points, batch_size), desc="Uploading points"):
    uploaded = upload_batch(i, i + batch_size)
    total_uploaded += uploaded

print(f"Upload completed! Total points uploaded: {total_uploaded}")
```

## Step 6: Enable HNSW Indexing

Now switch from `m=0` to `m=16` to build HNSW connections and improve search time.

```python
client.update_collection(
    collection_name=collection_name,
    hnsw_config=models.HnswConfigDiff(
        m=16  # Build HNSW now: m=16 after the bulk load.
    ),
)

print("HNSW indexing enabled with m=16")
```

**What happens now?** Qdrant builds a navigable graph so search becomes near‑logarithmic instead of linear scanning.

## Step 7: Create Query Embeddings

We need to use the same model and dimensions as our dataset to ensure compatibility.

If you do not have an OpenAI key, use the commented fallback below.

```python
# Optional fallback without an API key:
# import requests
# test_query = "artificial intelligence"
# url = "https://storage.googleapis.com/qdrant-examples/query_embedding_day_2.json"
# resp = requests.get(url)
# query_embedding = resp.json()["query_vector"]
# print(f"Generated embedding for: '{test_query}'")
# print(f"Embedding dimensions: {len(query_embedding)}")
# print(f"First 5 values: {query_embedding[:5]}")


# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# for colab:
# openai_client = openai.OpenAI(api_key=userdata.get('OPENAI_API_KEY'))

def get_query_embedding(text):
    """Generate embedding using the same model as the dataset"""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-large",  # Must match dataset model
            input=text,
            dimensions=1536  # Must match dataset dimensions
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting OpenAI embedding: {e}")
        print("Common issues:")
        print("   - Check your OPENAI_API_KEY in .env file")
        print("   - Ensure you have credits in your OpenAI account")
        print("   - Verify your API key has embedding permissions")
        print("Using random vector as fallback for demo purposes...")
        import numpy as np
        return np.random.normal(0, 1, 1536).tolist()

# Test embedding generation
print("Generating query embedding...")
test_query = "artificial intelligence"
query_embedding = get_query_embedding(test_query)
print(f"Generated embedding for: '{test_query}'")
print(f"Embedding dimensions: {len(query_embedding)}")
print(f"First 5 values: {query_embedding[:5]}")
```

**Query Embedding Compatibility:**
- **Model**: Must use `text-embedding-3-large` (same as dataset)
- **Dimensions**: Must be 1536 (same as dataset)

## Step 8: Baseline Performance Testing

Let's measure search performance on the HNSW‑enabled collection.

```python
print("Running baseline performance test...")

# Warm up the RAM index/vectors cache with a test query
print("Warming up caches...")
client.query_points(collection_name=collection_name, query=query_embedding, limit=1)

# Measure vector search performance
search_times = []
for _ in range(3):  # Multiple runs for a stable average
    start_time = time.time()
    response = client.query_points(
        collection_name=collection_name, query=query_embedding, limit=10
    )
    search_time = (time.time() - start_time) * 1000
    search_times.append(search_time)

baseline_time = sum(search_times) / len(search_times)

print(f"Average search time: {baseline_time:.2f}ms")
print(f"Search times: {[f'{t:.2f}ms' for t in search_times]}")
print(f"Found {len(response.points)} results")
print(f"Top result: '{response.points[0].payload['title']}' (score: {response.points[0].score:.4f})")

# Show a few more results for context
print(f"\nTop 3 results:")
for i, point in enumerate(response.points[:3], 1):
    title = point.payload["title"]
    score = point.score
    text_preview = point.payload["text"][:100] + "..."
    print(f"   {i}. {title} (score: {score:.4f})")
    print(f"      {text_preview}")
```

**Performance factors:**
- **Cache warming**: First query loads relevant index parts/vectors into memory, subsequent queries are faster
- **HNSW with m=16**: Graph-based search is much faster than full scan
- **MRepeated runs**: Average of several queries gives more reliable timing results

## Step 9: Filtering Without Payload Indexes

Now, let's test filtering performance without indexes. This forces Qdrant to scan through vectors and check each one against the filter:

```python
print("Testing filtering without payload indexes")

# Warning: We enable unindexed_filtering_retrieve only for demonstration purposes. In production, don’t use it.
# Demo only: allow filtering without an index by scanning. Turn this off later.
client.update_collection(
    collection_name=collection_name,
    strict_mode_config=models.StrictModeConfig(unindexed_filtering_retrieve=True),
)

# Create a text-based filter
text_filter = models.Filter(
    must=[models.FieldCondition(key="text", match=models.MatchText(text="data"))]
)

# Warmup
client.query_points(collection_name=collection_name, query=query_embedding, limit=1)

# Run multiple times for more reliable measurement
unindexed_times = []
for i in range(3):
    start_time = time.time()
    response = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        limit=10,
        search_params=models.SearchParams(hnsw_ef=100),
        query_filter=text_filter,
    )
    unindexed_times.append((time.time() - start_time) * 1000)

unindexed_filter_time = sum(unindexed_times) / len(unindexed_times)

print(f"Filtered search (WITHOUT index): {unindexed_filter_time:.2f}ms")
print(f"Individual times: {[f'{t:.2f}ms' for t in unindexed_times]}")
print(f"Overhead vs baseline: {unindexed_filter_time - baseline_time:.2f}ms")
print(f"Found {len(response.points)} matching results")
if response.points:
    print(f"Top result: '{response.points[0].payload['text']}'\nScore: {response.points[0].score:.4f}")
else:
    print("No results found - try a different filter term")
```

## Step 10: Create Payload Indexes

Create a [full‑text index](/documentation/concepts/indexing/#full-text-index) for faster filtering.

```python
# Create a payload index for 'text' so filters use an index, not a scan.
client.create_payload_index(
    collection_name=collection_name,
    field_name="text",
    wait=True,
    field_schema=models.TextIndexParams(
        type="text", tokenizer="word", phrase_matching=False
    ),
)

client.update_collection(
    collection_name=collection_name,
    hnsw_config=models.HnswConfigDiff(
        ef_construct=101
    ),  # Added payload index after HNSW; bump ef_construct (+1) to rebuild with filter data.
    strict_mode_config=models.StrictModeConfig(unindexed_filtering_retrieve=False),
)

print("Payload index created for 'text' field")
```

## Step 11: Filtering With Payload Indexes

Run the same query with the index in place.

```python
print("Testing filtering WITH payload indexes...")


# Warmup
client.query_points(collection_name=collection_name, query=query_embedding, limit=1)

# Run multiple times for more reliable measurement
indexed_times = []
for i in range(3):
    start_time = time.time()
    response = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        limit=10,
        search_params=models.SearchParams(hnsw_ef=100),
        query_filter=text_filter,
    )
    indexed_times.append((time.time() - start_time) * 1000)

indexed_filter_time = sum(indexed_times) / len(indexed_times)

print(f"Filtered search (WITH index): {indexed_filter_time:.2f}ms")
print(f"Individual times: {[f'{t:.2f}ms' for t in indexed_times]}")
print(f"Overhead vs baseline: {indexed_filter_time - baseline_time:.2f}ms")
print(f"Found {len(response.points)} matching results")
if response.points:
    print(f"Top result: '{response.points[0].payload['text']}'\nScore: {response.points[0].score:.4f}")
else:
    print("No results found - try a different filter term")
```

## Performance Analysis

Compare your results and see the effect of each optimization:

```python
print("\n" + "=" * 60)
print("FINAL PERFORMANCE SUMMARY")
print("=" * 60)

# Key metrics
if unindexed_filter_time > 0 and indexed_filter_time > 0:
    index_speedup = unindexed_filter_time / indexed_filter_time
    filter_overhead_without = unindexed_filter_time - baseline_time
    filter_overhead_with = indexed_filter_time - baseline_time
else:
    index_speedup = 0
    filter_overhead_without = 0
    filter_overhead_with = 0

print(f"Baseline search (HNSW m=16):     {baseline_time:.2f}ms")
print(f"Filtering WITHOUT index:        {unindexed_filter_time:.2f}ms")
print(f"Filtering WITH index:           {indexed_filter_time:.2f}ms")
print("")
print(f"Performance improvements:")
print(f"   • Index speedup:                {index_speedup:.1f}x faster")
print(f"   • Filter overhead (no index):   +{filter_overhead_without:.2f}ms")
print(f"   • Filter overhead (with index): +{filter_overhead_with:.2f}ms")
print("")
print(f"Key insights:")
print(f"   • HNSW (m=16) enables fast vector search")
print(f"   • Payload indexes dramatically improve filtering")
print(f"   • Upload strategy (m=0→m=16) optimizes ingestion")
print("=" * 60)
```


## Next Steps & Resources

**What you've learned:**
- Strategic optimization of initial bulk upload with `m=0` → `m=16` switching
- Real-world performance measurement techniques
- The dramatic impact of payload indexes on filtering
- Production-ready configuration patterns

**Recommended next steps:**
1. **Experiment with parameters**: Try different `m` values (8, 32, 64) and `ef_construct` settings
2. **Test with your data**: Apply these techniques to your own domain datasets
3. **Production deployment**: Use these patterns in real applications
4. **Advanced features**: Explore quantization, sharding, and replication

**Additional resources:**
- [Qdrant Documentation](https://qdrant.tech/documentation/) - Complete technical reference
- [HNSW Paper](https://arxiv.org/abs/1603.09320) - Original algorithm research
- [Qdrant Cloud](https://cloud.qdrant.io/) - Managed vector search service
- [Performance Tuning Guide](https://qdrant.tech/documentation/guides/optimization/) - Advanced optimization techniques

**Ready for the pitstop project?** Now it's your turn to optimize performance with your own dataset and use case. You'll apply these same techniques to your domain-specific data and measure the real-world impact of different HNSW parameters and indexing strategies. 