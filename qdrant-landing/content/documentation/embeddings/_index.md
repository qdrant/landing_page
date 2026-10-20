---
title: Embeddings
short_description: "Find an embedding provider for Qdrant by input, vector type, and where it runs, from Qdrant Cloud Inference and OpenAI to self-hosted models."
description: "Directory of embedding providers for Qdrant, filterable by input, vector type, and deployment, including Qdrant Cloud Inference and FastEmbed."
weight: 700
partition: ecosystem
cascade:
  - target:
      kind: page
    hideInSidebar: true
---

# Embedding Providers

Qdrant stores and searches vectors from any embedding model. Each provider page covers setup, model dimensions, document and query embedding, and the requirements specific to that provider.

You might not need a separate provider:

- **[Generate embeddings in Qdrant Cloud](/documentation/embeddings/qdrant-cloud-inference/)**: Qdrant Cloud Inference embeds text and images on the server with hosted dense, sparse, and multivector models, some of them free, and routes to OpenAI, Cohere, Jina AI, and OpenRouter.
- **[Generate embeddings locally with FastEmbed](/documentation/fastembed/)**: Run open dense, sparse, and multivector models on your own hardware with Qdrant's lightweight Python library. No API key or GPU required.
- **[Choose an inference approach](/documentation/inference/)**: Compare generating embeddings in your application, in the Qdrant cluster, and on Qdrant Cloud.

## Providers

{{< integration-directory facets="input:Input|vectors:Vectors|runs:Runs On" noun="provider" >}}

## Store and Search the Vectors

Provider pages show only the Qdrant calls that depend on the provider. The rest is the same for every provider:

- [Create a collection](/documentation/manage-data/collections/#create-a-collection) with the model's dimensions and distance metric.
- [Upload points](/documentation/manage-data/points/#upload-points) in batches, with payloads for filtering.
- [Search](/documentation/search/search/#query-api) with the Query API, and [filter](/documentation/search/filtering/) the results.
- [Combine dense and sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Quantize vectors](/documentation/manage-data/quantization/) to reduce memory use.
