from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

sampled = client.query_points(
    collection_name="{collection_name}",
    query=models.SampleQuery(sample=models.Sample.RANDOM)
)
