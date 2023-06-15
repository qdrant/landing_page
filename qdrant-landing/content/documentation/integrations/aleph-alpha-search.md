---
title: Multimodal Search with Aleph Alpha
weight: 1100
---

# Multimodal Semantic Search with Aleph Alpha 

Semantic search goes well beyond textual data. It is surely a great alternative for the full-text search 
but also allows us to perform a reverse image search and many more. However, in most cases, we were limited 
to using the same data type for both documents and queries (text-text, image-image, audio-audio, etc.). With 
the recent growth of multimodal architectures, it became possible to encode different data types into the same 
latent space — for example, texts and images. That opens up some great possibilities, as we can finally **explore 
non-textual data, for example visual, with text queries**. In the past, it would require labelling every image 
with a description of what it presents. Right now, we can rely on vector embeddings, which can represent all 
the inputs in the same space.

![](/docs/integrations/aleph-alpha/2d_text_image_embeddings.png)

*Two examples of text-image pairs presenting a similar object, encoded by a multimodal network into the same 
2D latent space. Both texts are examples of English [pangrams](https://en.wikipedia.org/wiki/Pangram). 
https://deepai.org generated the images with pangrams used as input prompts.*

## Sample dataset

You will be using [COCO](https://cocodataset.org/), a large-scale object detection, segmentation, and captioning dataset. It provides 
various splits, 330K images in total. For the demonstration purposes we can choose a 
[2017 validation split](http://images.cocodataset.org/zips/train2017.zip) that contains 5K images from different 
categories.

## Prerequisites

There is no need to curate your datasets and train the models. [Aleph Alpha](https://www.aleph-alpha.com/), already has multimodality and multilinguality already built-in. There is an [official Python client](https://github.com/Aleph-Alpha/aleph-alpha-client) that simplifies the integration. [can be integrated seamlessly](https://qdrant.tech/documentation/integrations/#aleph-alpha).

In order to enable the search capabilities, you need to build the search index to query on. For our purposes, 
we are going to vectorize the images and store their embeddings along with the filenames, we can then return the most 
similar files for given query. There are two things we need to set up before we start though:

1. A Qdrant instance has to be running. If you want to launch it locally,
   [Docker is the fastest way to do that](https://qdrant.tech/documentation/quick_start/#installation).
2. You need to have a [Aleph Alpha account registered and confirmed](https://app.aleph-alpha.com/). Once it’s done, 
   the API key has to be created (see: [API Tokens](https://app.aleph-alpha.com/profile)).

Once it’s done we can store the Aleph Alpha API key in a variable and choose the model we’re going to use.

```python
aa_token = "<< your_token >>"
model = "luminous-base"
```

## Vectorize dataset

In this example, images are stored in the `val2017` directory:

```python
from aleph_alpha_client import (
    Prompt,
    AsyncClient,
    SemanticEmbeddingRequest,
    SemanticRepresentation,
    ImagePrompt
)

from glob import glob

ids, vectors, payloads = [], [], []
async with AsyncClient(token=aa_token) as client:
    for i, image_path in enumerate(glob("./val2017/*.jpg")):
        # Convert the JPEG file into the embedding by calling 
        # Aleph Alpha API
        prompt = ImagePrompt.from_file(image_path)
        prompt = Prompt.from_image(prompt)
        query_params = {
            "prompt": prompt,
            "representation": SemanticRepresentation.Symmetric,
            "compress_to_size": 128,
        }
        query_request = SemanticEmbeddingRequest(**query_params)
        query_response = await client.semantic_embed(
            request=query_request, model=model
        )

        # Finally store the id, vector and the payload
        ids.append(i)
        vectors.append(query_response.embedding)
        payloads.append({"filename": image_path})
```

## Load embeddings into Qdrant

Add all created embeddings, along with their ids and payloads into the `COCO` collection.

```python
import qdrant_client
from qdrant_client.http.models import Batch, VectorParams, Distance

qdrant_client = qdrant_client.Qdrant.Client()
qdrant_client.recreate_collection(
    collection_name="COCO"
    vector_params=VectorParams(
        size=len(vectors[0]),
        distance=Distance.COSINE,
    )
)
qdrant_client.upsert(
    collection_name="COCO",
    points=Batch(
        ids=ids,
        vectors=vectors,
        payloads=payloads,
    )
)
```

## Query the database

Since `luminous-base`, a model we selected, can provide us the vectors for both texts and images, we can run both 
text queries and reverse image search. No matter what we choose, the process won’t be much different. Let’s assume 
we want to find images similar to the one below:

![An image used to query the database](/docs/integrations/aleph-alpha/visual_search_query.png)

With the following code snippet we create its vector embedding and then perform the lookup in Qdrant:

```python
async with AsyncCliet(token=aa_token) as client:
    prompt = ImagePrompt.from_file("query.jpg")
    prompt = Prompt.from_image(prompt)

    query_params = {
        "prompt": prompt,
        "representation": SemanticRepresentation.Symmetric,
        "compress_to_size": 128,
    }
    query_request = SemanticEmbeddingRequest(**query_params)
    query_response = await client.semantic_embed(
        request=query_request, model=model
    )

    results = qdrant.search(
        collection_name="COCO",
        query_vector=query_response.embedding,
        limit=3,
    )
    print(results)
```

Here are the results:

![Visual search results](/docs/integrations/aleph-alpha/visual_search_results.png)

The great thing about Aleph Alpha models is, they can provide the embeddings for English, French, German, Italian 
and Spanish. So our search is not only multimodal, but also multilingual, no translations needed!

```python
text= "Surfing"

async with AsyncClient(token=aa_token) as client:
    query_params = {
        "prompt": Prompt.from_text(text),
        "representation": SemanticRepresentation.Symmetric,
        "compres_to_size": 128,
    }
    query_request = SemanticEmbeddingRequest(**query_params)
    query_response = await client.semantic_embed(
        request=query_request, model=model
    )

    results = qdrant.search(
        collection_name="COCO",
        query_vector=query_response.embedding,
        limit=3,
    )
    print(results)
```

Here are the top 3 results for “Surfing”:

![Text search results](/docs/integrations/aleph-alpha/text_search_results.png)

## Demo

In some cases, just a few lines of code might be enough to run a proper multimodal semantic search system. We were 
able to do that, without any need to annotate the data or train our networks. Moreover, we are also able to query 
it using multiple languages, thanks to Aleph Alpha multilinguality. If you are interested in seeing the full source code, 
please check out [the repository](https://github.com/tugot17/Qdrant-Aleph-Alpha-Demo).
