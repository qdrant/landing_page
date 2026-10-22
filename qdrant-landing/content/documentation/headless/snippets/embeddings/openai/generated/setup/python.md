```python
from openai import OpenAI
from qdrant_client import QdrantClient, models

openai_client = OpenAI()
client = QdrantClient(url="http://localhost:6333")

MODEL = "text-embedding-3-small"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
)
```
