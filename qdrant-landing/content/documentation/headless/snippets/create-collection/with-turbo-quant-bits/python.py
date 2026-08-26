from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            memory=models.Memory.PINNED,
            bits=models.TurboQuantBitSize.BITS2,
        ),
    ),
)
