from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.query_points(
    collection_name="books",
    query=models.Document(text="tiempo", model="qdrant/bm25", options={"language": "spanish"}),
    using="title-bm25",
    limit=10,
    with_payload=True,
)
