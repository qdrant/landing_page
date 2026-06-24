from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-qdrant-api-key>",
    cloud_inference=True
)
# @hide-end

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(
        text="My Query Text",
        model="<the-model-to-use>",
    ),
)
