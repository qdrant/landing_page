```python
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
```
