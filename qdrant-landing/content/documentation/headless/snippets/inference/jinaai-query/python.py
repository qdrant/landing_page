from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333", 
    api_key="<your-api-key>", 
    cloud_inference=True
)

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(
        text="Mission to Mars", 
        model="jinaai/jina-clip-v2", 
        options={
            "jina-api-key": "<your_jinaai_api_key>", 
            "dimensions": 512
        }
    )
)
