from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.query_points(
    collection_name="books",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                    text="9780553213515",
                    model="sentence-transformers/all-minilm-l6-v2"
            ),
            using="description-dense",
            score_threshold=0.5,
        ),
        models.Prefetch(
            query=models.Document(
                text="9780553213515", 
                model="Qdrant/bm25",
            ),
            using="isbn-bm25",
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
    with_payload=True,
)
