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

from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_DIMENSION = 512
VECTOR_NAME="my-vector"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

edge_shard = EdgeShard(SHARD_DIRECTORY, config)

from pathlib import Path
from qdrant_edge import Point, UpdateOperation
import uuid

IMAGES_DIR = "images"

image_model = ImageEmbedding(
    model_name=VISION_MODEL_NAME,
    cache_dir=MODELS_DIR,
    local_files_only=True
)

embeddings = list(image_model.embed([Path(IMAGES_DIR) / "temp.jpg"]))[0]

point = Point(
    id=str(uuid.uuid4()),
    vector={VECTOR_NAME: embeddings.tolist()}
)

edge_shard.update(UpdateOperation.upsert_points([point]))

from qdrant_edge import Query, QueryRequest

text_model = TextEmbedding(
    model_name=TEXT_MODEL_NAME,
    cache_dir=MODELS_DIR,
    local_files_only=True
)

embeddings = list(text_model.embed(["<search terms>"]))[0]

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest(embeddings.tolist(),using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```
