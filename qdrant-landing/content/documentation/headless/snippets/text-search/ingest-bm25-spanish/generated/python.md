```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="books",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "title-bm25": models.Document(
                    text="La Máquina del Tiempo",
                    model="qdrant/bm25",
                    options={"language": "spanish"},
                )
            },
            payload={
                "title": "La Máquina del Tiempo",
                "author": "H.G. Wells",
                "isbn": "9788411486880",
            },
        )
    ],
)
```
