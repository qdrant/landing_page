---
title: Inference
short_description: "Generate dense, sparse, and multimodal embeddings inside Qdrant Cloud, or proxy to OpenAI, Cohere, Jina, and OpenRouter without external infrastructure."
description: "Generate dense, sparse, and multimodal embeddings inside Qdrant Cloud, or proxy requests to OpenAI, Cohere, Jina, and OpenRouter without managing inference servers."
weight: 45
---

# Inference in Qdrant Managed Cloud

[Inference](/documentation/inference/) is the process of creating vector embeddings from text, images, or other data types using a machine learning model.

Qdrant Managed Cloud allows you to use inference directly in the cloud, without the need to set up and maintain your own inference infrastructure. You can use [embedding models hosted on Qdrant Cloud](#qdrant-hosted-models), or use [externally hosted models](#external-models).

<aside role="status">
    Inference is executed within the EU for Qdrant clusters in EU regions and in the US for Qdrant clusters in all other regions. Free models are hosted in the US region only, but can be called from any region.
</aside>

## Enabling/Disabling Inference

Inference is enabled by default for all new clusters created after July 7, 2025. You can enable it for existing clusters directly from the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Activating inference triggers a restart of your cluster to apply the new configuration.

## Using Inference

Use inference through the Qdrant SDKs and the REST or gRPC APIs when upserting points and when querying the database. Refer to the [Inference documentation](/documentation/inference/) for details.

## Embedding Models

Clusters on Qdrant Managed Cloud can access embedding models that are hosted on Qdrant Cloud and models that are hosted externally by other providers.

### Qdrant-Hosted Models

The following models are available:

#### Dense Models

| Model | Modality | Dimensions | Cost |
|---|---|---|---|
| `sentence-transformers/all-minilm-l6-v2` | Text | 384 | Free |
| `intfloat/multilingual-e5-small` | Text | 384 | Free |
| `mixedbread-ai/mxbai-embed-large-v1` | Text | 1024 | Paid |
| `qdrant/clip-vit-b-32-text` | Text | 512 | Paid |
| `qdrant/clip-vit-b-32-vision` | Image | 512 | Paid |

The `qdrant/clip-vit-b-32-text` and `qdrant/clip-vit-b-32-vision` models share a vector space, so you can embed images with the vision model and search them with text queries embedded by the text model.

#### Sparse Models

| Model | Modality | Cost |
|---|---|---|
| `qdrant/bm25` | Text | Free |
| `prithivida/splade_pp_en_v1` | Text | Paid |

#### Multivector Models

| Model | Modality | Dimensions | Cost |
|---|---|---|---|
| `answerdotai/answerai-colbert-small-v1` | Text | 96 | Free |

#### Billing for Qdrant-Hosted Models

Usage of paid embedding models is billed based on the number of tokens processed by the model. The cost is calculated per 1,000,000 tokens. The price depends on the model and is displayed on the Inference tab of the Cluster Detail page. You can also see the current usage of each model there.

Free models are also available on free-tier clusters.

### External Models

Qdrant Cloud can act as a proxy for the following external embedding providers:

- OpenAI
- Cohere
- Jina AI
- OpenRouter

This enables you to [access any of the embedding models provided by these providers through the Qdrant API](/documentation/inference/external-inference-providers/).

#### Billing for External Models

To use an external provider's embedding model, you need an API key from that provider. Billing is managed directly through the external provider, based on API key usage. Refer to each external embedding model provider's website for pricing details.
