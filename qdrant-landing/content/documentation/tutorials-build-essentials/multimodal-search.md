---
title: Multimodal and Multilingual RAG
short_description: "Build a multimodal, multilingual RAG application with Cohere Embed 4.0 and Qdrant Cloud Inference that searches across image and text modalities."
description: "Tutorial: combine Cohere Embed 4.0 with Qdrant Cloud Inference to power multimodal, multilingual RAG over images and text using a shared embedding space and vector search."
weight: 25
partition: ecosystem
social_preview_image: /documentation/examples/multimodal-search/social_preview.png
aliases:
  - /documentation/tutorials/multimodal-search-fastembed/
  - /documentation/advanced-tutorials/multimodal-search-fastembed/
  - /documentation/multimodal-search/
---

# Multimodal and Multilingual RAG with Cohere and Qdrant

<!-- ![Snow prints](/documentation/examples/multimodal-search/image-1.png) -->

| Time: 15 min | Level: Beginner |Output: [GitHub](https://github.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_Cohere_and_Cloud_Inference.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_Cohere_and_Cloud_Inference.ipynb)   |
| --- | ----------- | ----------- | ----------- |

## Overview

You often understand and share information more effectively when combining different types of data. The taste of comfort food can trigger childhood memories. A song might be described with just "pam pam clap" sounds instead of a paragraph. Emojis and stickers can express a feeling or a complex idea faster than words.

Modalities of data such as **text, images, video, and audio**, in various combinations, form valuable use cases for semantic search applications.

Vector databases, being **modality-agnostic**, are well suited for building these applications.

This tutorial works with two modalities: image and text data. You can build a semantic search application with any combination of modalities, as long as you choose an embedding model that bridges the **semantic gap**.

> The **semantic gap** refers to the difference between low-level features, such as brightness, and high-level concepts, such as cuteness.

[Cohere Embed 4.0](https://cohere.com/blog/embed-4), for example, is built for multimodal and multilingual embedding, and supports more than 30 languages. Instead of running the model yourself, this tutorial calls it through [Qdrant Cloud Inference](/documentation/inference/inference-api/), so Qdrant generates the embeddings and stores them in a [collection](/documentation/concepts/collections/) in one step.

## Setup

You need a Cohere API key to follow along. Create a free one on the [Cohere dashboard](https://dashboard.cohere.com/api-keys).

Install the required library:

```bash
pip install -q qdrant-client
```

## Dataset

To make the demonstration simple, this tutorial uses a tiny dataset of images and their captions.

Download the [tutorial images](https://github.com/qdrant/examples/tree/master/multimodal-search/images) and place them in a folder named `images`, in the same folder as your code or notebook.

## Connect to Qdrant

1. **Create a client object for Qdrant, with Cloud Inference enabled**.

You'll use a [Qdrant Cloud Free Tier Cluster](/documentation/cloud/create-cluster/#free-clusters). [Create a free cluster](https://cloud.qdrant.io/), save the associated API key and endpoint URL, and instantiate the Qdrant client. Set `cloud_inference=True` so Qdrant can generate embeddings for you:

```python
import os

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    cloud_inference=True,
)
```

2. **Define the dataset and a helper to encode images**.

Cloud Inference accepts images as base64 data URLs, so convert each file before uploading it:

```python
import base64

def image_to_base64_url(image_path: str) -> str:
    prefix = "data:image/png;base64"
    with open(image_path, "rb") as image_file:
        return prefix + "," + base64.b64encode(image_file.read()).decode("utf-8")

documents = [
    {"caption": "An image about plane emergency safety.", "image": "images/image-1.png"},
    {"caption": "An image about airplane components.", "image": "images/image-2.png"},
    {"caption": "An image about COVID safety restrictions.", "image": "images/image-3.png"},
    {"caption": "A confidential image about UFO sightings.", "image": "images/image-4.png"},
    {"caption": "An image about unusual footprints on Aralar 2011.", "image": "images/image-5.png"},
]
```

3. **Create a collection for the images with captions**.

```python
COLLECTION_NAME = "multimodal-embeddings"

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "image": models.VectorParams(size=512, distance=models.Distance.COSINE),
            "text": models.VectorParams(size=512, distance=models.Distance.COSINE),
        }
    )
```

## Upload Data to Qdrant

Upload your images with captions to the collection. Each image and its caption is embedded by Cohere Embed 4.0, through [Cloud Inference](/documentation/inference/external-inference-providers/#cohere), and stored as a [point](/documentation/concepts/points/).

Pass your Cohere API key through a header, and describe each vector as a `models.Document` (for text) or `models.Image` (for the image), naming the Cohere model and the output dimension you want:

```python
from qdrant_client.context_headers import headers

cohere_api_key = os.getenv("COHERE_API_KEY")

with headers({"cohere-api-key": cohere_api_key}):
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            models.PointStruct(
                id=idx,
                vector={
                    "text": models.Document(
                        text=doc["caption"],
                        model="cohere/embed-v4.0",
                        options={"output_dimension": 512},
                    ),
                    "image": models.Image(
                        image=image_to_base64_url(doc["image"]),
                        model="cohere/embed-v4.0",
                        options={"output_dimension": 512},
                    ),
                },
                payload=doc
            )
            for idx, doc in enumerate(documents)
        ]
    )
```

## Search

### Text-to-Image

See what image comes back for the query "*Plane components*". Wrap the query in a `models.Document` the same way you did while uploading, so Cloud Inference embeds it with the same model:

```python
from PIL import Image

with headers({"cohere-api-key": cohere_api_key}):
    image_path = client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Document(
            text="Plane components",
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="image",
        with_payload=["image"],
        limit=1
    ).points[0].payload['image']

Image.open(image_path)
```

**Response:**

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

### Multilingual Search

Now run the same query in Italian, one of the 30+ languages Cohere Embed 4.0 supports, and compare the results:

```python
with headers({"cohere-api-key": cohere_api_key}):
    image_path = client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Document(
            text="Componenti di un aereo",
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="image",
        with_payload=["image"],
        limit=1
    ).points[0].payload['image']

Image.open(image_path)
```

**Response:**

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

### Image-to-Text

Now run a reverse search, starting from this image:

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

Embed the image with `models.Image`, and search only among the text vectors:

```python
with headers({"cohere-api-key": cohere_api_key}):
    client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Image(
            image=image_to_base64_url("images/image-2.png"),
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="text",
        with_payload=["caption"],
        limit=1
    ).points[0].payload['caption']
```

**Response:**

```text
'An image about airplane components.'
```

## Next Steps

Even image and text multimodal search alone supports many use cases: e-commerce, media management, content recommendation, emotion recognition, biomedical image retrieval, and spoken sign language transcription, among others.

Consider a shopper who has a picture of a product they want, plus a specific textual requirement, like "*in beige color*". You can search using text or images alone, or combine their embeddings through **late fusion** (summing and weighting the vectors can work surprisingly well).

Combining both modalities with [Discovery Search](/articles/discovery-search/) can also surface results that neither modality would find on its own.

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, experiment, and have fun!
