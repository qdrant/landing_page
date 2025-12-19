from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.update_collection(
    collection_name="{collection_name}",
    metadata={
        "my-metadata-field": {
            "key-a": "value-a",
            "key-b": 42
        }
    },
)
