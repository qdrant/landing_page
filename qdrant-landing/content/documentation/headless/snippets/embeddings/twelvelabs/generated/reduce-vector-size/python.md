```python
task = twelvelabs_client.embed.v_2.tasks.create(
    input_type="video",
    model_name=MODEL,
    embedding_dimension=256,
    video=AsyncVideoInputRequest(media_source=MediaSource(url=VIDEO_URL)),
)

response = twelvelabs_client.embed.v_2.create(
    input_type="multi_input",
    model_name=MODEL,
    embedding_dimension=256,
    multi_input=MultiInputRequest(input_text="A big rabbit wakes up in a forest"),
)
```
