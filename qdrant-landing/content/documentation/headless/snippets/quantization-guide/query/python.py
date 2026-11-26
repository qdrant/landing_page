from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
query_vector: list[float] = [0.1] * 384
# @hide-end

results = client.query_points(
    collection_name="quantization_example",
    query=query_vector,
    limit=10,
    search_params=models.SearchParams(
        hnsw_ef=256,
        quantization=models.QuantizationSearchParams(
            rescore=True,
            oversampling=2.0,
        ),
    ),
)
