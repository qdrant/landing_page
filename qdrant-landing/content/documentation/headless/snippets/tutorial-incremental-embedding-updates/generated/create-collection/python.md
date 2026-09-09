```python
MODEL = "sentence-transformers/all-MiniLM-L6-v2"
PIPELINE = "docs-prep-pipeline-v1"
COLLECTION = "docs-sync-tutorial"

client.create_collection(
    COLLECTION,
    vectors_config=models.VectorParams(
        size=384,  # all-MiniLM-L6-v2 output dimension
        distance=models.Distance.COSINE,
    ),
    metadata={"embedding_model": MODEL, "pipeline_version": PIPELINE},
)
```
