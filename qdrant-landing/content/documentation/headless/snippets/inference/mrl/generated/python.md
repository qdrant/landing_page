```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-api-key>", 
    cloud_inference=True
)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "large": models.Document(
                    text="Recipe for baking chocolate chip cookies",
                    model="openai/text-embedding-3-small",
                    options={"openai-api-key": "<YOUR_OPENAI_API_KEY>"}
                ),
                "small": models.Document(
                    text="Recipe for baking chocolate chip cookies",
                    model="openai/text-embedding-3-small",
                    options={
                        "openai-api-key": "<YOUR_OPENAI_API_KEY>",
                        "mrl": 64
                    },
                )
            },
        )
    ],
)
```
