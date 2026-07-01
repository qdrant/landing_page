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
        text="How to bake cookies?", 
        model="Qdrant/bm25",
    ),
    using="my-bm25-vector",
)
