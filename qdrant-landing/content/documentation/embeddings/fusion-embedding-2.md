---
title: Fusion Embedding 2
short_description: "Embed text, image, video, and audio into one vector space with the open-weight Fusion Embedding 2 model and search it with Qdrant."
description: "Use EximiusLabs Fusion Embedding 2, an open-weight multimodal embedding model, with Qdrant to index and search content in a shared vector space. This guide covers the text path."
---

# Fusion Embedding 2

[Fusion Embedding 2](https://huggingface.co/EximiusLabs/fusion-embedding-2-2b-preview) is an open-weight multimodal embedding model from Eximius Labs. It maps text, image, video, and audio into a single shared vector space, so content of different types is directly comparable. The model runs on your own hardware and its weights are on Hugging Face.

We'll look at how to generate Fusion Embedding 2 text vectors and index them in Qdrant with the Python SDK. The lightweight text encoder loads only the base and the trained text head, so it does not pull the audio tower.

### Installing the dependencies

```python
$ pip install "git+https://github.com/Eximius-Labs/fusion-embedding" qdrant-client
```

### Loading the model

```python
from fusion_embedding import FusionTextEmbedder
from qdrant_client import QdrantClient

model = FusionTextEmbedder.from_pretrained("EximiusLabs/fusion-embedding-2-2b-preview")
client = QdrantClient(url="http://localhost:6333/")
```

### Encoding data

```python
texts = [
    "a dog running on the beach",
    "a slow piano melody",
    "a red bicycle leaning on a wall",
]
embeddings = model.encode(texts)  # numpy array of shape [len(texts), dim]
```

### Creating a collection and upserting the vectors

```python
from qdrant_client.models import VectorParams, Distance, PointStruct

collection_name = "fusion_embedding_2"

client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=embeddings.shape[1],
        distance=Distance.COSINE,
    ),
)

client.upsert(
    collection_name,
    points=[
        PointStruct(id=idx, vector=vector.tolist(), payload={"text": texts[idx]})
        for idx, vector in enumerate(embeddings)
    ],
)
```

### Searching

```python
query = model.encode("something to ride")  # a single string returns one vector

client.query_points(
    collection_name=collection_name,
    query=query.tolist(),
)
```

## Further reading

- [Fusion Embedding 2 on Hugging Face](https://huggingface.co/EximiusLabs/fusion-embedding-2-2b-preview)
- [Eximius Labs on GitHub](https://github.com/Eximius-Labs)
