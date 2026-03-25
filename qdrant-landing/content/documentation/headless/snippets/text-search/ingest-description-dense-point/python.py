from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.upsert(
    collection_name="books",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "description-dense": models.Document(
                    text="A Victorian scientist builds a device to travel far into the future and observes the dim trajectories of humanity. He discovers evolutionary divergence and the consequences of class division. Wells's novella established time travel as a vehicle for social commentary.",
                    model="sentence-transformers/all-minilm-l6-v2",
                )
            },
            payload={
                "title": "The Time Machine",
                "author": "H.G. Wells",
                "isbn": "9780553213515",
            },
        )
    ],
)
