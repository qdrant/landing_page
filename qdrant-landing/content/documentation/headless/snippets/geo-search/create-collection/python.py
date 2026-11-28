from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

client.create_collection(
    collection_name="venues",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)
