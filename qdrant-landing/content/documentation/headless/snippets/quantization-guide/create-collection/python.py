from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="quantization_example",
    vectors_config=models.VectorParams(
        size=384,
        distance=models.Distance.COSINE,
        datatype=models.Datatype.FLOAT32,
        memory=models.Memory.COLD,
    ),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            bits=models.TurboQuantBitSize.BITS4,
            memory=models.Memory.PINNED,
        ),
    ),
)
