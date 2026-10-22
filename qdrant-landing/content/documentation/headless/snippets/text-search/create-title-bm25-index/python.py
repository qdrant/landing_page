from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_payload_index(
    collection_name="books",
    field_name="title",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        scoring=True,
    ),
)
