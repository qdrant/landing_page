from qdrant_client import QdrantClient, models

# @hide-start
QDRANT_URL=""
QDRANT_API_KEY=""
points: list[models.PointStruct] = []
COLLECTION_NAME=""
# @hide-end

# @block-start client-connection
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    local_inference_batch_size=256,  # FastEmbed batch size
)
# @block-end client-connection

# @block-start lazy-load
point = models.PointStruct(
    id=1,
    vector=models.Document(
        text="The text to embed",
        model="BAAI/bge-small-en-v1.5",
        options={
            "lazy_load": True,
        },
    )
)
# @block-end lazy-load

# @block-start lazy-load-gpu
point = models.PointStruct(
    id=1,
    vector=models.Document(
        text="The text to embed",
        model="BAAI/bge-small-en-v1.5",
        options={
            "lazy_load": True,
            "cuda": True,
        },
    )
)
# @block-end lazy-load-gpu

# @block-start upload-data
client.upload_points(
    collection_name=COLLECTION_NAME,
    points=points,
    parallel=4    # use 4 workers to process documents in parallel
)
# @block-end upload-data