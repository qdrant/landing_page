```python
from qdrant_client import QdrantClient, models
from sie_qdrant import SIEVectorizer

MODEL = "BAAI/bge-m3"

vectorizer = SIEVectorizer(base_url="http://localhost:8080", model=MODEL)
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
```
