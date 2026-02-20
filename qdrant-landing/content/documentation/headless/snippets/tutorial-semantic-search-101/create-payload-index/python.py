# @hide-start
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="",
    api_key="",
    cloud_inference=True
)

COLLECTION_NAME="my_books"
# @hide-end

client.create_payload_index(
    collection_name=COLLECTION_NAME,
    field_name="year",
    field_schema=models.PayloadSchemaType.INTEGER,
)
