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

## Step 1: Setting up

Before starting, make sure that you signed up at Qdrant Cloud,
created a cluster and obtained the host URL and API key.
We will use them for accessing our instance, so let's set them as environment variables.
Do not include the protocol prefix `https://` in the host value, e.g., `{cluster_id}.us-east-1-0.aws.cloud.qdrant.io`.

```shell
export QDRANT_API_KEY=<YOUR_API_KEY>

export QDRANT_HOST_URL=<YOUR_HOST_URL>
```


Clone the repository to your development machine and install the dependencies.
Please note that indexing embeddings and web app have different sets of dependencies,
so I suggest holding dependencies in two different requirements files.

```shell
git clone https://github.com/qdrant/hf-spaces-demo.git

cd hf-spaces-demo

pip install -r requirements-indexing.txt
```

Sign up at Huggingface and create a [new space](https://huggingface.co/new-space).
Take the URL of the space repository, and set it as a new remote:

```shell
git remote add hf <YOUR_SPACE_URL>
```

## Step 2: Indexing embeddings

We are ready for indexing embeddings in our instance at Qdrant Cloud. It's a single command after downloading the embeddings file:

```shell
wget https://storage.googleapis.com/qdrant-datasets-index/mscoco_embeddings.zip

unzip mscoco_embeddings.zip

python create_index.py --embeddings_folder ./mscoco_embeddings
```

We are almost there! Let's create our HF Spaces app.

## Step 3: Creating app

Before pushing our code to Huggingface Spaces repository, we need to set credentials as secrets in the space settings.
Think of secrets like environment variables for the space app,
and in fact, they are accessible inside the app exactly as environment variables without exposing them publically.

Go to the repository you created in step 1, click `Settings`, and click `New Secret`.
Enter `QDRANT_API_KEY` and `QDRANT_HOST_URL` as secret names and respected values in the form.

Now we are ready for deploying the app.
HF Spaces deploys from the branch named `main` so we will first checkout that branch. Ten, we will push to the remote named `hf`,
which we added in step 1, instead of `origin`.

```shell
git checkout main

git push hf main
```

Go to your HF Spaces repository,
and you'll see that your app is building.
Once it's finished in a few seconds,
you can enjoy your semantic image search app and share it with everyone on the internet.
