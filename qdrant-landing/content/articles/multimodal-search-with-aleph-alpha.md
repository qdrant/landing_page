---
title: Exploring visual data with textual queries\: a multimodal semantic search with Aleph Alpha and Qdrant
short_description: "Using multimodal and multilingual embeddings to explore images with text queries"
description: "End-to-end multimodal search system on the COCO dataset with Aleph Alpha and Qdrant"
social_preview_image: /articles_data/multimodal-search-with-aleph-alpha/social_preview.png
small_preview_image: /articles_data/multimodal-search-with-aleph-alpha/search-vr-glasses.svg
preview_dir: /articles_data/multimodal-search-with-aleph-alpha/preview
weight: 5
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-01-24T12:45:00+01:00
draft: false
keywords:
  - vector search
  - visual search
  - aleph alpha
  - multimodal
  - multilingual
  - embeddings
  - COCO
---

The semantic search goes well beyond textual data. It is surely a great alternative for the full-text search 
but also allows us to perform a reverse image search and many more. However, in most cases, we were limited 
to using the same data type for both documents and queries (text-text, image-image, audio-audio, etc.). With 
the recent growth of multimodal architectures, it became possible to encode different data types into the same 
latent space — for example, texts and images. That opens up some great possibilities, as we can finally **explore 
non-textual data, for example visual, with text queries**. In the past, it would require labelling every image 
with a description of what it presents. Right now, we can rely on vector embeddings, which can represent all 
the inputs in the same space.

![](/articles_data/multimodal-search-with-aleph-alpha/2d_text_image_embeddings.png)

*Two examples of text-image pairs presenting a similar object, encoded by a multimodal network into the same 
2D latent space. Both texts are examples of English [pangrams](https://en.wikipedia.org/wiki/Pangram). 
https://deepai.org generated the images with pangrams used as input prompts.*

## How to embrace multimodal semantic search?

There are a few components required to make things work. Indeed, a proper vector database like 
[Qdrant](https://qdrant.tech) is essential to keep a great performance, but we need vectors too. There is, 
however, no need to curate your datasets and train the models. Some SaaS tools, such as 
[Aleph Alpha](https://www.aleph-alpha.com/), have multimodality and multilinguality already built-in. There is an 
[official Python client](https://github.com/Aleph-Alpha/aleph-alpha-client) that simplifies the integration. And 
we are going to use it, as both tools [can be integrated seamlessly](https://qdrant.tech/documentation/integrations/#aleph-alpha).

### The dataset

[COCO](https://cocodataset.org/) is a large-scale object detection, segmentation, and captioning dataset. It provides 
various splits, 330K images in total. For the demonstration purposes we can choose a 
[2017 validation split](http://images.cocodataset.org/zips/train2017.zip) that contains 5K images from different 
categories.

![Some examples from the COCO dataset. Images represent various items, including people](/articles_data/multimodal-search-with-aleph-alpha/coco_preview.png)

### Building the search index

As usual, in order to enable the search capabilities, we need to build the search index to query on. For our purposes, 
we are going to vectorize the images and store their embeddings along with the filenames, we can then return the most 
similar files for given query. There are two things we need to set up before we start though:

1. A Qdrant instance has to be running. If you want to launch it locally,
   [Docker is the fastest way to do that](https://qdrant.tech/documentation/quick_start/#installation).
2. You need to have a [Aleph Alpha account registered and confirmed](https://app.aleph-alpha.com/). Once it’s done, 
   the API key has to be created (see: [API Tokens](https://app.aleph-alpha.com/profile)).

Once it’s done we can store the Aleph Alpha API key in a variable and choose the model we’re going to use.

![Both variables will store the Aleph Alpha confguration](/articles_data/multimodal-search-with-aleph-alpha/aleph_alpha_config.png)

The next thing is to vectorize all the images from the dataset. Assuming we store them in the `val2017` directory, 
it may be done like this:

![Aleph Alpha API allows getting the embedding for texts and images through their API](/articles_data/multimodal-search-with-aleph-alpha/aleph_alpha_code.png)

And the last missing step is to put all the embeddings, with their ids and payloads into Qdrant collection.

![Storing the embeddings in a newly created collection “COCO”](/articles_data/multimodal-search-with-aleph-alpha/qdrant_config_code.png)

### How can we query the database?

Since `luminous-base`, a model we selected, can provide us the vectors for both texts and images, we can run both 
text queries and reverse image search. No matter what we choose, the process won’t be much different. Let’s assume 
we want to find images similar to the one below:

![An image used to query the database](/articles_data/multimodal-search-with-aleph-alpha/visual_search_query.png)

With the following code snippet we create its vector embedding and then perform the lookup in Qdrant:

![Performing a reverse image lookup using Aleph Alpha SDK and Qdrant client](/articles_data/multimodal-search-with-aleph-alpha/visual_search_code.png)

Here are the results:

![Visual search results](/articles_data/multimodal-search-with-aleph-alpha/visual_search_results.png)

The great thing about Aleph Alpha models is, they can provide the embeddings for English, French, German, Italian 
and Spanish. So our search is not only multimodal, but also multilingual, no translations needed!

![A code snippet showing how to create the embedding for a text and use it to query Qdrant.](/articles_data/multimodal-search-with-aleph-alpha/text_search_code.png)

Here are the top 3 results for “Surfing”:

![Text search results](/articles_data/multimodal-search-with-aleph-alpha/text_search_results.png)

## A wrap up

In some cases, just a few lines of code might be enough to run a proper multimodal semantic search system. We were 
able to do that, without any need to annotate the data or train our networks. Moreover, we are also able to query 
it using multiple languages, thanks to Aleph Alpha multilinguality. If you are interested in seeing the full source code, 
please check out [the repository](https://github.com/tugot17/Qdrant-Aleph-Alpha-Demo).
