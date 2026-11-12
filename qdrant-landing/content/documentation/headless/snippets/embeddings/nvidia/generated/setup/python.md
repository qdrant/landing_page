```python
import os

from openai import OpenAI
from qdrant_client import QdrantClient, models

nvidia = OpenAI(
    api_key=os.environ["NVIDIA_API_KEY"],
    base_url="https://integrate.api.nvidia.com/v1",
)
client = QdrantClient(url="http://localhost:6333")

MODEL = "nvidia/nemotron-3-embed-1b"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
)
```
