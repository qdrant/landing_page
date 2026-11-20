```python
results = client.query_points(
    "menu",
    query=sparse(["tahini"], query=True)[0],
    using="bm25",
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
