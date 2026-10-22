```python
import json

import boto3
from qdrant_client import QdrantClient, models

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
client = QdrantClient(url="http://localhost:6333")

MODEL_ID = "amazon.titan-embed-text-v2:0"

def embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        body=json.dumps({"inputText": text, "dimensions": 1024, "normalize": True}),
    )
    return json.loads(response["body"].read())["embedding"]

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
```
