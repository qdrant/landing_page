```python
VIDEO_URL = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4"

task = twelvelabs_client.embed.v_2.tasks.create(
    input_type="video",
    model_name=MODEL,
    video=AsyncVideoInputRequest(
        media_source=MediaSource(url=VIDEO_URL),
        embedding_scope=["clip"],
    ),
)

result = twelvelabs_client.embed.v_2.tasks.retrieve(task.id)
while result.status == "processing":
    time.sleep(5)
    result = twelvelabs_client.embed.v_2.tasks.retrieve(task.id)

if result.status != "ready" or result.data is None:
    raise RuntimeError(f"Embedding task {task.id} failed: {result.error}")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector=segment.embedding,
            payload={
                "video_url": VIDEO_URL,
                "embedding_option": segment.embedding_option,
                "start_sec": segment.start_sec,
                "end_sec": segment.end_sec,
            },
        )
        for idx, segment in enumerate(result.data)
    ],
)
```
