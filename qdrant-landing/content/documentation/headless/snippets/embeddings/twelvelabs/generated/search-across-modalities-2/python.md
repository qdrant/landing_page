```python
image_query = twelvelabs_client.embed.v_2.create(
    input_type="multi_input",
    model_name=MODEL,
    multi_input=MultiInputRequest(
        media_sources=[
            MultiInputMediaSource(
                media_type="image",
                url="https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
            ),
        ],
    ),
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=image_query.data[0].embedding,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="embedding_option", match=models.MatchValue(value="visual"))]
    ),
    limit=3,
).points
```
