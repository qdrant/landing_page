```python
import ollama
from qdrant_client import QdrantClient, models

ollama_client = ollama.Client()
client = QdrantClient(url="http://localhost:6333")

MODEL = "qwen3-embedding:0.6b"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
```
