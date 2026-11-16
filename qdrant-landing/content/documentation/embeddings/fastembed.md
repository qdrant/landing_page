---
title: FastEmbed
weight: 20
short_description: "Browse FastEmbed's supported dense, sparse, image, and multivector embedding models, with dimensions, licenses, and links to setup guides."
description: "Choose a FastEmbed embedding model for local inference with Qdrant. Compare supported models, dimensions, and licenses, then follow the setup guides."
directory:
  model_catalog: fastembed
  summary: "Qdrant's Python library for running dense, sparse, image, and multivector embedding models on your own hardware."
  input: [Text, Image]
  vectors: [Dense, Sparse, Multivector]
  runs: [Self-hosted]
  featured: true
---

# FastEmbed

Choose a model for the input and vector type you need. [FastEmbed](/documentation/fastembed/) runs embedding models locally in your Python application, so you can send the resulting vectors to any Qdrant deployment.

{{< fastembed-models type="version" >}}

## Dense Text Models

These models produce one dense vector per text input. Use the listed dimensions when you create a collection.

{{< fastembed-models type="dense" >}}

Follow [Generate Text Embeddings](/documentation/fastembed/fastembed-quickstart/) to load a model, or [Dense Embeddings with Qdrant](/documentation/fastembed/fastembed-semantic-search/) to index and search its vectors.

## Sparse Text Models

These models produce sparse vectors. Configure a [sparse vector field](/documentation/manage-data/vectors/#sparse-vectors) in your collection.

{{< fastembed-models type="sparse" >}}

See the [miniCOIL](/documentation/fastembed/fastembed-minicoil/) and [SPLADE](/documentation/fastembed/fastembed-splade/) guides for indexing and search examples.

## Text Multivector Models

These models produce multiple vectors per text input. Dimensions refer to each vector in the output.

{{< fastembed-models type="multivector" >}}

Follow [ColBERT Multivector Embeddings](/documentation/fastembed/fastembed-colbert/) to configure a collection and search with multivectors.

## Image Models

These models produce one dense vector per image.

{{< fastembed-models type="image" >}}

## Image and Text Multivector Models

These models support image and text inputs and produce multivectors. Dimensions refer to each vector in the output.

{{< fastembed-models type="multimodal" >}}

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Explore the FastEmbed guides](/documentation/fastembed/) for embedding generation and Qdrant integration.
- [Rerank with FastEmbed](/documentation/fastembed/fastembed-rerankers/) to score retrieved results with a cross-encoder.
- [Choose an inference approach](/documentation/inference/) to compare local embedding generation with Qdrant Cloud Inference.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine dense and sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
