```python
from fastembed import TextEmbedding

model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    lazy_load=True,       # don't load the model until first embed call
)

model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    lazy_load=True,       # don't load the model until first embed call
    cuda=True,            # enable GPU acceleration
    device_ids=[0, 1],    # spread workers across GPUs 0 and 1
)

embeddings = list(model.embed(docs, batch_size=256, parallel=4))
```
