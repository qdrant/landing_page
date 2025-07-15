---
title: Inference
weight: 81
---

# Inference in Qdrant Managed Cloud

Inference is the process of creating vector embeddings from text, images, or other data types using a machine learning model.

Qdrant Managed Cloud allows you to use inference directly in the cloud, without the need to set up and maintain your own inference infrastructure.

<aside role="alert">
    Inference is currently only available in US regions for paid clusters. Support for inference in other regions is coming soon.
</aside>

![Cluster Cluster UI](/documentation/cloud/cloud-inference.png)

## Supported Models

You can see the list of supported models in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. The list includes models for text, both to produce dense and sparse vectors, as well as multi-modal models for images.

## Enabling/Disabling Inference

Inference is enabled by default for all new clusters, created after July, 7th 2025. You can enable it for existing clusters directly from the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Activating inference will trigger a restart of your cluster to apply the new configuration.

## Billing

Inference is billed based on the number of tokens processed by the model. The cost is calculated per 1,000,000 tokens. The price depends on the model and is displayed ont the Inference tab of the Cluster Detail page. You also can see the current usage of each model there.

## Using Inference

Inference can be easily used through the Qdrant SDKs and the REST or GRPC APIs.
Inference is available when upserting points as well as when querying the database.

It is can be done with special *Interface Objects*, defined in Qdrant API.
There are 

* **`Document`** object, used for text inference. Example:

```js
// Document
{
    // Model input
    text: "Your text",
    // Name of the model, to do inference with
    model: "<the-model-to-use>",
    // Extra parameters for the model, Optional
    options: {}
}
```

* **`Image`** object, used for image inference. Example:

```js
// Image
{
    // Image input
    image: "<url>", // Or base64 of the image
    // Name of the model, to do inference with
    model: "<the-model-to-use>",
    // Extra parameters for the model, Optional
    options: {}
}
```

* **`Object`** object, reserved for all other types of input, which might be implemented in future.


Qdrant API supports usage of Inference Objects in all places, where regular vectors can be used.

For example:

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
    "nearest":{
      "text": "My Query Text",
      "model": "<the-model-to-use>"
    }
  }
}
```

In this case, the Qdrant server will call the inference server, automatically replace the Inference Object, and perform the search query.
The obtained embedding will only be transferred within the low-latency network and will never be transmitted between the client and Qdrant Cloud.

The input used for inference will not be saved anywhere. If you need to persist it in Qdrant, make sure to explicitly include it in the payload.


### Text Inference

Let's consider a simple example of using Cloud Inference with text model.

In this in this example we create one point and use simple search query with `Document` Inference Object.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

Usage examples, specific to each cluster and model, can also be found in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

Note that each model has a context window, which is the maximum number of tokens that can be processed by the model in a single request. If the input text exceeds the context window, it will be truncated to fit within the limit. The context window size is displayed in the Inference tab of the Cluster Detail page.

For dense vector models, you also have to ensure that the vector size configured in the collection matches the output size of the model. If the vector size does not match, the upsert will fail with an error.

### Image Inference

Here is another simple example of using Cloud Inference with an image model.
This time, we will use the `CLIP` model to encode an image and then use a text query to search for it.

Since the `CLIP` model is multimodal, we can use both image and text inputs on the same vector field.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/image/" >}}

The Qdrant Inference server will download images using the provided link.

Note that each model has limitations on the file size and extensions it can work with.
Please refer to the model card for details.

### Local Inference Compatibility

The Python SDK offers a unique capability: it supports both [local](/documentation/fastembed/fastembed-semantic-search/) and cloud inference through an identical interface.
You can easily switch between local and cloud inference by setting the cloud_inference flag when initializing the QdrantClient. For example:

```python
client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key="<your-api-key>",
    cloud_inference=True,  # Set to False to use local inference
)
```

This flexibility allows you to develop and test your applications locally or in continuous integration (CI) environments without requiring access to cloud inference resources.
When `cloud_inference` is set to `False`, inference is performed locally usign `fastembed`.
When set to `True`, inference requests are handled by Qdrant Cloud.
