from qdrant_client import QdrantClient, models


client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="books",
    sparse_vectors_config={
        "title-bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)
    },
)
