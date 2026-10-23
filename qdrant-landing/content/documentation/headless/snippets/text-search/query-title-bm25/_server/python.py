from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

client.query_points(
    collection_name="books",
    query=models.TextQuery(text="time travel"),
    using="title",
    limit=10,
    with_payload=True,
)
