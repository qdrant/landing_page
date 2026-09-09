```python
def check_gate():
    # compare this pipeline's constants against what the collection records about itself
    meta = client.get_collection(COLLECTION).config.metadata or {}

    if meta.get("embedding_model") != MODEL or meta.get("pipeline_version") != PIPELINE:
        raise RuntimeError(f"collection was built by {meta}: full re-embed into a fresh collection required")
```
