```python
results = client.query_points(
    "menu",
    query=Document(text="vegetarian dishes", model=MODEL),
    using="dense",
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
