---
draft: true
title: Storing multiple vectors per object in Qdrant
slug: storing-multiple-vectors-per-object-in-qdrant
short_description: Qdrant's approach to storing multiple vectors per object,
  unraveling new possibilities in data representation and retrieval.
description: Discover how Qdrant continues to push the boundaries of data
  indexing, providing insights into the practical applications and benefits of
  this novel vector storage strategy.
preview_image: /blog/from_cms/1_ygzei7duqtbnueyfkaqfkw.jpg
date: 2022-10-05T10:05:43.329Z
author: Kacper Łukawski
featured: false
tags:
  - Data Science
  - Neural Networks
  - Database
  - Search
  - Similarity Search
---
In a real case scenario, a single object might be described in several different ways. If you run an e-commerce business, then your items will typically have a name, longer textual description and also a bunch of photos. While cooking, you may care about the list of ingredients, and description of the taste but also the recipe and the way your meal is going to look. Up till now, if you wanted to enable semantic search with multiple vectors per object, Qdrant would require you to create separate collections for each vector type, even though they could share some other attributes in a payload. However, since Qdrant 0.10 you are able to store all those vectors together in the same collection and share a single copy of the payload!

![](/blog/from_cms/1_ygzei7duqtbnueyfkaqfkw.webp "In a real case scenario, a single object might be described in several different ways. If you run an e-commerce business, then your items will typically have a name, longer textual description and also a bunch of photos. While cooking, you may care about the list of ingredients, and description of the taste but also the recipe and the way your meal is going to look. Up till now, if you wanted to enable semantic search with multiple vectors per object, Qdrant would require you to create separate collections for each vector type, even though they could share some other attributes in a payload. However, since Qdrant 0.10 you are able to store all those vectors together in the same collection and share a single copy of the payload!")

Running the new version of Qdrant is as simple as it always was. By running the following command, you are able to set up a single instance that will also expose the HTTP API:

> docker run -p 6333:6333 qdrant/qdrant:v0.10.1

# Creating a collection

Adding new functionalities typically requires making some changes to the interfaces, so no surprise we had to do it to enable the multiple vectors support. Currently, if you want to create a collection, you need to define the configuration of all the vectors you want to store for each object. Each vector type has its own name and the distance function used to measure how far the points are.

<script src="https://gist.github.com/kacperlukawski/9d6c8330b7d4dd1cb1d7e07ba30181c5.js"></script>\

In case you want to keep a single vector per collection, you can still do it without putting a name though.

<script src="https://gist.github.com/kacperlukawski/2ba05929f41649cbb9c7bdea1b0ea8db.js"></script>

All the search-related operations have slightly changed their interfaces as well, so you can choose which vector to use in a specific request. However, it might be easier to see all the changes by following an end-to-end Qdrant usage on a real-world example.

# Building service with multiple embeddings

Quite a common approach to building search engines is to combine semantic textual capabilities with image search as well. For that purpose, we need a dataset containing both images and their textual descriptions. There are several datasets available with [MS_COCO_2017_URL_TEXT](https://huggingface.co/datasets/ChristophSchuhmann/MS_COCO_2017_URL_TEXT) being probably the simplest available. And because it’s available on HuggingFace, we can easily use it with their [datasets](https://huggingface.co/docs/datasets/index) library.

<script src="https://gist.github.com/kacperlukawski/c85cfb009cbfdca5b3f0a6321e3f823d.js"></script>

Right now, we have a dataset with a structure containing the image URL and its textual description in English. For simplicity, we can convert it to the DataFrame, as this structure might be quite convenient for future processing.

<script src="https://gist.github.com/kacperlukawski/b0c360e071ebd40dce242b1001430260.js"></script>

The dataset consists of two columns: *TEXT* and *URL*. Thus, each data sample is described by two separate pieces of information and each of them has to be encoded with a different model.

# Processing the data with pretrained models

Thanks to [embetter](https://github.com/koaning/embetter), we can reuse some existing pretrained models and use a convenient scikit-learn API, including pipelines. This library also provides some utilities to load the images, but only supports the local filesystem, so we need to create our own class that will download the file, given its URL.

<script src="https://gist.github.com/kacperlukawski/632f8c481eb651d8eb8004caa02b9edf.js"></script>

Now we’re ready to define the pipelines to process our images and texts using *all-MiniLM-L6-v2* and *vit_base_patch16_224* models respectively. First of all, let’s start with Qdrant configuration.

# Creating Qdrant collection

We’re going to put two vectors per object (one for image and another one for text), so we need to create a collection with a configuration allowing us to do so.

<script src="https://gist.github.com/kacperlukawski/3ade04b61364f13340216120f0f87651.js"></script>

# Defining the pipelines

And since we have all the puzzles already in place, we can start the processing to convert raw data into the embeddings we need. The pretrained models come in handy.

<script src="https://gist.github.com/kacperlukawski/7db2135b24ab8abebe06519b55e072d1.js"></script>

Thanks to the scikit-learn API, we can simply call each pipeline on the created DataFrame and put created vectors into Qdrant to enable fast vector search. For convenience, we’re going to put the vectors as other columns in our DataFrame.

<script src="https://gist.github.com/kacperlukawski/ccb153456881ccbbfd0b885be9a716eb.js"></script>

The created vectors might be easily put into Qdrant. For the sake of simplicity, we’re going to skip it, but if you are interested in details, please check out the [Jupyter notebook](https://gist.github.com/kacperlukawski/961aaa7946f55110abfcd37fbe869b8f) going step by step.

# Searching with multiple vectors

If you decided to describe each object with several neural embeddings, then at each search operation you need to provide the vector name along with the embedding, so the engine knows which one to use. The interface of the search operation is pretty straightforward and requires an instance of NamedVector.

<script src="https://gist.github.com/kacperlukawski/71a3f270cc42c0d3cf56c6b3ba2a0528.js"></script>

If we, on the other hand, decided to search using the image embedding, then we just provide the vector name we have chosen while creating the collection, so instead of “text”, we would provide “image”, as this is how we configured it at the very beginning.

# The results: image vs text search

Since we have two different vectors describing each object, we can perform the search query using any of those. That shouldn’t be surprising then, that the results are different depending on the chosen embedding method. The images below present the results returned by Qdrant for the image/text on the left-hand side.

## Image search

If we query the system using image embedding, then it returns the following results:

![](/blog/from_cms/0_5nqlmjznjkvdrjhj.webp "Image search results")

## Text search

However, if we use textual description embedding, then the results are slightly different:

![](/blog/from_cms/0_3sdgctswb99xtexl.webp "Text search However, if we use textual description embedding, then the results are slightly different:")

It is not surprising that a method used for creating neural encoding plays an important role in the search process and its quality. If your data points might be described using several vectors, then the latest release of Qdrant gives you an opportunity to store them together and reuse the payloads, instead of creating several collections and querying them separately.

If you’d like to check out some other examples, please check out our [full notebook](https://gist.github.com/kacperlukawski/961aaa7946f55110abfcd37fbe869b8f) presenting the search results and the whole pipeline implementation.