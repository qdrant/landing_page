from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.update_collection(
    collection_name="{collection_name}",
    collection_params=models.CollectionParamsDiff(read_fan_out_delay_ms=100),
)
