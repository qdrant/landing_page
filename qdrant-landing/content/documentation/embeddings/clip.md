---
title: Clip
weight: 1300
---

# Using Clip with Qdrant 

CLIP (Contrastive Language-Image Pre-Training) provides advanced AI capabilities including natural language processing and computer vision. CLIP is a neural network trained on a variety of (image, text) pairs. It can be instructed in natural language to predict the most relevant text snippet, given an image, without directly optimizing for the task, similarly to the zero-shot capabilities of GPT-2 and 3.

## Installation

You can install the required package using the following pip command:

```bash
pip install clip-client
```
## Integration Example

```python
import qdrant_client
from qdrant_client.models import Batch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image

# Load the CLIP model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Load and process the image
image = Image.open("path/to/image.jpg")
inputs = processor(images=image, return_tensors="pt")

# Generate embeddings
with torch.no_grad():
    embeddings = model.get_image_features(**inputs).numpy().tolist()

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="ImageEmbeddings",
    points=Batch(
        ids=[1],
        vectors=embeddings,
    )
)

```

