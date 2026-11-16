```python
import os
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ.get("QDRANT_API_KEY"),
)
model_name = "BAAI/bge-small-en"

if not client.collection_exists("document-parts"):
    client.create_collection(
        collection_name="document-parts",
        vectors_config={
            "dense": models.VectorParams(
                size=client.get_embedding_size(model_name),
                distance=models.Distance.COSINE,
            )
        },
    )

client.upsert(
    collection_name="document-parts",
    points=[
        models.PointStruct(
            id=i,
            vector={"dense": models.Document(text=document, model=model_name)},
            payload={"document": document},
        )
        for i, document in enumerate(documents)
    ],
    wait=True,
)
```
