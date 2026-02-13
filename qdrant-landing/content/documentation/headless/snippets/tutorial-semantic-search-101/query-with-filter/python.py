# @hide-start
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="",
    api_key="",
    cloud_inference=True
)

COLLECTION_NAME=""
EMBEDDING_MODEL=""
# @hide-end

hits = client.query_points(
    collection_name=COLLECTION_NAME,
    query=models.Document(
        text="alien invasion",
        model=EMBEDDING_MODEL
    ),
    query_filter=models.Filter(
        must=[models.FieldCondition(key="year", range=models.Range(gte=2000))]
    ),
    limit=1,
).points

for hit in hits:
    print(hit.payload, "score:", hit.score)
