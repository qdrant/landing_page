```python
config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    },
    max_search_threads=4,
    search_pool_core=0,
)

edge_shard = EdgeShard.load(SHARD_DIRECTORY, config)
```
