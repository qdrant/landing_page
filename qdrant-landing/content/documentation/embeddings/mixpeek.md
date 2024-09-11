---
title: Mixpeek
weight: 2250
---

# Mixpeek Video Embeddings

Mixpeek's video processing capabilities allow you to chunk and embed videos, while Qdrant provides efficient storage and retrieval of these embeddings.

## Prerequisites

- Python 3.7+
- Mixpeek API key
- Mixpeek client installed (`pip install mixpeek`)
- Qdrant client installed (`pip install qdrant-client`)

## Installation

1. Install the required packages:

```bash
pip install mixpeek qdrant-client
```

2. Set up your Mixpeek API key:

```python
from mixpeek import Mixpeek

mixpeek = Mixpeek('your_api_key_here')
```

3. Initialize the Qdrant client:

```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)
```

## Usage

### 1. Create Qdrant Collection

Make sure to create a Qdrant collection before inserting vectors. You can create a collection with the appropriate vector size (768 for "vuse-generic-v1" model) using:

```python
client.create_collection(
    collection_name="video_chunks",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE)
)
```

### 2. Process and Embed Video

First, process the video into chunks and embed each chunk:

```python
from mixpeek import Mixpeek
from qdrant_client import QdrantClient, models

mixpeek = Mixpeek('your_api_key_here')
client = QdrantClient("localhost", port=6333)

video_url = "https://mixpeek-public-demo.s3.us-east-2.amazonaws.com/starter/jurassic_park_trailer.mp4"

# Process video chunks
processed_chunks = mixpeek.tools.video.process(
    video_source=video_url,
    chunk_interval=1,  # 1 second intervals
    resolution=[720, 1280]
)

# Embed each chunk and insert into Qdrant
for index, chunk in enumerate(processed_chunks):
    print(f"Processing video chunk: {index}")

    embedding = mixpeek.embed.video(
        model_id="vuse-generic-v1",
        input=chunk['base64_chunk'],
        input_type="base64"
    )['embedding']

    # Insert into Qdrant
    client.upsert(
        collection_name="video_chunks",
        points=[models.PointStruct(
            id=index,
            vector=embedding,
            payload={
                "start_time": chunk["start_time"],
                "end_time": chunk["end_time"]
            }
        )]
    )

    print(f"  Embedding preview: {embedding[:5] + ['...'] + embedding[-5:]}")

print(f"Processed and inserted {len(processed_chunks)} chunks")
```

### 3. Search for Similar Video Chunks

To search for similar video chunks, you can use either text or video queries:

#### Text Query

```python
query_text = "a car chase scene"

# Embed the text query
query_embedding = mixpeek.embed.video(
    model_id="vuse-generic-v1",
    input=query_text,
    input_type="text"
)['embedding']

# Search in Qdrant
search_results = client.query_points(
    collection_name="video_chunks",
    query=query_embedding,
    limit=5
).points

for result in search_results:
    print(f"Chunk ID: {result.id}, Score: {result.score}")
    print(f"Time range: {result.payload['start_time']} - {result.payload['end_time']}")
```

#### Video Query

```python
query_video_url = "https://mixpeek-public-demo.s3.us-east-2.amazonaws.com/starter/jurassic_bunny.mp4"

# Embed the video query
query_embedding = mixpeek.embed.video(
    model_id="vuse-generic-v1",
    input=query_video_url,
    input_type="url"
)['embedding']

# Search in Qdrant
search_results = client.query_points(
    collection_name="video_chunks",
    query=query_embedding,
    limit=5
).points

for result in search_results:
    print(f"Chunk ID: {result.id}, Score: {result.score}")
    print(f"Time range: {result.payload['start_time']} - {result.payload['end_time']}")
```

## Resources
For more information on Mixpeek Embed, review the official documentation: https://docs.mixpeek.com/api-documentation/inference/embed
