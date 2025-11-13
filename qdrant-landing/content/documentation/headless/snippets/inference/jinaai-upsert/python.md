```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-api-key>", 
    cloud_inference=True
)

client.upsert(
    collection_name="<your_collection_name>",
    points=[
        models.PointStruct(
            id=1,
            vector=models.Image(
                image="https://qdrant.tech/example.png",
                model="jinaai/jina-clip-v2",
                options={
                    "jina-api-key": "<your_jinaai_api_key>",
                    "dimensions": 512
                }
            )
        )
    ]
)
```