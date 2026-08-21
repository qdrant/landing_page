---
title: "Supported Models"
short_description: "Browse all FastEmbed models for dense text, sparse text, late interaction, and image embedding. Tables are generated from the installed package."
description: "A full reference of FastEmbed supported models organized by type: dense text, sparse text, late interaction, and image embedding, with dimensions, license, and size."
weight: 15
---

# Supported Models

FastEmbed supports models across four embedding types: dense text, sparse text, late interaction, and image. This page lists every model available in the current release. To see which models your local installation supports, see [List Models for Your Local Installation](#list-models-for-your-local-installation).

## Dense Text Embedding Models

{{% include "content/documentation/headless/content/fastembed/text-embedding-models.md" %}}

## Sparse Text Embedding Models

{{% include "content/documentation/headless/content/fastembed/sparse-text-embedding-models.md" %}}

## Late Interaction Models

{{% include "content/documentation/headless/content/fastembed/late-interaction-models.md" %}}

## Image Embedding Models

{{% include "content/documentation/headless/content/fastembed/image-embedding-models.md" %}}

## List Models for Your Local Installation

To see which models your locally installed version of FastEmbed supports, use the following code:

```python
from fastembed import (
    ImageEmbedding,
    LateInteractionTextEmbedding,
    SparseTextEmbedding,
    TextEmbedding,
)

model_types = {
    "Dense text": TextEmbedding,
    "Sparse text": SparseTextEmbedding,
    "Late interaction": LateInteractionTextEmbedding,
    "Image": ImageEmbedding,
}

for label, cls in model_types.items():
    print(f"\n{label}:")
    for m in cls.list_supported_models():
        print(f"  {m['model']}")
```
