```python
from qdrant_client import QdrantClient, models
from qdrant_client.context_headers import headers

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-qdrant-api-key>",
    cloud_inference=True
)

with headers({"cohere-api-key": "<YOUR_COHERE_API_KEY>"}):
    client.query_points(
        collection_name="{collection_name}",
        query=models.Document(
            text="a green square", 
            model="cohere/embed-v4.0", 
            options={
                "output_dimension": 512
            }
        )
    )
```
