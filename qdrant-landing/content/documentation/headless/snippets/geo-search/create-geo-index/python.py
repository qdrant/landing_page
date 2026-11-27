from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

client.create_payload_index(
    collection_name="venues",
    field_name="location",
    field_schema=models.PayloadSchemaType.GEO,
)
