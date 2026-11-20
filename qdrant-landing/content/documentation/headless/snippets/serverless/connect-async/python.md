```python
from qdrant_client.serverless import AsyncQdrantServerless

client = AsyncQdrantServerless(
    url="https://serverless.<region>.cloud.qdrant.io",
    api_key="<your-api-key>",
)

collections = await client.get_collections()
```
