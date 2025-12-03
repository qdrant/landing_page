from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="payload_field_name",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        on_disk=True,
    ),
)
