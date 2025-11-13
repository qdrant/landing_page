```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-api-key>", 
    cloud_inference=True
)

client.query_points(
    collection_name="<your_collection_name>",
    query=models.Document(
        text="How to bake cookies?", 
        model="openai/text-embedding-3-large", 
        options={
          "openai-api-key": "<your_openai_api_key>",
          "dimensions": 512
        }
    )
)
```