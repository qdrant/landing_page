from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(text="time travel", model="qdrant/bm25"),
    using="title-bm25",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(key="group_id", match=models.MatchValue(value="user_1")),
            models.FieldCondition(key="year", match=models.MatchValue(value=2024)),
        ]
    ),
    search_params=models.SearchParams(
        idf=models.IdfCorpusParams(
            corpus=models.Filter(
                must=[
                    models.FieldCondition(
                        key="group_id", match=models.MatchValue(value="user_1")
                    ),
                ]
            )
        )
    ),
    limit=10,
    with_payload=True,
)
