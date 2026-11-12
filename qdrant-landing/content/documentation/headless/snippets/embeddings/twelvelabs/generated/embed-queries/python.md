```python
response = twelvelabs_client.embed.v_2.create(
    input_type="multi_input",
    model_name=MODEL,
    multi_input=MultiInputRequest(input_text="A big rabbit wakes up in a forest"),
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=response.data[0].embedding,
    limit=3,
).points
```
