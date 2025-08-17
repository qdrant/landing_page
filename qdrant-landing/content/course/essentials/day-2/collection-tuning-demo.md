---
title: HNSW Tuning Demo
weight: 3
---

{{< date >}} Day 2 {{< /date >}}

# Collection Tuning

Optimize collection configurations for your specific use case.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## What You'll Learn

- Hands-on experimentation with HNSW parameters
- Performance testing and benchmarking
- Configuration optimization strategies
- Real-world tuning scenarios

---

## Day 2: HNSW Tuning and Filtering Optimization

In this tutorial, you'll tune HNSW for speed and recall, and compare filtering performance with and without payload indexes on a real dataset.

### 1) Install dependencies

```bash
pip install -q datasets qdrant-client tqdm openai python-dotenv
```

### 2) Connect to Qdrant Cloud

Use the same `.env` from Day 0 (recommended):

```python
import os, time
from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from datasets import load_dataset
from tqdm import tqdm
import openai

load_dotenv()
QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
```

### 3) Load the DBpedia 100K dataset (1536‑dim vectors)

```python
ds = load_dataset("Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K")
collection_name = "dbpedia_100K"
```

### 4) Create a collection (fast bulk upload with m=0)

Start with `m=0` to avoid building HNSW connections during ingestion, then switch to HNSW for searches:

```python
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        m=0,
        ef_construct=100,
        full_scan_threshold=10000,
    ),
    strict_mode_config=models.StrictModeConfig(
        enabled=False,
        unindexed_filtering_retrieve=True,  # allow filters w/o indexes for baseline
    ),
)
print(f"Created collection: {collection_name}")
```

### 5) Explore the dataset (optional)

```python
print(ds)
first = ds['train'][0]
print(first)
print(ds['train'].features)
print(ds['train'].column_names)
```

### 6) Bulk upload 100K points in batches

We’ll add payload fields for later filtering tests (`category`, `length`, `has_numbers`).

```python
batch_size = 10000
train = ds['train']

def upload_batch(start_idx, end_idx):
    points = []
    for i in range(start_idx, min(end_idx, len(train))):
        ex = train[i]
        embedding = ex['text-embedding-3-large-1536-embedding']
        payload = {
            'text': ex['text'],
            'title': ex['title'],
            '_id': ex['_id'],
            'category': ex['title'].split()[0] if ex['title'] else 'unknown',
            'length': len(ex['text']),
            'has_numbers': any(c.isdigit() for c in ex['text'])
        }
        points.append(models.PointStruct(id=i, vector=embedding, payload=payload))
    if points:
        client.upload_points(collection_name=collection_name, points=points)
        return len(points)
    return 0

uploaded = 0
for i in tqdm(range(0, len(train), batch_size), desc="Uploading points"):
    uploaded += upload_batch(i, i + batch_size)
print("Uploaded:", uploaded)
```

### 7) Switch on HNSW (m=16)

```python
client.update_collection(
    collection_name=collection_name,
    hnsw_config=models.HnswConfigDiff(m=16)  # balanced default
)
```

### 8) Create a test query embedding (OpenAI)

Use the same model/dimensions as the dataset.

```python
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def get_query_embedding(text):
    try:
        resp = openai_client.embeddings.create(
            model="text-embedding-3-large",
            input=text,
            dimensions=1536,
        )
        return resp.data[0].embedding
    except Exception as e:
        import numpy as np
        print("Embedding error:", e, "— using random vector fallback")
        return np.random.normal(0, 1, 1536).tolist()

query_embedding = get_query_embedding("artificial intelligence")
```

### 9) Baseline similarity search

```python
start = time.time()
resp = client.query_points(collection_name=collection_name, query=query_embedding, limit=10)
no_filter_ms = (time.time() - start) * 1000
print(f"Baseline search: {no_filter_ms:.2f} ms")
print("Top title:", resp.points[0].payload['title'], "score:", round(resp.points[0].score, 4))
```

Note: first query may be slower due to cold caches.

### 10) Filtering without payload indexes (baseline)

```python
from qdrant_client import models

print("Filtering without payload indexes…")
flt = models.Filter(must=[
    models.FieldCondition(key="text", match=models.MatchText(text="synthetic data")),
])

start = time.time()
resp = client.query_points(
    collection_name=collection_name,
    query=query_embedding,
    limit=10,
    search_params=models.SearchParams(hnsw_ef=100),
    query_filter=flt,
)
with_filter_ms = (time.time() - start) * 1000
print(f"Filtered (no index): {with_filter_ms:.2f} ms — overhead {with_filter_ms - no_filter_ms:.2f} ms")
print("Top title:", resp.points[0].payload['title'], "score:", round(resp.points[0].score, 4))
```

### 11) Create payload indexes (accelerate filtering)

```python
client.create_payload_index(collection_name=collection_name, field_name="text", field_schema="text")
print("Payload index created.")
```

### 12) Filtering with payload indexes (optimized)

```python
start = time.time()
resp = client.query_points(
    collection_name=collection_name,
    query=query_embedding,
    limit=10,
    search_params=models.SearchParams(hnsw_ef=100),
    query_filter=flt,
)
with_index_ms = (time.time() - start) * 1000
print(f"Filtered (indexed): {with_index_ms:.2f} ms — overhead {with_index_ms - no_filter_ms:.2f} ms")
print("Top title:", resp.points[0].payload['title'], "score:", round(resp.points[0].score, 4))
```

---

## Next Steps

You learned how to:

- Optimize upload speed by starting with `m=0` and enabling HNSW later
- Measure filtering overhead with and without payload indexes
- Tune HNSW parameters for balanced performance

Pitstop project: choose a domain dataset, ingest with payloads, test `m` and `ef_construct` values (e.g., `m=16/32`, `ef_construct=200/400`), add payload indexes, and record speed/recall trade‑offs for your use case. 