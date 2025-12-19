from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=models.NearestQuery(
        nearest=[0.01, 0.45, 0.67], # search vector
        mmr=models.Mmr(
            diversity=0.5, # 0.0 - relevance; 1.0 - diversity
            candidates_limit=100, # num of candidates to preselect
        )
    ),
    limit=10,
)
