---
title: Multilingual & Multimodal RAG with LlamaIndex
weight: 14
partition: build
social_preview_image: /documentation/examples/multimodal-search/social_preview.png
aliases:
  - /documentation/tutorials/multimodal-search-fastembed/
  - /documentation/advanced-tutorials/multimodal-search-fastembed/
---

# Multilingual & Multimodal Search with LlamaIndex

![Snow prints](/documentation/examples/multimodal-search/image-1.png)

| Time: 15 min | Level: Beginner |Output: [GitHub](https://github.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_LlamaIndex.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_LlamaIndex.ipynb)   |
| --- | ----------- | ----------- | ----------- |

## Overview

We often understand and share information more effectively when combining different types of data. For example, the taste of comfort food can trigger childhood memories. We might describe a song with just “pam pam clap” sounds. Instead of writing paragraphs. Sometimes, we may use emojis and stickers to express how we feel or to share complex ideas.

Modalities of data such as **text**, **images**, **video** and **audio** in various combinations form valuable use cases for Semantic Search applications.

Vector databases, being **modality-agnostic**, are perfect for building these applications.

In this simple tutorial, we are working with two simple modalities: **image** and **text** data. However, you can create a Semantic Search application with any combination of modalities if you choose the right embedding model to bridge the **semantic gap**.

> The **semantic gap** refers to the difference between low-level features (aka brightness) and high-level concepts (aka cuteness).

For example, the [vdr-2b-multi-v1 model](https://huggingface.co/llamaindex/vdr-2b-multi-v1) from LlamaIndex is designed for multilingual embedding, particularly effective for visual document retrieval across multiple languages and domains. It allows for searching and querying visually rich multilingual documents without the need for OCR or other data extraction pipelines.

## Setup

First, install the required libraries `qdrant-client` and `llama-index-embeddings-huggingface`.

```bash
pip install qdrant-client llama-index-embeddings-huggingface
```

<aside role="status">
The code for this tutorial can be found <a href="https://github.com/qdrant/examples/multimodal-search">here</a>.
</aside>

## Dataset

To make the demonstration simple, we created a tiny dataset of images and their captions for you.

Images can be downloaded from [here](https://github.com/qdrant/examples/tree/master/multimodal-search/images). It's **important** to place them in the same folder as your code/notebook, in the folder named `images`.

## Vectorize data

`LlamaIndex`'s `vdr-2b-multi-v1` model supports cross-lingual retrieval, allowing for effective searches across languages and domains. It encodes document page screenshots into dense single-vector representations, eliminating the need for OCR and other complex data extraction processes.

Let's embed the images and their captions in the **shared embedding space**.

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

model = HuggingFaceEmbedding(
    model_name="llamaindex/vdr-2b-multi-v1",
    device="cpu",  # "mps" for mac, "cuda" for nvidia GPUs
    trust_remote_code=True,
)

documents = [
    {"caption": "An image about plane emergency safety.", "image": "images/image-1.png"},
    {"caption": "An image about airplane components.", "image": "images/image-2.png"},
    {"caption": "An image about COVID safety restrictions.", "image": "images/image-3.png"},
    {"caption": "An confidential image about UFO sightings.", "image": "images/image-4.png"},
    {"caption": "An image about unusual footprints on Aralar 2011.", "image": "images/image-5.png"},
]

text_embeddings = model.get_text_embedding_batch([doc["caption"] for doc in documents])
image_embeddings = model.get_image_embedding_batch([doc["image"] for doc in documents])
```

## Upload data to Qdrant

1. **Create a client object for Qdrant**.

```python
from qdrant_client import QdrantClient, models

# docker run -p 6333:6333 qdrant/qdrant
client = QdrantClient(url="http://localhost:6333/")
```

2. **Create a new collection for the images with captions**.

```python
COLLECTION_NAME = "llama-multi"

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "image": models.VectorParams(size=len(image_embeddings[0]), distance=models.Distance.COSINE),
            "text": models.VectorParams(size=len(text_embeddings[0]), distance=models.Distance.COSINE),
        }
    )
```

3. **Upload our images with captions to the Collection**.

```python
client.upload_points(
    collection_name=COLLECTION_NAME,
    points=[
        models.PointStruct(
            id=idx,
            vector={
                "text": text_embeddings[idx],
                "image": image_embeddings[idx],
            },
            payload=doc
        )
        for idx, doc in enumerate(documents)
    ]
)
```

## Search

### Text-to-Image

Let's see what image we will get to the query "*Adventures on snow hills*".

```python
from PIL import Image

find_image = model.get_query_embedding("Adventures on snow hills")

Image.open(client.query_points(
    collection_name=COLLECTION_NAME,
    query=find_image,
    using="image",
    with_payload=["image"],
    limit=1
).points[0].payload['image'])
```

Let's also run the same query in Italian and compare the results.

### Multilingual Search

Now, let's do a multilingual search using an Italian query:

```python
Image.open(client.query_points(
    collection_name=COLLECTION_NAME,
    query=model.get_query_embedding("Avventure sulle colline innevate"),
    using="image",
    with_payload=["image"],
    limit=1
).points[0].payload['image'])
```

**Response:**

![Snow prints](/documentation/advanced-tutorials/snow-prints.png)

### Image-to-Text

Now, let's do a reverse search with the following image:

![Airplane](/documentation/advanced-tutorials/airplane.png)

```python
client.query_points(
    collection_name=COLLECTION_NAME,
    query=model.get_image_embedding("images/image-2.png"),  
    # Now we are searching only among text vectors with our image query
    using="text",
    with_payload=["caption"],
    limit=1
).points[0].payload['caption']
```

**Response:**

```text
'An image about plane emergency safety.'
```

## Next steps

Use cases of even just Image & Text Multimodal Search are countless: E-Commerce, Media Management, Content Recommendation, Emotion Recognition Systems, Biomedical Image Retrieval, Spoken Sign Language Transcription, etc.

Imagine a scenario: a user wants to find a product similar to a picture they have, but they also have specific textual requirements, like "*in beige colour*". You can search using just texts or images and combine their embeddings in a **late fusion manner** (summing and weighting might work surprisingly well).

Moreover, using [Discovery Search](/articles/discovery-search/) with both modalities, you can provide users with information that is impossible to retrieve unimodally!

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, experiment, and have fun!
