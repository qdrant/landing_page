```python
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Image, Document

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<paste-your-api-key-here>",
    # IMPORTANT
    # If not enabled, inference will be performed locally
    cloud_inference=True,
)

points = [
    PointStruct(
        id=1,
        vector=Image(
            image="https://qdrant.tech/example.png",
            model="qdrant/clip-vit-b-32-vision"
        ),
        payload={
            "title": "Example Image"
        }
    )
]

client.upsert(collection_name="<your-collection>", points=points)

result = client.query_points(
    collection_name="<your-collection>",
    query=Document(
        text="Mission to Mars",
        model="qdrant/clip-vit-b-32-text"
    )
)

print(result)
```
