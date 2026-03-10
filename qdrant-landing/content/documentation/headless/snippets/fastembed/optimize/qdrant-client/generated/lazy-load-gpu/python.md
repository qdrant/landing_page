```python
client.set_model(
    "BAAI/bge-small-en-v1.5",
    lazy_load=True,       # don't load the model until first embed call
    cuda=True,            # enable GPU acceleration
    device_ids=[0, 1],    # spread workers across GPUs 0 and 1
)
```
