---
title: Inference
weight: 65
aliases:
  - ../inference
---

# Inference

Inference is the process of creating vector embeddings from text, images, or other data types using a machine learning model. 

It is possible to create embeddings on the client side, for example using the [FastEmbed](/documentation/fastembed/) library, and send Qdrant the resulting vectors when storing or querying data. However, Qdrant can also generate these embeddings itself, which has several advantages:

- No need for external pipelines or separate model servers.
- Work with a single unified API, instead of a different API per model provider.
- No external network calls, minimizing delays or data transfer overhead.

![Inference.](/docs/inference.png)

Embedding models can be hosted:

- locally (only supported for the BM25 model)
- in Qdrant Cloud (only available for clusters on Qdrant Managed Cloud)
- externally (OpenAI, Cohere, and Jina AI. Only available for clusters on Qdrant Managed Cloud)

## Inference API

You can use inference in the API wherever you can use regular vectors. For example, while upserting points, you can provide the text or image and the embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/ingest/" >}}

Qdrant uses the model to generate the embeddings and store the point with the resulting vector.

Retrieving the point shows the vector embeddings that were generated:

```json
    ....
      "my-bm25-vector": {
        "indices": [
          112174620,
          177304315,
          662344706,
          771857363,
          1617337648
        ],
        "values": [
          1.6697302,
          1.6697302,
          1.6697302,
          1.6697302,
          1.6697302
        ]
      }
    ....
]
```

Similarly, you can use inference at query time by providing the text or image to query with and the embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/query/" >}}

## Qdrant Cloud Inference

Clusters on Qdrant Managed Cloud have access to a number of embedding models hosted on Qdrant Cloud. For the list of available models, visit the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Here, you can also enable Cloud Inference for a cluster if it's not enabled already.

Before using a Cloud-hosted embedding model, ensure that your collection has been configured for vectors with the correct dimensionality. The Inference tab of the Cluster Detail page in the Qdrant Cloud Console lists the dimensionality for each supported embedding model.

For example, to use the multimodal CLIP model, first create a collection configured for vectors with 512 dimensions:

{{< code-snippet path="/documentation/headless/snippets/inference/create-512-dims/" >}}

Next, you can use inference to generate the embeddings when ingesting and querying the data. 
Because the CLIP model is multimodal, you can ingest images and/or text. 

The following example shows ingest-time inference based on an image and query-time inference based on text:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/image/" >}}

Note that the upsert request provides an image URL. The Qdrant Cloud Inference server will download the image using the provided link. Alternatively, you can upload the image as a base64-encoded string.

## External embedding model providers

Qdrant Cloud can act as a proxy for external embedding model provider APIs. This enables you to use any of their embedding models through the Qdrant API.

The following providers are supported:

- OpenAI
- Cohere
- Jina AI

To use an external embedding model provider, you need an API key from that provider. For example, to access OpenAI models, you need an OpenAI API key. Billing will be managed directly through the external provider, based on API key usage. Refer to each external embedding model provider's website for pricing details.

Make sure to configure your collections for vectors with the correct number of dimensions. Consult the embedding model's documentation for the dimensionality of the resulting embeddings.

### OpenAI

When you provide a model name prepended with `openai/`, the embedding request is automatically routed to the OpenAI API. You need to provide your OpenAI API key with each request.

For example, to use OpenAI's `text-embedding-3-large` model, when ingesting and querying data, prepend the model name with `openai/` and provide your OpenAI API key in the `options` object. Any OpenAI-specific API parameters can be passed using the `options` object. This example uses the OpenAI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/openai/" >}}

### Cohere

When you provide a model name prepended with `cohere/`, the embedding request is automatically routed to the Cohere API. You need to provide your Cohere API key with each request.

For example, to use Cohere's multimodal `embed-v4.0` model, when ingesting and querying data, prepend the model name with `cohere/` and provide your Cohere API key in the `options` object. This example uses the Cohere-specific API `output_dimension` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere/" >}}

Note that the Cohere `embed-v4.0` model does not allow an image to be passed as a URL. You need to provide a base64-encoded image as a Data URL.

### Jina AI

When you provide a model name prepended with `jinaai/`, the embedding request is automatically routed to the Jina AI API. You need to provide your Jina AI API key with each request.

For example, to use Jina AI's multimodal `jina-clip-v2` model, when ingesting and querying data, prepend the model name with `jinaai/` and provide your Jina AI API key in the `options` object. This example uses the Jina AI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai/" >}}
