```python
import pprint

query = "time travel"

results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=dense_embedding_model),
    using="dense",
    limit=10,
)

pprint.pp(results.points)
```
