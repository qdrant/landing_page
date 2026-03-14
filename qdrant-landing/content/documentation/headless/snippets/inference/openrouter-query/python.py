from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True
)

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(
        text="How to bake cookies?",
        model="openrouter/mistralai/mistral-embed-2312",
        options={
            "openrouter-api-key": "<your_openrouter_api_key>"
        }
    )
)
