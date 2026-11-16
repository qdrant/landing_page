```python
from google import genai
from google.genai import types
from qdrant_client import QdrantClient, models

gemini_client = genai.Client()
client = QdrantClient(url="http://localhost:6333")

MODEL = "gemini-embedding-2"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=3072, distance=models.Distance.COSINE),
)
```
