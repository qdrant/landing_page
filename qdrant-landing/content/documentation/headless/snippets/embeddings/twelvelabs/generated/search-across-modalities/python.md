```python
audio_query = twelvelabs_client.embed.v_2.create(
    input_type="multi_input",
    model_name=MODEL,
    multi_input=MultiInputRequest(
        media_sources=[
            MultiInputMediaSource(
                media_type="audio",
                url="https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3",
            ),
        ],
    ),
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=audio_query.data[0].embedding,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="embedding_option", match=models.MatchValue(value="audio"))]
    ),
    limit=3,
).points
```
