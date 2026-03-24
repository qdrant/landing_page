---
title: Cloud Inference
weight: 30
---

# Qdrant Cloud Inference

Clusters on Qdrant Managed Cloud can access embedding models that are [hosted on Qdrant Cloud](/documentation/cloud/inference/). For a list of available models, visit the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Here, you can also enable Cloud Inference for a cluster if it's not already enabled.

Several embedding models can be used for free with Qdrant Cloud Inference, also in combination with clusters on the Qdrant Cloud free tier. Free models are identified by the “Cost: Free” label in the Inference tab of the Cluster Detail page.

Before using a Cloud-hosted embedding model, ensure that your collection has been configured for vectors with the correct dimensionality. The Inference tab of the Cluster Detail page in the Qdrant Cloud Console lists the dimensionality for each supported embedding model.

## Text Inference

Let's consider an example of using Cloud Inference with a text model that produces dense vectors. This example creates one point and uses a simple search query with a `Document` Inference Object.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

Usage examples, specific to each cluster and model, can also be found in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

Note that each model has a context window, which is the maximum number of tokens that can be processed by the model in a single request. If the input text exceeds the context window, it is truncated to fit within the limit. The context window size is displayed in the Inference tab of the Cluster Detail page.

For dense vector models, you also have to ensure that the vector size configured in the collection matches the output size of the model. If the vector size does not match, the upsert will fail with an error.

## Image Inference

Here is another example of using Cloud Inference with an image model. This example uses the `CLIP` model to encode an image and then uses a text query to search for it.

Since the `CLIP` model is multimodal, we can use both image and text inputs on the same vector field.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/image/" >}}

The Qdrant Cloud Inference server will download the images using the provided URL. Alternatively, you can provide the image as a base64-encoded string. Each model has limitations on the file size and extensions it can work with. Refer to the model card for details.

## Local Inference Compatibility

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