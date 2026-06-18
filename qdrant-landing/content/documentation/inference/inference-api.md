---
title: Inference API
weight: 10
---

# Inference API

When using [Qdrant Cloud Inference](/documentation/inference/cloud-inference/) or Qdrant's [BM25 model](/documentation/inference/inference-bm25/), embeddings are generated server-side. Instead of pre-computed vectors, you pass Inference Objects when ingesting or querying data. An Inference Object tells Qdrant how to generate a vector from your input. It contains the input, such as text or an image, along with the model to use. The API supports three types of Inference Objects:

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

For example, the following code:

{{< code-snippet path="/documentation/headless/snippets/inference/query-vector/" >}}

can be replaced with:

{{< code-snippet path="/documentation/headless/snippets/inference/query-document/" >}}

In this case, Qdrant uses the configured embedding model to create a vector from the Inference Object and then perform the search query with it. All of this happens within a low-latency network.

<aside role="status">
When using inference at ingest time, the input used for inference is not stored. If you want to persist it in Qdrant, ensure that you explicitly include it in the payload.
</aside>

## Multiple Inference Operations

You can run multiple inference operations within a single request, even when models are hosted in different locations. This example generates three different named vectors for a single point: image embeddings using `jina-clip-v2` hosted by Jina AI, text embeddings using `all-minilm-l6-v2` hosted by Qdrant Cloud, and BM25 embeddings using the `bm25` model executed locally by the Qdrant cluster:

{{< code-snippet path="/documentation/headless/snippets/inference/multiple/" >}}

When specifying multiple identical inference objects in a single request, the inference service generates embeddings only once and reuses the resulting vectors. This optimization is particularly beneficial when working with external model providers, as it reduces both latency and cost.