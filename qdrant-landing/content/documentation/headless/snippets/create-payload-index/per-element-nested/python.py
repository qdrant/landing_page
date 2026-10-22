from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="offers[].shop",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        nested="offers",
    ),
)

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="offers[].price",
    field_schema=models.FloatIndexParams(
        type=models.FloatIndexType.FLOAT,
        nested="offers",
    ),
)
