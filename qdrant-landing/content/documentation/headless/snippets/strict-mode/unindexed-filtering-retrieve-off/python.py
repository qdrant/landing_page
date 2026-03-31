from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.update_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(
        enabled=True,
        unindexed_filtering_retrieve=True,
    ),
)
