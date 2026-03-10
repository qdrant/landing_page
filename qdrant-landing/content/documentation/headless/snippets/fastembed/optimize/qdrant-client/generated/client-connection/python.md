```python
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    local_inference_batch_size=256,  # FastEmbed batch size
)
```
