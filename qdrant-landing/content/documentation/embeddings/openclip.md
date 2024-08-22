---
title: OpenCLIP
weight: 2750
---

# Using OpenCLIP with Qdrant

OpenCLIP is an open-source implementation of the CLIP model, allowing for open source generation of multimodal embeddings that link text and images. 

```python
import qdrant_client
from qdrant_client.models import Batch
import open_clip

# Load the OpenCLIP model and tokenizer
model, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
tokenizer = open_clip.get_tokenizer('ViT-B-32')

# Generate embeddings for a text
text = "A photo of a cat"
text_inputs = tokenizer([text])

with torch.no_grad():
    text_features = model.encode_text(text_inputs)

# Convert tensor to a list
embeddings = text_features[0].cpu().numpy().tolist()

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="OpenCLIPEmbeddings",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)
```

