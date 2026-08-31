from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.query_points(
    collection_name="{collection_name}",
    query=[0.1, 0.1, 0.9],
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="group_id",
                match=models.MatchValue(value="user_1"),
            )
        ]
    ),
    shard_key_selector=models.ShardKeyWithFallback(
        target="user_1",
        fallback="default"
    ),
    limit=10,
)
