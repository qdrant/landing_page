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
        text="a green square", 
        model="cohere/embed-v4.0", 
        options={
            "cohere-api-key": "<your_cohere_api_key>", 
            "output_dimension": 512
        }
    )
)
```