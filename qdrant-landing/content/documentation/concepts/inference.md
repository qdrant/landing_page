---
title: Inference
weight: 65
aliases:
  - ../inference
---

# Inference

Inference is the process of using a machine learning model to create vector embeddings from text, images, or other data types. While you can create embeddings on the client side, you can also let Qdrant generate them while storing or querying data.

![Inference.](/docs/inference.png)

There are several advantages to generating embeddings with Qdrant:

- No need for external pipelines or separate model servers.
- Work with a single unified API instead of a different API per model provider.
- No external network calls, minimizing delays or data transfer overhead.

Depending on the model you want to use, inference can be executed:

- on the client side, using the [FastEmbed](/documentation/fastembed/) library
- [by the Qdrant cluster](#server-side-inference-bm25) (only supported for the BM25 model)
- in Qdrant Cloud, using [Cloud Inference](#qdrant-cloud-inference) (for clusters on Qdrant Managed Cloud)
- [externally](#external-embedding-model-providers) (models by OpenAI, Cohere, and Jina AI; for clusters on Qdrant Managed Cloud)

## Inference API

You can use inference in the API wherever you can use regular vectors. Instead of a vector, you can use special *Interface Objects*:

* **`Document`** object, used for text inference 

    ```js
    // Document
    {
        // Text input
        text: "Your text",
        // Name of the model, to do inference with
        model: "<the-model-to-use>",
        // Extra parameters for the model, Optional
        options: {}
    }
    ```

* **`Image`** object, used for image inference

    ```js
    // Image
    {
        // Image input
        image: "<url>", // Or base64 encoded image
        // Name of the model, to do inference with
        model: "<the-model-to-use>",
        // Extra parameters for the model, Optional
        options: {}
    }
    ```

* **`Object`** object, reserved for other types of input, which might be implemented in the future.


The Qdrant API supports the usage of these Inference Objects in all places where regular vectors can be used. For example:

```http
POST /collections/<your-collection>/points/query
{
  "query": {
    "nearest": [0.12, 0.34, 0.56, 0.78, ...]
  }
}
```

Can be replaced with

```http
POST /collections/<your-collection>/points/query
{
  "query": {
    "nearest": {
      "text": "My Query Text",
      "model": "<the-model-to-use>"
    }
  }
}
```

In this case, Qdrant uses the configured embedding model to automatically create a vector from the Inference Object and then perform the search query with it. All of this happens within a low-latency network.

<aside role="status">
When using inference at ingest time, the input used for inference is not stored. If you want to persist it in Qdrant, ensure that you explicitly include it in the payload.
</aside>

## Server-side Inference: BM25

BM25 (Best Matching 25) is a ranking function for text search. BM25 uses sparse vectors that represent documents, where each dimension corresponds to a word. Qdrant can generate these sparse embeddings from input text directly on the server.

While upserting points, provide the text and the `qdrant/bm25` embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/ingest/" >}}

Qdrant uses the model to generate the embeddings and stores the point with the resulting vector. Retrieving the point shows the embeddings that were generated:

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

Similarly, you can use inference at query time by providing the text to query with as well as the embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/query/" >}}

## Qdrant Cloud Inference

Clusters on Qdrant Managed Cloud can access embedding models that are [hosted on Qdrant Cloud](/documentation/cloud/inference/). For a list of available models, visit the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Here, you can also enable Cloud Inference for a cluster if it's not already enabled.

Before using a Cloud-hosted embedding model, ensure that your collection has been configured for vectors with the correct dimensionality. The Inference tab of the Cluster Detail page in the Qdrant Cloud Console lists the dimensionality for each supported embedding model.

### Text Inference

Let's consider an example of using Cloud Inference with a text model that produces dense vectors. This example creates one point and uses a simple search query with a `Document` Inference Object.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

Usage examples, specific to each cluster and model, can also be found in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

Note that each model has a context window, which is the maximum number of tokens that can be processed by the model in a single request. If the input text exceeds the context window, it is truncated to fit within the limit. The context window size is displayed in the Inference tab of the Cluster Detail page.

For dense vector models, you also have to ensure that the vector size configured in the collection matches the output size of the model. If the vector size does not match, the upsert will fail with an error.

### Image Inference

Here is another example of using Cloud Inference with an image model. This example uses the `CLIP` model to encode an image and then uses a text query to search for it.

Since the `CLIP` model is multimodal, we can use both image and text inputs on the same vector field.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/image/" >}}

The Qdrant Cloud Inference server will download the images using the provided URL. Alternatively, you can provide the image as a base64-encoded string. Each model has limitations on the file size and extensions it can work with. Refer to the model card for details.

### Local Inference Compatibility

The Python SDK offers a unique capability: it supports both [local](/documentation/fastembed/fastembed-semantic-search/) and cloud inference through an identical interface.

You can easily switch between local and cloud inference by setting the `cloud_inference` flag when initializing the QdrantClient. For example:

```python
client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key="<your-api-key>",
    cloud_inference=True,  # Set to False to use local inference
)
```

This flexibility allows you to develop and test your applications locally or in continuous integration (CI) environments without requiring access to cloud inference resources.

* When `cloud_inference` is set to `False`, inference is performed locally using `fastembed`.
* When set to `True`, inference requests are handled by Qdrant Cloud.

## External Embedding Model Providers

Qdrant Cloud can act as a proxy for the APIs of three external embedding model providers:

- OpenAI
- Cohere
- Jina AI

This enables you to access any of the embedding models provided by these providers through the Qdrant API.

To use an external provider's embedding model, you need an API key from that provider. For example, to access OpenAI models, you need an OpenAI API key. Billing is managed directly through the external provider, based on API key usage. Refer to each external embedding model provider's website for pricing details.

<aside role="status">
When using a model from an external provider, refer to the model's documentation for:

- the dimensions of the resulting embeddings
- how to pass an image when creating image embeddings. Some providers allow you to pass an image URL, while others require a base64-encoded image
- any additional parameters that the model supports
</aside>

### OpenAI

When you prepend a model name with `openai/`, the embedding request is automatically routed to the [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings). You need to provide your OpenAI API key with each request.

For example, to use OpenAI's `text-embedding-3-large` model, when ingesting and querying data, prepend the model name with `openai/` and provide your OpenAI API key in the `options` object. Any OpenAI-specific API parameters can be passed using the `options` object. This example uses the OpenAI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/openai/" >}}

### Cohere

<aside role="status">Qdrant only supports version 2 of the Cohere Embed API.</aside>

When you prepend a model name with `cohere/`, the embedding request is automatically routed to the [Cohere Embed API](https://docs.cohere.com/reference/embed). You need to provide your Cohere API key with each request.

For example, to use Cohere's multimodal `embed-v4.0` model, when ingesting and querying data, prepend the model name with `cohere/` and provide your Cohere API key in the `options` object. This example uses the Cohere-specific API `output_dimension` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere/" >}}

Note that the Cohere `embed-v4.0` model does not allow an image to be passed as a URL. You need to provide a base64-encoded image as a Data URL.

### Jina AI

When you prepend a model name with `jinaai/`, the embedding request is automatically routed to the [Jina AI Embedding API](https://jina.ai/embeddings/). You need to provide your Jina AI API key with each request.

For example, to use Jina AI's multimodal `jina-clip-v2` model, when ingesting and querying data, prepend the model name with `jinaai/` and provide your Jina AI API key in the `options` object. This example uses the Jina AI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai/" >}}

## Multiple Inference Operations

You can run multiple inference operations within a single request, even when models are hosted in different locations. This example generates image embeddings using `jina-clip-v2` hosted by Jina AI, text embeddings using `all-minilm-l6-v2` hosted by Qdrant Cloud, and BM25 embeddings using the `bm25` model executed locally by the Qdrant cluster:

{{< code-snippet path="/documentation/headless/snippets/inference/multiple/" >}}