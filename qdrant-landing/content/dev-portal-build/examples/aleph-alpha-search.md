---
title: Aleph Alpha Search
weight: 16
draft: true
---

# Multimodal Semantic Search with Aleph Alpha

| Time: 30 min | Level: Beginner |  |    |
| --- | ----------- | ----------- |----------- |

This tutorial shows you how to run a proper multimodal semantic search system with a few lines of code, without the need to annotate the data or train your networks. 

In most cases, semantic search is limited to homogenous data types for both documents and queries (text-text, image-image, audio-audio, etc.). With the recent growth of multimodal architectures, it is now possible to encode different data types into the same latent space. That opens up some great possibilities, as you can finally explore non-textual data, for example visual, with text queries. 

In the past, this would require labelling every image with a description of what it presents. Right now, you can rely on vector embeddings, which can represent all 
the inputs in the same space.

*Figure 1: Two examples of text-image pairs presenting a similar object, encoded by a multimodal network into the same 
2D latent space. Both texts are examples of English [pangrams](https://en.wikipedia.org/wiki/Pangram). 
https://deepai.org generated the images with pangrams used as input prompts.*

![](/docs/integrations/aleph-alpha/2d_text_image_embeddings.png)


## Sample dataset

You will be using [COCO](https://cocodataset.org/), a large-scale object detection, segmentation, and captioning dataset. It provides 
various splits, 330,000 images in total. For demonstration purposes, this tutorials uses the 
[2017 validation split](http://images.cocodataset.org/zips/train2017.zip) that contains 5000 images from different 
categories with total size about 19GB.
```terminal 
wget http://images.cocodataset.org/zips/train2017.zip
```

## Prerequisites

There is no need to curate your datasets and train the models. [Aleph Alpha](https://www.aleph-alpha.com/), already has multimodality and multilinguality already built-in. There is an [official Python client](https://github.com/Aleph-Alpha/aleph-alpha-client) that simplifies the integration.

In order to enable the search capabilities, you need to build the search index to query on. For this example, 
you are going to vectorize the images and store their embeddings along with the filenames. You can then return the most 
similar files for given query. 

There are two things you need to set up before you start:

1. You need to have a Qdrant instance running. If you want to launch it locally,
   [Docker is the fastest way to do that](/documentation/quick_start/#installation).
2. You need to have a registered [Aleph Alpha account](https://app.aleph-alpha.com/). 
3. Upon registration, create an API key (see: [API Tokens](https://app.aleph-alpha.com/profile)).

Now you can store the Aleph Alpha API key in a variable and choose the model your are going to use.

```python
aa_token = "<< your_token >>"
model = "luminous-base"
```

## Vectorize the dataset

In this example, images have been extracted and are stored in the `val2017` directory:

```python
from aleph_alpha_client import (
    Prompt,
    AsyncClient,
    SemanticEmbeddingRequest,
    SemanticRepresentation,
    Image,
)

from glob import glob

ids, vectors, payloads = [], [], []
async with AsyncClient(token=aa_token) as aa_client:
    for i, image_path in enumerate(glob("./val2017/*.jpg")):
        # Convert the JPEG file into the embedding by calling
        # Aleph Alpha API
        prompt = Image.from_file(image_path)
        prompt = Prompt.from_image(prompt)
        query_params = {
            "prompt": prompt,
            "representation": SemanticRepresentation.Symmetric,
            "compress_to_size": 128,
        }
        query_request = SemanticEmbeddingRequest(**query_params)
        query_response = await aa_client.semantic_embed(request=query_request, model=model)

        # Finally store the id, vector and the payload
        ids.append(i)
        vectors.append(query_response.embedding)
        payloads.append({"filename": image_path})
```

## Load embeddings into Qdrant

Add all created embeddings, along with their ids and payloads into the `COCO` collection.

```python
import qdrant_client
from qdrant_client.models import Batch, VectorParams, Distance

client = qdrant_client.QdrantClient()
client.create_collection(
    collection_name="COCO",
    vectors_config=VectorParams(
        size=len(vectors[0]),
        distance=Distance.COSINE,
    ),
)
client.upsert(
    collection_name="COCO",
    points=Batch(
        ids=ids,
        vectors=vectors,
        payloads=payloads,
    ),
)
```

## Query the database

The `luminous-base`, model can provide you the vectors for both texts and images, which means you can run both 
text queries and reverse image search. Assume you want to find images similar to the one below:

![An image used to query the database](/docs/integrations/aleph-alpha/visual_search_query.png)

With the following code snippet create its vector embedding and then perform the lookup in Qdrant:

```python
async with AsyncCliet(token=aa_token) as aa_client:
    prompt = ImagePrompt.from_file("query.jpg")
    prompt = Prompt.from_image(prompt)

    query_params = {
        "prompt": prompt,
        "representation": SemanticRepresentation.Symmetric,
        "compress_to_size": 128,
    }
    query_request = SemanticEmbeddingRequest(**query_params)
    query_response = await aa_client.semantic_embed(request=query_request, model=model)

    results = client.query_points(
        collection_name="COCO",
        query=query_response.embedding,
        limit=3,
    ).points
    print(results)
```

Here are the results:

![Visual search results](/docs/integrations/aleph-alpha/visual_search_results.png)

**Note:** AlephAlpha models can provide embeddings for English, French, German, Italian 
and Spanish. Your search is not only multimodal, but also multilingual, without any need for translations.

```python
text = "Surfing"

async with AsyncClient(token=aa_token) as aa_client:
    query_params = {
        "prompt": Prompt.from_text(text),
        "representation": SemanticRepresentation.Symmetric,
        "compres_to_size": 128,
    }
    query_request = SemanticEmbeddingRequest(**query_params)
    query_response = await aa_client.semantic_embed(request=query_request, model=model)

    results = client.query_points(
        collection_name="COCO",
        query=query_response.embedding,
        limit=3,
    ).points
    print(results)
```

Here are the top 3 results for “Surfing”:

![Text search results](/docs/integrations/aleph-alpha/text_search_results.png)
