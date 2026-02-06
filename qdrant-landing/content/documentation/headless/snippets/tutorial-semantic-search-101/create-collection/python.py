# @hide-start
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="",
    api_key="",
    cloud_inference=True
)
# @hide-end

COLLECTION_NAME="my_books"

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=384,  # Vector size is defined by the model
        distance=models.Distance.COSINE,
    ),
)