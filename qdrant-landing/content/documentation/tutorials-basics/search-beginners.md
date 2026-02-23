---
title: Semantic Search 101
weight: 4
aliases:
  - /documentation/tutorials/mighty.md/
  - /documentation/tutorials/search-beginners/
  - /documentation/beginner-tutorials/search-beginners/
---

# Build a Semantic Search Engine in 5 Minutes

| Time: 5 - 15 min | Level: Beginner |  | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/semantic-search-in-5-minutes/semantic_search_in_5_minutes.ipynb)   |
| --- | ----------- | ----------- |----------- |

> There are two versions of this tutorial:
>
> - The version on this page uses Qdrant Cloud. You'll deploy a cluster and generate vector embedding in the cloud using Qdrant Cloud's **forever free** tier (no credit card required). 
> - Alternatively, you can run Qdrant on your own machine. This requires you to manage your own cluster and vector embedding infrastructure. If you prefer this option, check out the [local deployment version of this tutorial](/documentation/tutorials-basics/search-beginners-local/).

## Overview

If you are new to vector search engines, this tutorial is for you. In 5 minutes you will build a semantic search engine for science fiction books. After you set it up, you will ask the engine about an impending alien threat. Your creation will recommend books as preparation for a potential space attack.

If you are using Python, you can use [this Google Colab notebook](https://githubtocolab.com/qdrant/examples/blob/master/semantic-search-in-5-minutes/semantic_search_in_5_minutes.ipynb).

## 1. Create a Qdrant Cluster

If you do not already have a Qdrant cluster, follow these steps to create one:

1. Register for a [Qdrant Cloud account](https://cloud.qdrant.io) using your email, Google, or Github credentials.
1. Under **Create a Free Cluster**, enter a cluster name and select your preferred cloud provider and region.
1. Click **Create Free Cluster**.
1. Copy the **API key** when prompted and store it somewhere safe as it won’t be displayed again.
1. Copy the **Cluster Endpoint**. It should look something like `https://xxx.cloud.qdrant.io`.


## 2. Set up a Client Connection

First, install the Qdrant Client for your preferred programming language:

{{< code-snippet path="/documentation/headless/snippets/install-client/" >}}

This library allows you to interact with Qdrant from code.

Next, create a client connection to your Qdrant cluster using the endpoint and API key.

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="client-connection" >}}

Replace `QDRANT_URL` and `QDRANT_API_KEY` with the cluster endpoint and API key you obtained in the previous step. The `cloud_inference=True` parameter enables Qdrant Cloud's [inference](/documentation/concepts/inference/) capabilities, allowing the cluster to generate vector embeddings without the need to manage your own embedding infrastructure. 

## 3. Create a Collection

All data in Qdrant is organized within [collections](/documentation/concepts/collections/). Since you're storing books, let's create a collection named `my_books`.

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="create-collection" >}}

- The `size` parameter defines the dimensionality of the vectors for the collection. 384 corresponds to the output dimensionality of the embedding model used in this tutorial.
- The `distance` parameter specifies the function used to measure the distance between two points.

## 4. Upload Data to the Cluster

The dataset consists of a list of science fiction books. Each entry has a name, author, publication year, and short description. 

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="upload-data" >}}

Store each book as a [point](/documentation/concepts/points/) in the `my_books` collection, with each point consisting of a [unique ID](/documentation/concepts/points/#point-ids), a [vector](/documentation/concepts/vectors/) generated from the description, and a [payload](/documentation/concepts/payload/) containing the book's metadata:

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="upload-points" >}}

This code tells Qdrant Cloud to use the `sentence-transformers/all-minilm-l6-v2` embedding model to generate vector embeddings from the book descriptions. This is one of the free models available on Qdrant Cloud. For a list of the available free and paid models, refer to the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

## 5. Query the Engine

Now that the data is stored in Qdrant, you can query it and receive semantically relevant results.

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="query-engine" >}}

This query uses the same embedding model to generate a vector for the query "alien invasion". The search engine then looks for the three most similar vectors in the collection and returns their payloads and similarity scores.

**Response:**

The search engine returns the three most relevant books related to an alien invasion. Each is assigned a score indicating its similarity to the query:

```text
{'name': 'The War of the Worlds', 'description': 'A Martian invasion of Earth throws humanity into chaos.', 'author': 'H.G. Wells', 'year': 1898} score: 0.570093257022374
{'name': "The Hitchhiker's Guide to the Galaxy", 'description': 'A comedic science fiction series following the misadventures of an unwitting human and his alien friend.', 'author': 'Douglas Adams', 'year': 1979} score: 0.5040468703143637
{'name': 'The Three-Body Problem', 'description': 'Humans encounter an alien civilization that lives in a dying system.', 'author': 'Liu Cixin', 'year': 2008} score: 0.45902943411768216
```

### Narrow down the Query

How about the most recent book from the early 2000s? Qdrant allows you to narrow down query results by applying a [filter](/documentation/concepts/filtering/). To filter for books published after the year 2000, you can filter on the `year` field in the payload.

Before filtering on a payload field, create a [payload index](/documentation/concepts/indexing/#payload-index) for that field:

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="create-payload-index" >}}

In a production environment, create payload indexes before uploading data to get the maximum benefit from indexing.

Now you can apply a filter to the query:

{{< code-snippet path="/documentation/headless/snippets/tutorial-semantic-search-101/" block="query-with-filter" >}}

**Response:**

The results have been narrowed down to one result from 2008:

```text
{'name': 'The Three-Body Problem', 'description': 'Humans encounter an alien civilization that lives in a dying system.', 'author': 'Liu Cixin', 'year': 2008} score: 0.45902943411768216
```

## Next Steps

Congratulations, you have just created your very first search engine! Trust us, the rest of Qdrant is not that complicated, either. For your next tutorial, try [building your own hybrid search service](/documentation/tutorials-search-engineering/hybrid-search-fastembed/) or take the free [Qdrant Essentials course](/course/essentials/).
