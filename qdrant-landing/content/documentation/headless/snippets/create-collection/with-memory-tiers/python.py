from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768,
        distance=models.Distance.COSINE,
        memory=models.Memory.CACHED,
    ),
    hnsw_config=models.HnswConfigDiff(memory=models.Memory.COLD),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            memory=models.Memory.PINNED,
        ),
    ),
    payload=models.PayloadStorageParams(memory=models.Memory.CACHED),
)
