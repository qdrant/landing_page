from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)
# @hide-end

client.create_collection(
    collection_name="books",
    vectors_config={
        "description-dense": models.VectorParams(size=384, distance=models.Distance.COSINE)
    },
)

client.create_payload_index(
    collection_name="books",
    field_name="title",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        scoring=True,
    ),
)
