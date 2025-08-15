---
title: "Supported Models"
weight: 4
---

# Supported Models

FastEmbed supports a variety of models for different tasks, including dense text embeddings, sparse text embeddings, late interaction text embeddings, and image embeddings. Here are some examples of the models supported:

## How to list all available models

Install `fastembed` and `pandas`, but this time also import the following:

```python
import pandas as pd

from fastembed import (
    SparseTextEmbedding, 
    TextEmbedding,
    LateInteractionTextEmbedding,
    ImageEmbedding,
)
```
For each of the four model types, you will need to run separate commands. 
The output will show all available models.

### Dense Text Embedding Models

This will list all available models for dense text embedding:
```python
supported_models = (
    pd.DataFrame(TextEmbedding.list_supported_models())
    .sort_values("size_in_GB")
    .drop(columns=["sources", "model_file", "additional_files"])
    .reset_index(drop=True)
)
supported_models
```

**Notable models we support:**

- BAAI/bge-small-en-v1.5: A fast and default English model with 384 dimensions.
- sentence-transformers/all-MiniLM-L6-v2: A Sentence Transformer model.
- nomic-ai/nomic-embed-text-v1.5-Q: A quantized English model with 8192 context length and 768 dimensions.

### Sparse Text Embedding Models

This will list all available models for sparse text embedding:
```python
supported_models = (
    pd.DataFrame(SparseTextEmbedding.list_supported_models())
    .sort_values("size_in_GB")
    .drop(columns=["sources", "model_file", "additional_files"])
    .reset_index(drop=True)
)
supported_models
```

**Notable models we support:**

- Qdrant/bm25: BM25 as sparse embeddings meant for retrieval tasks.
- Qdrant/bm42-all-minilm-l6-v2-attentions: A light sparse embedding model.
- prithivida/Splade_PP_en_v1: Independent implementation of the SPLADE++ model.

### Late Interaction Text Embedding Models

This will list all available models for late interaction:
```python
supported_models = (
    pd.DataFrame(LateInteractionTextEmbedding.list_supported_models())
    .sort_values("size_in_GB")
    .drop(columns=["sources", "model_file", "additional_files"])
    .reset_index(drop=True)
)
supported_models
```

**Notable models we support:**

- Colbert-ir/colbertv2.0: A model for late interaction text embedding, suitable for tasks requiring interaction between query and documents.

### Image Embedding Models

This will list all available models for image embedding:
```python
supported_models = (
    pd.DataFrame(ImageEmbedding.list_supported_models())
    .sort_values("size_in_GB")
    .drop(columns=["sources", "model_file", "additional_files"])
    .reset_index(drop=True)
)
supported_models
```

**Notable models we support:**

- Qdrant/resnet50-onnx: ResNet-50 model with 2048 dimensions, designed for image embedding tasks.
- Qdrant/clip-ViT-B-32-vision: CLIP vision encoder based on ViT-B/32, with 512 dimensions.

