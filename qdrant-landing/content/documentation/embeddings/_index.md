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

## Generate Embeddings with Qdrant

{{< embedding-options >}}

[Choose an inference approach](/documentation/inference/) to compare generating embeddings in your application, in the Qdrant cluster, and on Qdrant Cloud.

## Explore All Providers

{{< integration-directory facets="input:Input|vectors:Vectors|runs:Runs On" noun="provider" >}}
