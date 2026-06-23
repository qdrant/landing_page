```python
from qdrant_client import QdrantClient, models
from qdrant_client.context_headers import headers

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-qdrant-api-key>",
    cloud_inference=True
)

with headers({"jina-api-key": "<YOUR_JINAAI_API_KEY>"}):
    client.upsert(
        collection_name="{collection_name}",
        points=[
            models.PointStruct(
                id=1,
                vector=models.Image(
                    image="https://qdrant.tech/example.png",
                    model="jinaai/jina-clip-v2",
                    options={
                        "dimensions": 512
                    }
                )
            )
        ]
    )
```
