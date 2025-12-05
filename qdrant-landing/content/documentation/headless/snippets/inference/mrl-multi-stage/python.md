```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-api-key>", 
    cloud_inference=True
)

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(
        text="How to bake cookies?", 
        model="openai/text-embedding-3-small",
        options={"openai-api-key": "<YOUR_OPENAI_API_KEY>"}
    ),
    using="large",
    limit=10,
    prefetch=models.Prefetch(
        query=models.Document(
            text="How to bake cookies?",
            model="openai/text-embedding-3-small",
            options={
                "openai-api-key": "<YOUR_OPENAI_API_KEY>", 
                "mrl": 64
            } 
        ),
        using="small",
        limit=1000,
    )
)
```