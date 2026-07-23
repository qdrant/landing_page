from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={},
    sparse_vectors_config={
        "text": models.SparseVectorParams(
            index=models.SparseIndexParams(),
        )
    },
)