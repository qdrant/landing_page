```python
model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    lazy_load=True,       # don't load the model until first embed call
)
```
