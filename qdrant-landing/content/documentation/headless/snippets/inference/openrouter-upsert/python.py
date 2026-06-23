from qdrant_client import QdrantClient, models
from qdrant_client.context_headers import headers

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-qdrant-api-key>",
    cloud_inference=True
)

with headers({"openrouter-api-key": "<YOUR_OPENROUTER_API_KEY>"}):
    client.upsert(
        collection_name="{collection_name}",
        points=[
            models.PointStruct(
                id=1,
                vector=models.Document(
                    text="Recipe for baking chocolate chip cookies",
                    model="openrouter/mistralai/mistral-embed-2312",
                )
            )
        ]
    )
