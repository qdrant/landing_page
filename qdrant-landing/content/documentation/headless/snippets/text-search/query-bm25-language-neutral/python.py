from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

# Note: these BM25 options are not supported by FastEmbed
client.query_points(
    collection_name="books",
    query=models.Document(
        text="Mieville",
        model="qdrant/bm25",
        options={"language": "none", "tokenizer": "multilingual", "ascii_folding": True},
    ),
    using="author-bm25",
    limit=10,
    with_payload=True,
)
