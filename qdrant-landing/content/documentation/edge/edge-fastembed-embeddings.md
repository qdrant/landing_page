---
title: "On-Device Embeddings" 
weight: 15
---

# On-Device Embeddings with Qdrant Edge and FastEmbed

To generate embeddings for use with Qdrant Edge directly on a device, you can use the [FastEmbed](/documentation/fastembed/) library. FastEmbed provides multimodal models that run efficiently on edge devices to generate vector embeddings from text and images.

# Provision the Device

Assuming the devices on which you will run Qdrant Edge have intermittent or no internet connectivity, you need to provision them with the necessary dependencies and model files ahead of time. First, install FastEmbed and the Qdrant Edge Python bindings:

```python
pip install fastembed qdrant-edge-py
```

Next, download the embedding models and save them locally on the device. Instantiate instances of `ImageEmbedding` and `TextEmbedding`, setting the `cache_dir` parameter to a local directory:

```python
from fastembed import ImageEmbedding, TextEmbedding

TEXT_MODEL_NAME='Qdrant/clip-ViT-B-32-text'
VISION_MODEL_NAME='Qdrant/clip-ViT-B-32-vision'
MODELS_DIR="./qdrant-edge-directory/models"

ImageEmbedding(
    model_name=VISION_MODEL_NAME, 
    cache_dir=MODELS_DIR
)

TextEmbedding(
    model_name=TEXT_MODEL_NAME, 
    cache_dir=MODELS_DIR
)
```

The models will be downloaded and cached in the specified `MODELS_DIR` directory, from where you can use them to generate embeddings.

# Generate Image Embeddings

First, initialize an Edge Shard as described in the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).

<details>
<summary>Details</summary>

```python
from pathlib import Path
from qdrant_edge import ( 
    Distance, 
    EdgeConfig,
    EdgeShard, 
    VectorDataConfig, 
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_DIMENSION = 512
VECTOR_NAME="my-vector"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

edge_shard = EdgeShard(SHARD_DIRECTORY, config)
```

</details>

Assuming you have an image file `temp.jpg`, you can generate an embedding for it using FastEmbed's `ImageEmbedding` class and then store it in the Edge Shard:

```python
from pathlib import Path
from qdrant_edge import Point, UpdateOperation
import uuid

IMAGES_DIR = "images"

model = ImageEmbedding(
    model_name=VISION_MODEL_NAME, 
    cache_dir=MODELS_DIR,
    local_files_only=True
)
    
embeddings = list(model.embed([Path(IMAGES_DIR) / "temp.jpg"]))[0]

point = Point(
    id=str(uuid.uuid4()), 
    vector={VECTOR_NAME: embeddings.tolist()}
)

edge_shard.update(UpdateOperation.upsert_points([point]))
```

Note the use of `cache_dir=MODELS_DIR` and `local_files_only=True` to load the image embedding model from the local directory where it was previously downloaded.

# Generate Text Embeddings

At query time, you can generate text embeddings using FastEmbed's `TextEmbedding` class. For example, to query the Edge Shard:

```python
from qdrant_edge import Query, QueryRequest

model = TextEmbedding(
    model_name=TEXT_MODEL_NAME,
    cache_dir=MODELS_DIR,
    local_files_only=True
)

embeddings = list(model.embed(["<search terms>"]))[0]

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest(embeddings.tolist(),using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```

Again, using `cache_dir=MODELS_DIR` and `local_files_only=True` ensures the text embedding model is loaded from the local directory.