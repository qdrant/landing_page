---
title: Twelve Labs
---

# Twelve Labs

[Twelve Labs](https://twelvelabs.io) Embed API provides powerful embeddings that represent videos, texts, images, and audio in a unified vector space. This space enables any-to-any searches across different types of content.

By natively processing all modalities, it captures interactions like visual expressions, speech, and context, enabling advanced applications such as sentiment analysis, anomaly detection, and recommendation systems with precision and efficiency.

We'll look at how to work with Twelve Labs embeddings in Qdrant via the Python and Node SDKs.

### Installing the SDKs

```python
$ pip install twelvelabs qdrant-client
```

```typescript
$ npm install twelvelabs-js @qdrant/js-client-rest
```

### Setting up the clients

```python
from twelvelabs import TwelveLabs
from qdrant_client import QdrantClient

# Get your API keys from:
# https://playground.twelvelabs.io/dashboard/api-key
TL_API_KEY = "<YOUR_TWELVE_LABS_API_KEY>"

twelvelabs_client = TwelveLabs(api_key=TL_API_KEY)
qdrant_client = QdrantClient(url="http://localhost:6333/")
```

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import { TwelveLabs, EmbeddingsTask, SegmentEmbedding } from 'twelvelabs-js';

// Get your API keys from:
// https://playground.twelvelabs.io/dashboard/api-key
const TL_API_KEY = "<YOUR_TWELVE_LABS_API_KEY>"

const twelveLabsClient = new TwelveLabs({ apiKey: TL_API_KEY });
const qdrantClient = new QdrantClient({ url: 'http://localhost:6333' });
```

The following example uses the `"Marengo-retrieval-2.7"` model to embed a video. It generates vector embeddings of 1024 dimensionality and works with cosine similarity.

You can use the same model to embed audio, text and images into a common vector space. Enabling cross-modality searches!

### Embedding videos

```python
task = twelvelabs_client.embed.task.create(
    model_name="Marengo-retrieval-2.7",
    video_url="https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4"
)

task.wait_for_done(sleep_interval=3)

task_result = twelvelabs_client.embed.task.retrieve(task.id)
```

```typescript
const task = await twelveLabsClient.embed.task.create("Marengo-retrieval-2.7", {
    url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4"
})

await task.waitForDone(3)

const taskResult = await twelveLabsClient.embed.task.retrieve(task.id)
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=v.embeddings_float,
        payload={
            "start_offset_sec": v.start_offset_sec,
            "end_offset_sec": v.end_offset_sec,
            "embedding_scope": v.embedding_scope,
        },
    )
    for idx, v in enumerate(task_result.video_embedding.segments)
]
```

```typescript
let points = taskResult.videoEmbedding.segments.map((data, i) => {
    return {
        id: i,
        vector: data.embeddingsFloat,
        payload: {
            startOffsetSec: data.startOffsetSec,
            endOffsetSec: data.endOffsetSec,
            embeddingScope: data.embeddingScope
        }
    }
})
```

### Creating a collection to insert the vectors

```python
from qdrant_client.models import VectorParams, Distance

collection_name = "twelve_labs_collection"

qdrant_client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1024,
        distance=Distance.COSINE,
    ),
)
qdrant_client.upsert(collection_name, points)
```

```typescript
const COLLECTION_NAME = "twelve_labs_collection"

await qdrantClient.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 1024,
        distance: 'Cosine',
    }
});

await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points
})
```

## Perform a search

Once the vectors are added, you can run semantic searches across different modalities. Let's try text.

```python
text_segment = twelvelabs_client.embed.create(
    model_name="Marengo-retrieval-2.7",
    text="<YOUR_QUERY_TEXT>",
).text_embedding.segments[0]

qdrant_client.query_points(
    collection_name=collection_name,
    query=text_segment.embeddings_float,
)
```

```typescript
const textSegment = (await twelveLabsClient.embed.create({
    modelName: "Marengo-retrieval-2.7",
    text: "<YOUR_QUERY_TEXT>"
})).textEmbedding.segments[0]

await qdrantClient.query(COLLECTION_NAME, {
    query: textSegment.embeddingsFloat,
});
```

Let's try audio:

```python
audio_segment = twelvelabs_client.embed.create(
    model_name="Marengo-retrieval-2.7",
    audio_url="https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3",
).audio_embedding.segments[0]

qdrant_client.query_points(
    collection_name=collection_name,
    query=audio_segment.embeddings_float,
)
```

```typescript
const audioSegment = (await twelveLabsClient.embed.create({
    modelName: "Marengo-retrieval-2.7",
    audioUrl: "https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3"
})).audioEmbedding.segments[0]

await qdrantClient.query(COLLECTION_NAME, {
    query: audioSegment.embeddingsFloat,
});
```

Similarly, querying by image:

```python
image_segment = twelvelabs_client.embed.create(
    model_name="Marengo-retrieval-2.7",
    image_url="https://gratisography.com/wp-content/uploads/2024/01/gratisography-cyber-kitty-1170x780.jpg",
).image_embedding.segments[0]

qdrant_client.query_points(
    collection_name=collection_name,
    query=image_segment.embeddings_float,
)
```

```typescript
const imageSegment = (await twelveLabsClient.embed.create({
    modelName: "Marengo-retrieval-2.7",
    imageUrl: "https://gratisography.com/wp-content/uploads/2024/01/gratisography-cyber-kitty-1170x780.jpg"
})).imageEmbedding.segments[0]

await qdrantClient.query(COLLECTION_NAME, {
    query: imageSegment.embeddingsFloat,
});
```

## Further Reading

- [Twelve Labs Documentation](https://docs.twelvelabs.io/)
- [Twelve Labs Examples](https://docs.twelvelabs.io/docs/sample-applications)
