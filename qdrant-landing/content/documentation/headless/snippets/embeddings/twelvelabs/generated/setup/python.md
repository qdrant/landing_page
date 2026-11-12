```python
import os
import time

from qdrant_client import QdrantClient, models
from twelvelabs import (
    AsyncVideoInputRequest,
    MediaSource,
    MultiInputMediaSource,
    MultiInputRequest,
    TwelveLabs,
)

twelvelabs_client = TwelveLabs(api_key=os.environ["TWELVE_LABS_API_KEY"])
client = QdrantClient(url="http://localhost:6333")

MODEL = "marengo3.5"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=512, distance=models.Distance.COSINE),
)
```
