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
