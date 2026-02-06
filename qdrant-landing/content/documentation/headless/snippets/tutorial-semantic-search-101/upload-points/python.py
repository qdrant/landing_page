# @hide-start
# mypy: disable-error-code="arg-type"
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="",
    api_key="",
    cloud_inference=True
)

COLLECTION_NAME=""
documents = documents = [
    {
        "name": "",
        "description": "",
        "author": "",
        "year": 1895,
    }]
# @hide-end

EMBEDDING_MODEL="sentence-transformers/all-minilm-l6-v2"

client.upload_points(
    collection_name=COLLECTION_NAME,
    points=[
        models.PointStruct(
            id=idx,
            vector=models.Document(
                text=doc["description"],
                model=EMBEDDING_MODEL
            ),
            payload=doc
        )
        for idx, doc in enumerate(documents)
    ],
)