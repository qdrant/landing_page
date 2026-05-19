from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_vector_name(
    collection_name="{collection_name}",
    vector_name="{vector_name}",
    vector_name_config=models.SparseVectorNameConfig(
        sparse=models.SparseVectorConfig(
            modifier=models.Modifier.IDF,
        ),
    ),
)
