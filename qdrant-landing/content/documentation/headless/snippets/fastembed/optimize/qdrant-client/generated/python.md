```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    local_inference_batch_size=256,  # FastEmbed batch size
)

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

client.upload_points(
    collection_name=COLLECTION_NAME,
    points=points,
    parallel=4    # use 4 workers to process documents in parallel
)
```
