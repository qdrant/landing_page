```python
results = client.query_points(
    "menu",
    query=dense(["vegetarian dishes"], query=True)[0],
    using="dense",
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
