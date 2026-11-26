---
title: Quickstart
short_description: "Create a Qdrant Serverless space and run your first hybrid search, with embeddings from Cloud Inference and BM25 keyword ranking."
description: "Qdrant Serverless quickstart: create a space, connect with the Python or Rust client, create a collection with a dense vector and a BM25 text index, ingest a sample menu embedded with Cloud Inference, and run semantic, keyword, and hybrid searches."
weight: 1
---

# Serverless Quickstart

Set up a serverless space and run your first hybrid search in a few minutes. You'll index a short restaurant menu and search it in two ways: by meaning, with dense vectors from the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model, and by keyword, with BM25 ranking over a full-text index. You'll let Qdrant generate vector embeddings using [Cloud Inference](/documentation/cloud/inference/).

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

Install the serverless client.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/install/" >}}

## 3. Connect to Your Space

Using the endpoint URL and API key, connect to your space.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/connect/" >}}

## 4. Create a Collection

Next, create a collection that supports hybrid search. It has a dense vector with 384 dimensions, because that's the dimensionality of the [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model. It also has a [full-text index](/documentation/manage-data/indexing/#full-text-index) on the `description` field with BM25 scoring enabled, which ranks points by the words they contain.

The index uses the `word` tokenizer, which splits text on word boundaries, so a search for `tahini` matches a description containing `tahini,` with a comma. It also ignores common English words, such as "a" and "with", that would otherwise match almost every description.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/create-collection/" >}}

## 5. Ingest Data

You'll work with a small sample dataset of menu items. For each item, send the description as a document, along with the model to embed it with. Qdrant generates the dense vector, and the text index picks up the same description from the payload.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/ingest/" >}}

<aside role="status">New points can take a few seconds to become searchable. If a search in the next steps returns no results, wait a moment and run it again.</aside>

## 6. Semantic Search

Now you're ready to query the data. A dense vector search matches on meaning. Send the query as a document too, and Qdrant embeds it with the same model. Ask for vegetarian dishes and you get the falafel wrap, the caprese salad, and the garden salad, even though not one of the descriptions contains the word "vegetarian".

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/semantic-search/" >}}

## 7. Search by Keyword

A BM25 search matches on the words themselves. Use the [`text` query](/documentation/search/text-search/full-text-search/#query-a-text-field), and set `using` to the indexed payload field you want to query. A search for `tahini` only returns the falafel wrap, because it's the one description containing that word.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/keyword-search/" >}}

## 8. Combine Both

Combine dense vector and BM25 queries using [hybrid search](/documentation/search/text-search/hybrid-search/). This gives you the best of both worlds. "A vegetarian dish with tahini" has a meaning to understand and an exact ingredient to match. The dense search returns plant-based dishes, and the BM25 search matches the keywords.

Run both and fuse the results with [reciprocal rank fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). Each prefetch retrieves its own candidates, and fusion ranks an item higher the better it places in both lists. The falafel wrap wins because it's the only dish that satisfies the meaning and the keyword at once.

{{< code-snippet path="/documentation/headless/snippets/serverless/quickstart/hybrid-search/" >}}

## What's Next

- Secure the space with scoped API keys in [Secure a Space](/documentation/serverless/security/)
- Learn about storage limits and other quotas in [Quotas and Limits](/documentation/serverless/quotas-and-limits/)
- Learn what the platform decides for you in [About Qdrant Serverless](/documentation/serverless/)
- Schedule backups in [Back Up and Restore](/documentation/serverless/backups/)
