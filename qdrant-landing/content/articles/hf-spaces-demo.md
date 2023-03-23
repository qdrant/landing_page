---
title: Faster Web Demos with Qdrant Cloud and HF Spaces
short_description: "Building a web demo for your similarity search models in no time"
description: Learn how to build a public web application for your vector search solution by using Qdrant Cloud and Huggingface Spaces quickly and easily.
social_preview_image: /articles_data/hf-spaces-demo/preview/social_preview.jpg
small_preview_image: /articles_data/hf-spaces-demo/icon.svg
preview_dir: /articles_data/hf-spaces-demo/preview
weight: 10
author: Yusuf Sarıgöz
author_link: https://medium.com/@yusufsarigoz
date: 2023-03-23T13:00:00+03:00
draft: true
keywords:
  - qdrant cloud
  - semantic image search
  - huggingface spaces
  - clip
---

In today's fast-paced world, people are looking for fast and efficient solutions to their problems,
and this is especially true when it comes to
one of the hottest topics in AI, semantic search and retrieval.
This is why it is essential to convert your achievements to public web apps easily.
One way to do this is by using [Qdrant Cloud](https://cloud.qdrant.io/),
the managed version of the open-source vector search engine by the creators of [Qdrant](https://github.com/qdrant/qdrant).
Qdrant Cloud offers a generous free tier with no credit card needed, and you can get up and running in seconds without installing anything.
In this post, we will show you how to easily convert your semantic search solutions to public web apps using Qdrant Cloud and [Huggingface Spaces](https://huggingface.co/spaces).

First, let's understand why Qdrant Cloud is a good choice for your fast-paced development.
Qdrant Cloud is a managed solution,
which means that you don't have to worry about installing anything or your machine
or managing servers or scaling your infrastructure.
It is also built on top of the exact code base of the open-source Qdrant search engine,
which achieves the best performance according to
[public benchmarks](https://qdrant.tech/benchmarks/).
Qdrant also has [integrations](https://qdrant.tech/documentation/integrations/)
with, and support for, various technologies such as
[DocArray](https://qdrant.tech/blog/qdrant_and_jina_integration/),
[Langchain](https://qdrant.tech/articles/langchain-integration/)
and [LlamaIndex](https://gpt-index.readthedocs.io/en/latest/reference/indices/vector_store.html#gpt_index.indices.vector_store.vector_indices.GPTQdrantIndex),
so you have a large collection of options.

To demonstrate how to leverage Qdrant Cloud to present your achievement publically with ease, we will use Huggingface Spaces to host the application.
Huggingface Spaces is a free platform for hosting machine learning models and web applications.
We will encode the [MSCOCO dataset](https://cocodataset.org/)
to embeddings with [CLIP](https://github.com/openai/CLIP)
and store them in a free tier cluster at Qdrant Cloud.
In the HF Spaces app, we will accept a textual query and make a request to Qdrant Cloud for vector search against either image or text embeddings based on the user's choice.

## Let's get started
I provide the CLIP embeddings of the MSCOCO dataset as a downloadable archive,
and we will use it to index in Qdrant Cloud.
As a side note, I will release the Qdrant snapshots of larger datasets that are ready for importing to your Qdrant instance on the following days,
and I will demonstrate how those snapshots can be used
for solving varius problems in different use cases. Stay tuned for the upcoming posts and join [Discord](https://qdrant.to/discord)
if you haven't already.

In the remainder of this post, I will provide
step-by-step instructions on how to host a [Gradio](https://gradio.app/)
app on HF Spaces for semantic image search,
backed by Qdrant Cloud. If you would like to prefer
the source code directly instead, go to the [project repository](https://github.com/qdrant/hf-spaces-demo).
