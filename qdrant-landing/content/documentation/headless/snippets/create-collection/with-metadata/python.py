from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    metadata={
        "my-metadata-field": "value-1",
        "another-field": 123
    },
)
