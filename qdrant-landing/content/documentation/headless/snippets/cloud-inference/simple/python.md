```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Document

client = QdrantClient(
    url="https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333",
    api_key="<paste-your-api-key-here>",
    cloud_inference=True,
)

points = [
    PointStruct(
        id=1,
        payload={"topic": "cooking", "type": "dessert"},
        vector=Document(
            text="Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
            model="<the-model-to-use>"
        )
    )
]

client.upsert(collection_name="<your-collection>", points=points)

points = client.query_points(collection_name="<your-collection>", query=Document(
    text="Recipe for baking chocolate chip cookies requires flour",
    model="<the-model-to-use>"
))

print(points)
```
