---
title: Quickstart
short_description: "Create a Qdrant Serverless space and run your first hybrid search, with embeddings computed locally by FastEmbed."
description: "Qdrant Serverless quickstart: create a space, connect with the Python client, create a hybrid collection, ingest a sample menu embedded with FastEmbed, and run semantic, keyword, and hybrid searches."
weight: 1
---

# Serverless Quickstart

<aside role="status">Serverless spaces don't support <a href="/documentation/cloud/inference/">Cloud Inference</a> yet, so this quickstart computes embeddings with <a href="https://github.com/qdrant/fastembed">FastEmbed</a> on your own machine.</aside>

Set up a serverless space and run your first hybrid search in a few minutes. You'll index a short restaurant menu using two models at once: [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) for dense vector embeddings and [`Qdrant/bm25`](https://huggingface.co/Qdrant/bm25) for sparse ones. You'll use FastEmbed to generate embeddings locally.

➡️ [Run this quickstart as a Notebook](https://colab.research.google.com/drive/1aBQZjes7NwDnhKbPBVisY-2o291BtOwj?usp=sharing)

## 1. Create a Space

1. In the Qdrant Cloud console, select **Serverless Spaces** in the sidebar.
2. Select **Create Space**.
3. Enter a name, or keep the generated one.
4. Choose a region.
5. Select **Create Space**.
6. Copy the **API Key** that was created for you.
7. Close the popup. On the **Overview** tab, copy the **endpoint URL**.

Store both somewhere safe. You need them in step 3, and the key is a credential like any other. For the full set of options when creating a space, see [Manage Spaces](/documentation/serverless/spaces/).

## 2. Install the Client

Install the serverless client along with FastEmbed, which provides the embedding models.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/install/" >}}

## 3. Connect to Your Space

Using the endpoint URL and API key, connect to your space.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/connect/" >}}

## 4. Create a Collection

Next, create a collection that supports hybrid search. The collection will support dense vectors with 384 dimensions because that's the dimensionality of the [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model. The collection will also support sparse vectors with the IDF modifier, which BM25 needs in order to weight rare terms more heavily than common ones.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/create-collection/" >}}

## 5. Load the Models

Load both models and wrap them in two helpers that return the vector types Qdrant expects. FastEmbed downloads the model files the first time you run this, which takes a moment.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/load-models/" >}}

Pass `query=True` when you're embedding a search query rather than a document. BM25 treats the two differently: document vectors carry term frequencies, while query vectors don't.

## 6. Ingest Data

You'll work with a small sample dataset of menu items. Embed every description, then send the vectors and the payload together.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/ingest/" >}}

<aside role="status">New points can take a few seconds to become searchable. If a search in the next steps returns no results, wait a moment and run it again.</aside>

## 7. Semantic Search

Now you're ready to query the data. A dense search matches on meaning. Ask for vegetarian dishes and you get the falafel wrap, the caprese salad, and the garden salad, even though not one of the descriptions contains the word "vegetarian".

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/semantic-search/" >}}

## 8. Search by Keyword

A sparse search matches on the words themselves. Search for `tahini` and only the falafel wrap comes back, because it's the one description containing that token. A dense model would also return other Middle Eastern dishes. BM25 won't.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/keyword-search/" >}}

## 9. Combine Both

Combine dense and sparse queries using hybrid search. This gives you the best of both worlds. "A vegetarian dish with tahini" has a meaning to understand and an exact ingredient to match. The dense one returns every plant-based dish, the sparse one matches the keywords.

Run both and fuse the results with [reciprocal rank fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). Each prefetch retrieves its own candidates, and fusion ranks an item higher the better it places in both lists. The falafel wrap wins because it's the only dish that satisfies the meaning and the keyword at once.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/hybrid-search/" >}}

## What's Next

- Secure the space with scoped API keys in [Secure a Space](/documentation/serverless/security/)
- Learn about storage limits and other quotas in [Quotas and Limits](/documentation/serverless/quotas-and-limits/)
- Learn what the platform decides for you in [About Qdrant Serverless](/documentation/serverless/)
- Schedule backups in [Back Up and Restore](/documentation/serverless/backups/)
