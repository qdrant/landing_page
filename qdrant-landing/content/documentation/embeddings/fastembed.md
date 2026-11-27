---
title: FastEmbed
weight: 20
short_description: "Browse FastEmbed's supported dense, sparse, image, multivector, and reranker models, with dimensions, licenses, and links to setup guides."
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

{{% fastembed-models type="version" %}}

## Dense Text Models

These models produce one dense vector per text input. Load them with the `TextEmbedding` class, and use the listed dimensions when you create a collection.

{{% fastembed-models type="TextEmbedding" %}}

Follow [Generate Text Embeddings](/documentation/fastembed/fastembed-quickstart/) to load a model, or [Dense Embeddings with Qdrant](/documentation/fastembed/fastembed-semantic-search/) to index and search its vectors.

## Sparse Text Models

These models produce sparse vectors. Load them with the `SparseTextEmbedding` class, and configure a [sparse vector field](/documentation/manage-data/vectors/#sparse-vectors) in your collection.

{{% fastembed-models type="SparseTextEmbedding" %}}

See the [miniCOIL](/documentation/fastembed/fastembed-minicoil/) and [SPLADE](/documentation/fastembed/fastembed-splade/) guides for indexing and search examples.

## Text Multivector Models

These models produce multiple vectors per text input. Load them with the `LateInteractionTextEmbedding` class. Dimensions refer to each vector in the output.

{{% fastembed-models type="LateInteractionTextEmbedding" %}}

Follow [ColBERT Multivector Embeddings](/documentation/fastembed/fastembed-colbert/) to configure a collection and search with multivectors.

## Image Models

These models produce one dense vector per image. Load them with the `ImageEmbedding` class.

{{% fastembed-models type="ImageEmbedding" %}}

## Image and Text Multivector Models

These models support image and text inputs and produce multivectors. Load them with the `LateInteractionMultimodalEmbedding` class. Dimensions refer to each vector in the output.

{{% fastembed-models type="LateInteractionMultimodalEmbedding" %}}

## Reranker Models

These cross-encoder models score a query against each retrieved document, so you can reorder search results. Load them with the `TextCrossEncoder` class.

{{% fastembed-models type="TextCrossEncoder" %}}

Follow [Rerank with FastEmbed](/documentation/fastembed/fastembed-rerankers/) to rerank Qdrant search results.

{{% fastembed-models type="others" %}}

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Explore the FastEmbed guides](/documentation/fastembed/) for embedding generation and Qdrant integration.
- [Rerank with FastEmbed](/documentation/fastembed/fastembed-rerankers/) to score retrieved results with a cross-encoder.
- [Choose an inference approach](/documentation/inference/) to compare local embedding generation with Qdrant Cloud Inference.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine dense and sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
