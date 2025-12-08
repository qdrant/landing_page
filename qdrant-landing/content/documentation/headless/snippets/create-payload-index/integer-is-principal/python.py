from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="timestamp",
    field_schema=models.IntegerIndexParams(
        type=models.IntegerIndexType.INTEGER,
        is_principal=True,
    ),
)
