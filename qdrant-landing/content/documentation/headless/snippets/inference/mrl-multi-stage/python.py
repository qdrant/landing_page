from qdrant_client import QdrantClient, models
from qdrant_client.context_headers import headers

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-qdrant-api-key>",
    cloud_inference=True
)

with headers({"openai-api-key": "<YOUR_OPENAI_API_KEY>"}):
    client.query_points(
        collection_name="{collection_name}",
        query=models.Document(
            text="How to bake cookies?",
            model="openai/text-embedding-3-small",
        ),
        using="large",
        limit=10,
        prefetch=models.Prefetch(
            query=models.Document(
                text="How to bake cookies?",
                model="openai/text-embedding-3-small",
                options={"mrl": 64},
            ),
            using="small",
            limit=1000,
        )
    )
