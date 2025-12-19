from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_collection(
    collection_name="{minicoil_collection_name}",
    sparse_vectors_config={
        "minicoil": models.SparseVectorParams(
            modifier=models.Modifier.IDF #Inverse Document Frequency
        )
    }
)
