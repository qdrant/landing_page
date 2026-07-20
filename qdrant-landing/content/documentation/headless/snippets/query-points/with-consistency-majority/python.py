# @hide-start
# mypy: disable-error-code="arg-type"
# @hide-end
from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city",
                match=models.MatchValue(
                    value="London",
                ),
            )
        ]
    ),
    search_params=models.SearchParams(hnsw_ef=128, exact=False),
    limit=3,
    consistency="majority",
)
