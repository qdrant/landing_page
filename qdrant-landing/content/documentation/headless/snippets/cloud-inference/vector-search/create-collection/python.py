from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={
        "dense_vector": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        )
    }
)

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="passage_text",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        scoring=True,  # Enable BM25 scoring
    ),
)
