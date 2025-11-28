from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.overwrite_payload(
    collection_name="{collection_name}",
    payload={
        "property1": "string",
        "property2": "string",
    },
    points=[0, 3, 10],
)
