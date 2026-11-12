```python
from mistralai.client import Mistral
from qdrant_client import QdrantClient, models

mistral_client = Mistral()
client = QdrantClient(url="http://localhost:6333")

MODEL = "mistral-embed"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
```
