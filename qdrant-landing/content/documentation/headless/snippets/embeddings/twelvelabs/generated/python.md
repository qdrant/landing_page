```python
import os
import time

from qdrant_client import QdrantClient, models
from twelvelabs import (
    AsyncVideoInputRequest,
    MediaSource,
    MultiInputMediaSource,
    MultiInputRequest,
    TwelveLabs,
)

twelvelabs_client = TwelveLabs(api_key=os.environ["TWELVE_LABS_API_KEY"])
client = QdrantClient(url="http://localhost:6333")

MODEL = "marengo3.5"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=512, distance=models.Distance.COSINE),
)

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
