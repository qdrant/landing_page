---
title: Databricks Embeddings
weight: 1500
---

# Using Databricks Embeddings with Qdrant

Databricks offers an advanced platform for generating embeddings, especially within large-scale data environments. You can use the following Python code to integrate Databricks-generated embeddings with Qdrant.

```python
import qdrant_client
from qdrant_client.models import Batch
from databricks import sql

# Connect to Databricks SQL endpoint
connection = sql.connect(server_hostname='your_hostname',
                         http_path='your_http_path',
                         access_token='your_access_token')

# Execute a query to get embeddings
query = "SELECT embedding FROM your_table WHERE id = 1"
cursor = connection.cursor()
cursor.execute(query)
embedding = cursor.fetchone()[0]

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="DatabricksEmbeddings",
    points=Batch(
        ids=[1],  # Unique ID for the data point
        vectors=[embedding],  # Embedding fetched from Databricks
    )
)
```
