```python
from qdrant_edge import Query, QueryRequest

text_model = TextEmbedding(
    model_name=TEXT_MODEL_NAME,
    cache_dir=MODELS_DIR,
    local_files_only=True
)

embeddings = list(text_model.embed(["<search terms>"]))[0]

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest(embeddings.tolist(),using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```
