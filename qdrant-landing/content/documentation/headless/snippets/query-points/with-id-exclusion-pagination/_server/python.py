from uuid import UUID

from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

seen_ids: list[int | str | UUID] = [83461, 19284, 57392, 44017, 91825]  # IDs returned on previous pages

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    query_filter=models.Filter(
        must_not=[
            models.HasIdCondition(has_id=seen_ids),
        ]
    ),
    limit=5,
)
