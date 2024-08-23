---
title: Multimodal Search
weight: 4
---

# Multimodal Search with Qdrant and FastEmbed

| Time: 15 min | Level: Beginner |Output: [GitHub](https://github.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_FastEmbed.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_FastEmbed.ipynb)   |
| --- | ----------- | ----------- | ----------- |

In this tutorial, you will set up a simple Multimodal Image & Text Search with Qdrant & FastEmbed.

## Overview

We often understand and share information more effectively when combining different types of data. For example, the taste of comfort food can trigger childhood memories. We might describe a song with just “pam pam clap” sounds. Instead of writing paragraphs. Sometimes, we may use emojis and stickers to express how we feel or to share complex ideas.

Modalities of data such as **text**, **images**, **video** and **audio** in various combinations form valuable use cases for Semantic Search applications.

Vector databases, being **modality-agnostic**, are perfect for building these applications.

In this simple tutorial, we are working with two simple modalities: **image** and **text** data. However, you can create a Semantic Search application with any combination of modalities if you choose the right embedding model to bridge the **semantic gap**.

> The **semantic gap** refers to the difference between low-level features (aka brightness) and high-level concepts (aka cuteness).

For example, the [ImageBind model](https://github.com/facebookresearch/ImageBind) from Meta AI is said to bind all 4 mentioned modalities in one shared space.

## Prerequisites

> **Note**: The code for this tutorial can be found [here](https://github.com/qdrant/examples/multimodal-search)

To complete this tutorial, you will need either Docker to run a pre-built Docker image of Qdrant and Python version ≥ 3.8 or a Google Collab Notebook if you don't want to install anything locally. 

We showed how to run Qdrant in Docker in the ["Create a Simple Neural Search Service"](https://qdrant.tech/documentation/tutorials/neural-search/) Tutorial.

## Setup

First, install the required libraries `qdrant-client`, `fastembed` and `Pillow`.
For example, with the `pip` package manager, it can be done in the following way.

```bash
python3 -m pip install --upgrade qdrant-client fastembed Pillow
```

<aside role="status">
We will use <a href="https://qdrant.tech/documentation/fastembed/">FastEmbed</a> for generating multimodal embeddings and <b>Qdrant</b> for storing and retrieving them.
</aside>

## Dataset
To make the demonstration simple, we created a tiny dataset of images and their captions for you.

Images can be downloaded from [here](https://github.com/qdrant/examples/multimodal-search/images).
It's **important** to place them in the same folder as your code/notebook, in the folder named `images`.

You can check out how images look like in the following way:
```python
from PIL import Image

Image.open('images/lizard.jpg')
```
## Vectorize data

`FastEmbed` supports **Contrastive Language–Image Pre-training** ([CLIP](https://openai.com/index/clip/)) model, the old (2021) but gold classics of multimodal Image-Text Machine Learning. 
**CLIP** model was one of the first models of such kind with ZERO-SHOT capabilities.

When using it for semantic search, it's important to remember that the textual encoder of CLIP is trained to process no more than **77 tokens**, 
so CLIP is good for short texts.

Let's embed a very short selection of images and their captions in the **shared embedding space** with CLIP.

```python
from fastembed import TextEmbedding, ImageEmbedding

documents = [{"caption": "A photo of a cute pig",
              "image": "images/piggy.jpg"},
 {"caption": "A picture with a coffee cup",
              "image": "images/coffee.jpg"},
 {"caption": "A photo of a colourful lizard",
              "image": "images/lizard.jpg"}
]

text_model_name = "Qdrant/clip-ViT-B-32-text" #CLIP text encoder
text_model = TextEmbedding(model_name=text_model_name)
text_embeddings_size = text_model._get_model_description(text_model_name)["dim"] #dimension of text embeddings, produced by CLIP text encoder (512)
texts_embeded = list(text_model.embed([document["caption"] for document in documents])) #embedding captions with CLIP text encoder

image_model_name = "Qdrant/clip-ViT-B-32-vision" #CLIP image encoder
image_model = ImageEmbedding(model_name=image_model_name)
image_embeddings_size = image_model._get_model_description(image_model_name)["dim"] #dimension of image embeddings, produced by CLIP image encoder (512)
images_embeded = list(image_model.embed([document["image"] for document in documents]))  #embedding images with CLIP image encoder
```

## Upload data to Qdrant

1. **Create a client object for Qdrant**.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333") #or QdrantClient(":memory:") if you're using Google Collab, this option is suitable only for simple prototypes/demos with Python client
```

2. **Create a new collection for your images with captions**.

CLIP’s weights were trained to maximize the scaled **Cosine Similarity** of truly corresponding image/caption pairs,
so that's the **Distance Metric** we will choose for our [Collection](https://qdrant.tech/documentation/concepts/collections/) of [Named Vectors](https://qdrant.tech/documentation/concepts/collections/#collection-with-multiple-vectors).

Using **Named Vectors**, we can easily showcase both Text-to-Image and Image-to-Text (Image-to-Image and Text-to-Text) search.

```python
if not client.collection_exists("text_image"): #creating a Collection
 client.create_collection(
        collection_name ="text_image",
        vectors_config={ #Named Vectors
            "image": models.VectorParams(size=image_embeddings_size, distance=models.Distance.COSINE),
            "text": models.VectorParams(size=text_embeddings_size, distance=models.Distance.COSINE),
 }
 )
```
3. **Upload our images with captions to the Collection**.

Each image with its caption will create a [Point](https://qdrant.tech/documentation/concepts/points/) in Qdrant.

```python
client.upload_points(
    collection_name="text_image",
    points=[
 models.PointStruct(
            id=idx, #unique id of a point, pre-defined by the user
            vector={
                "text": texts_embeded[idx], #embeded caption
                "image": images_embeded[idx] #embeded image
 },
            payload=doc #original image and its caption
 )
        for idx, doc in enumerate(documents)
 ]
)
```

## Search

<h3 style="font-size: 1.25em;">Text-to-Image</h3>

Let's see what image we will get to the query "*What would make me energetic in the morning?*"

```python
from PIL import Image

find_image = text_model.embed(["What would make me energetic in the morning?"]) #query, we embed it, so it also becomes a vector

Image.open(client.search(
    collection_name="text_image", #searching in our collection
    query_vector=("image", list(find_image)[0]), #searching only among image vectors with our textual query
    with_payload=["image"], #user-readable information about search results, we are interested to see which image we will find
    limit=1 #top-1 similar to the query result
)[0].payload['image'])
```
**Response:**

![Coffee Image](/docs/coffee.jpg)

<h3 style="font-size: 1.25em;">Image-to-Text</h3>
Now, let's do a reverse search with an image:


```python
from PIL import Image

Image.open('images/piglet.jpg')
```
![Piglet Image](/docs/piglet.jpg)

Let's see what caption we will get, searching by this piglet image, which, as you can check, is not in our **Collection**.

```python
find_image = image_model.embed(['images/piglet.jpg']) #embedding our image query

client.search(
    collection_name="text_image",
    query_vector=("text", list(find_image)[0]), #now we are searching only among text vectors with our image query
    with_payload=["caption"], #user-readable information about search results, we are interested to see which caption we will get
    limit=1
)[0].payload['caption']
```
**Response:**
```text
'A photo of a cute pig'
```

## Next steps

Use cases of even just Image & Text Multimodal Search are countless: E-Commerce, Media Management, Content Recommendation, Emotion Recognition Systems, Biomedical Image Retrieval, Spoken Sign Language Transcription, etc.

Imagine a scenario: user wants to find a product similar to a picture they have, but they also have specific textual requirements, like "*in beige colour*".
You can search using just texts or images and combine their embeddings in a **late fusion manner** (summing and weighting might work surprisingly well).

Moreover, using [Discovery Search](https://qdrant.tech/articles/discovery-search/) with both modalities, you can provide users with information that is impossible to retrieve unimodally!

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, experiment, and have fun!