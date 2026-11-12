---
title: Qdrant Cloud Inference
weight: 10
short_description: "Generate dense, sparse, multivector, and image embeddings in Qdrant Cloud, or route to OpenAI, Cohere, Jina AI, and OpenRouter."
description: "Use Qdrant Cloud Inference to embed text and images server-side: hosted dense, sparse, and multivector models, plus OpenAI, Cohere, Jina AI, and OpenRouter."
directory:
  model_catalog: cloud-inference
  summary: "Embedding models hosted by Qdrant Cloud, plus external providers, called through the Qdrant API with no embedding service to run."
  input: [Text, Image]
  vectors: [Dense, Sparse, Multivector]
  runs: [Qdrant Cloud Inference]
  featured: true
---

# Qdrant Cloud Inference

Clusters on [Qdrant Cloud](/documentation/cloud/) can generate embeddings on the server. Instead of a vector, you send the text or image together with a model name, and Qdrant embeds it before storing or searching. You don't run a separate embedding service. Two kinds of models are available:

- **Models hosted by Qdrant Cloud**, listed in the Models tables. They need no extra API key, and the free ones also work on free-tier clusters.
- **Models from external providers**: OpenAI, Cohere, Jina AI, and any embedding model on OpenRouter, billed by the provider through your own API key. See [External Providers](#external-providers).

## Models

Dense models:

{{< cloud-inference-models type="dense" >}}

`qdrant/clip-vit-b-32-text` and `qdrant/clip-vit-b-32-vision` share a vector space, so you can embed images with the vision model and search them with text.

Sparse models:

{{< cloud-inference-models type="sparse" >}}

Multivector models:

{{< cloud-inference-models type="multivector" >}}

For pricing, context windows, and usage, see the cluster's Inference tab in the Qdrant Cloud Console and [Billing for Qdrant-Hosted Models](/documentation/cloud/inference/#billing-for-qdrant-hosted-models).

## Setup

If inference isn't enabled on your cluster yet, see [Enabling/Disabling Inference](/documentation/cloud/inference/#enablingdisabling-inference).

Create the client with your cluster URL and API key. In Python, set `cloud_inference=True`; without it, the Python client embeds locally with [FastEmbed](/documentation/fastembed/). [Create a collection](/documentation/manage-data/collections/#create-a-collection) with the vector size of the model you pick, for example 384 for `sentence-transformers/all-minilm-l6-v2`. If the size doesn't match the model's dimensions, the upsert fails.

## Embed Documents and Queries

Where a vector would go, pass a `Document` with the text and the model name, both when you upsert points and when you query. Replace `<the-model-to-use>` with a model from the Models tables:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

For models that expect query and document prefixes, Qdrant adds them for you. See [Automatic Query and Passage Prefixes](/documentation/inference/cloud-inference/#automatic-query-and-passage-prefixes).

## Embed Images

Pass an `Image` with an image URL or base64 data and the vision model. This example stores an image and searches it with text:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/image/" >}}

## Sparse and Multivector Models

Sparse and multivector models work the same way, with a `Document` in a sparse or multivector field of the collection. The `qdrant/bm25` model runs inside the cluster itself. See [BM25](/documentation/inference/inference-bm25/), and combine sparse and dense results with [Hybrid Queries](/documentation/search/hybrid-queries/).

## External Providers

Prefix the model name with the provider, and pass your provider API key in a request header or in the `options` object. Qdrant does not store the key.

| Provider | Model Prefix | Key Header | Example |
|---|---|---|---|
| OpenAI | `openai/` | `openai-api-key` | [OpenAI](/documentation/embeddings/openai/#qdrant-cloud-inference) |
| Cohere | `cohere/` | `cohere-api-key` | [Cohere](/documentation/embeddings/cohere/#qdrant-cloud-inference) |
| Jina AI | `jinaai/` | `jina-api-key` | [Jina AI](/documentation/embeddings/jina-embeddings/#qdrant-cloud-inference) |
| OpenRouter | `openrouter/` | `openrouter-api-key` | [Mistral](/documentation/embeddings/mistral/#qdrant-cloud-inference) |

See [External Providers](/documentation/inference/external-inference-providers/) for every option.

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Inference in Qdrant Managed Cloud](/documentation/cloud/inference/): enabling inference on a cluster, inference regions, and billing.
- [Inference API](/documentation/inference/inference-api/): the `Document`, `Image`, and `Object` inference objects.
- [Matryoshka Models](/documentation/inference/matryoshka-models/): store several vector sizes from one inference request.
- [Choose an inference approach](/documentation/inference/): compare Cloud Inference with embedding in your application.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine dense and sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
