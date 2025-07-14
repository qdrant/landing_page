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

Inference can be easily used through the Qdrant SDKs and the REST or GRPC APIs. Inference is available when upserting points as well as when querying the database.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

Usage examples, specific to each cluster and model, can also be found in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

Note that each model has a context window, which is the maximum number of tokens that can be processed by the model in a single request. If the input text exceeds the context window, it will be truncated to fit within the limit. The context window size is displayed in the Inference tab of the Cluster Detail page.

For dense vector models, you also have to ensure that the vector size configured in the collection matches the output size of the model. If the vector size does not match, the upsert will fail with an error.
