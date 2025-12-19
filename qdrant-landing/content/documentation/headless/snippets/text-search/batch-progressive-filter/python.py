from qdrant_client import QdrantClient, models


client = QdrantClient(url="http://localhost:6333")

client.query_batch_points(
    collection_name="books",
    requests=[
        models.QueryRequest(
            query=models.Document(text="time travel", model="sentence-transformers/all-minilm-l6-v2"),
            using="description-dense",
            with_payload=True,
            filter=models.Filter(
                must=[models.FieldCondition(key="title", match=models.MatchText(text="time travel"))]
            ),
        ),
        models.QueryRequest(
            query=models.Document(text="time travel", model="sentence-transformers/all-minilm-l6-v2"),
            using="description-dense",
            with_payload=True,
            filter=models.Filter(
                must=[models.FieldCondition(key="title", match=models.MatchTextAny(text_any="time travel"))]
            ),
        ),
        models.QueryRequest(
            query=models.Document(text="time travel", model="sentence-transformers/all-minilm-l6-v2"),
            using="description-dense",
            with_payload=True,
        ),
    ],
)
