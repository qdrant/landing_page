from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

client.create_collection(
    collection_name="items",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
