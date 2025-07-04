---
title: Using Cloud Inference with Qdrant for Vector Search
weight: 1
---
# Using Cloud Inference with Qdrant for Vector Search
## Install Qdrant
```bash
pip install qdrant-client
```
## Initialize the client
Initialize the Qdrant client after creating a [Qdrant Cloud account](https://qdrant.tech/cloud/). 
You will need to create a paid cluster to use cloud inference. 
```
from qdrant_client import QdrantClient
client = QdrantClient(
    url="https://YOUR_URL.eastus-0.azure.cloud.qdrant.io:6333/",
    api_key="YOUR_API_KEY",
    cloud_inference=True,
    timeout=30.0
)  
```
## Create a collection
Qdrant stores vectors and associated metadata in collections. Collection requires vector parameters to be set during creation. In this case, let's setup a collection using BM25 for sparse vectors and `all-minilm-l6-v2` for dense vectors. 
```python
from qdrant_client import models

collection_name = "my_collection_name"
if not client.collection_exists(collection_name=collection_name):
# Create collection with multi-vector config: "bm25_sparse_vector" for BM25, "dense" for MiniLM
    client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        )
    },
    sparse_vectors_config={
        "bm25_sparse_vector": models.SparseVectorParams(
            modifier=models.Modifier.IDF #Inverse Document Frequency
        )
    }
)
```
## Add data
Now you can add sample documents, their associated metadata, and a point id for each.

```python
from qdrant_client.http.models import PointStruct, Document
from datasets import load_dataset
import uuid

dense_model = "sentence-transformers/all-minilm-l6-v2"
bm25_model = "qdrant/bm25"

# Load the dataset
ds = load_dataset("miriad/miriad-4.4M", split="train[0:100]")

points = []

for idx, item in enumerate(ds):
    passage = item["passage_text"]
    
    point = PointStruct(
        id=str(uuid.uuid4()),  # use unique string ID
        payload={"text": passage},
        vector={
            "dense": Document(
                text=passage,
                model=dense_model
            ),
            "bm25_sparse_vector": Document(
                text=passage,
                model=bm25_model
            )
        }
    )
    points.append(point)

```

## Upload documents to the collection
Upload the data: 
```python
# Upsert to Qdrant
client.upload_points(
    collection_name=collection_name, 
    points=points, 
    batch_size=8
)
```
# Set up input query
Create a sample query:
```python
query_text = "What is relapsing polychondritis?"

# Use Qdrant Document interface for both dense and sparse
dense_doc = Document(
    text=query_text,
    model=dense_model
)

sparse_doc = Document(
    text=query_text,
    model=bm25_model
)
```
## Run vector search
Here, you will ask a question that will allow you to retrieve semantically relevant results.
```markdown
# Run hybrid search using prefetch + RRF fusion
results = client.query_points(
    collection_name=collection_name,  # Replace with your collection
    prefetch=[
        models.Prefetch(
            query=dense_doc,
            using="dense",
            limit=5
        ),
        models.Prefetch(
            query=sparse_doc,
            using="bm25_sparse_vector",
            limit=5
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=5,
    with_payload=True
)
print(results.points)
```
The semantic search engine will retrieve the most similar result in order of relevance.
```markdown
[ScoredPoint(id='9968a760-fbb5-4d91-8549-ffbaeb3ebdba', version=0, score=14.545895, payload={'text': "Relapsing Polychondritis is a rare...'}, vector=None, shard_key=None, order_value=None)]
```