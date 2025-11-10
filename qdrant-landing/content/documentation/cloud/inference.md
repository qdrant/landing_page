---
title: Inference
weight: 81
---

# Inference in Qdrant Managed Cloud

[Inference](/documentation/concepts/inference/) is the process of creating vector embeddings from text, images, or other data types using a machine learning model.

Qdrant Managed Cloud allows you to use inference directly in the cloud, without the need to set up and maintain your own inference infrastructure.

<aside role="alert">
    Inference is currently executed within a US region, even if the Qdrant Cloud cluster is hosted in another region.
</aside>

![Cluster Cluster UI](/documentation/cloud/cloud-inference.png)

## Supported Models

You can see the list of supported models in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. The list includes models for text, both to produce dense and sparse vectors, as well as multi-modal models for images.

## Enabling/Disabling Inference

Inference is enabled by default for all new clusters, created after July, 7th 2025. You can enable it for existing clusters directly from the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Activating inference will trigger a restart of your cluster to apply the new configuration.

## Billing

Inference is billed based on the number of tokens processed by the model. The cost is calculated per 1,000,000 tokens. The price depends on the model and is displayed on the Inference tab of the Cluster Detail page. You also can see the current usage of each model there.

## Using Inference

Inference can be easily used through the Qdrant SDKs and the REST or GRPC APIs when upserting points and when querying the database. Refer to the [Inference documentation](/documentation/concepts/inference/) for details.