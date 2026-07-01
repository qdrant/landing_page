from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

# @block-start get-current-value
base_ef = client.get_collection(
    collection_name="{collection_name}"
).config.hnsw_config.ef_construct
# @block-end get-current-value

# @block-start update-collection
client.update_collection(
    collection_name="{collection_name}",
    hnsw_config=models.HnswConfigDiff(ef_construct=base_ef + 1),
)
# @block-end update-collection
