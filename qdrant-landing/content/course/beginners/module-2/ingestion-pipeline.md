---
title: "Ingestion Pipeline: End-to-End"
short_description: "Module 2 of the Beginner Course: build the full pipeline from cloud setup to your first query."
description: "Put it together: connect to a cluster, create a collection and payload index, embed and upload points, then run your first filtered query."
weight: 8
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# Ingestion Pipeline: End-to-End

Let's put everything together. This section walks through the complete ingestion pipeline from cloud setup to your first query.

### Step 1: Connect to Your Cluster

Module 0 walks you through creating a free cluster at [Qdrant Cloud](https://cloud.qdrant.io/) and retrieving its URL and API key. Use these credentials to initialize the Qdrant client:

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",  # your cluster's URL
    api_key="<your-api-key>",                                    # your API key
)
# In a real project, don't hardcode these; load them from environment
# variables or a secrets manager instead of committing them to source control.
```

### Step 2: Create the Collection

```python
from qdrant_client import models

client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        size=384,
        distance=models.Distance.COSINE,
    ))

# Qdrant Cloud runs in strict mode, which rejects filtered queries on payload
# fields that aren't indexed. Step 4 filters on "category", so create that
# index now, before ingesting or querying.
client.create_payload_index(
    collection_name="articles",
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

### Step 3: Ingest Data

```python
!pip install fastembed

from qdrant_client.models import PointStruct
from fastembed import TextEmbedding

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")  # 384-dim

documents = [
    {"id": 1, "text": "Car repair guide",  "category": "automotive"},
    {"id": 2, "text": "How to cook pasta",  "category": "food"},
]

points = [
    PointStruct(
        id=doc["id"],
        vector=vector.tolist(),
        payload={"title": doc["text"], "category": doc["category"]},
    )
    for doc, vector in zip(documents, model.embed([d["text"] for d in documents]))
]
# upload_points handles batching and retries automatically; preferred for lists of points.
# upsert is the raw operation, better for single points or small real-time updates.
client.upload_points(collection_name="articles", points=points)
```

### Step 4: Query

This embeds the user's question the same way we embedded the documents, then searches with a payload filter on top: same pattern as [Payload Filtering](/course/beginners/module-2/payload-filtering/), now filtering to only the "automotive" category:

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

query_text   = "automobile maintenance"
query_vector = list(model.embed([query_text]))[0].tolist()

results = client.query_points(
    collection_name="articles",
    query=query_vector,
    query_filter=Filter(
        must=[FieldCondition(key="category", match=MatchValue(value="automotive"))]
    ),
    limit=3,
)

for r in results.points:
    print(f"Score: {r.score:.3f}  |  {r.payload['title']}")
```

### Pipeline Summary

1. **Connect to your cluster**: Get its URL + API key (see Module 0 for the free-tier walkthrough).
2. **Create collection**: Fix the vector size and distance metric, and create a payload index on any field you'll filter on.
3. **Ingest**: Embed each document with your embedding model, then upload it as a `PointStruct` with ID, vector, and payload.
4. **Query**: Embed the user's question, then call `query_points` with filters and a limit.

### Try It Yourself

Extend the pipeline above: add a third document with its own category, re-run the filtered query, and confirm it shows up when its category matches, and gets excluded when it doesn't.
