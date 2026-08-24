---
title: Multimodal Search
short_description: "Build a multimodal, multilingual vector earch application with Cohere Embed 4.0 and Qdrant Cloud Inference that searches across image and text modalities."
description: "Combine Cohere Embed 4.0 with Qdrant Cloud Inference to power multimodal, multilingual vector search application over images and text using a shared embedding space."
weight: 25
partition: ecosystem
social_preview_image: /documentation/examples/multimodal-search/social_preview.png
aliases:
  - /documentation/tutorials/multimodal-search-fastembed/
  - /documentation/advanced-tutorials/multimodal-search-fastembed/
  - /documentation/multimodal-search/
---

# Multimodal and Multilingual Vector Search with Cohere and Qdrant

| Time: 15 min | Level: Beginner |Output: [GitHub](https://github.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_Cohere_and_Cloud_Inference.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multimodal-search/Multimodal_Search_with_Cohere_and_Cloud_Inference.ipynb)   |
| --- | ----------- | ----------- | ----------- |

## Overview

You often understand and share information more effectively when combining different types of data. The taste of comfort food can trigger childhood memories. A song might be described with just "pam pam clap" sounds instead of a paragraph. Emojis and stickers can express a feeling or a complex idea faster than words.

Modalities of data such as **text, images, video, and audio**, in various combinations, form valuable use cases for semantic search applications.

Vector databases, being **modality-agnostic**, are well suited for building these applications.

This tutorial works with two modalities: image and text data. You can build a semantic search application with any combination of modalities, as long as you choose an embedding model that bridges the **semantic gap**.

> The **semantic gap** refers to the difference between low-level features, such as brightness, and high-level concepts, such as cuteness.

[Cohere Embed 4.0](https://cohere.com/blog/embed-4), for example, is built for multimodal and multilingual embedding, and supports more than 100 languages. Instead of running the model yourself, this tutorial calls it through [Qdrant Cloud Inference](/documentation/inference/inference-api/), so Qdrant generates the embeddings and stores them in a [collection](/documentation/manage-data/collections/) in one step.

## Setup

Install the client:

{{< code-snippet path="/documentation/headless/snippets/install-client/" >}}

<aside role="status">
    You need a Cohere API key to follow along. Create a free one on the <a href="https://dashboard.cohere.com/api-keys">Cohere dashboard</a>.
</aside>

## Dataset

To make the demonstration simple, this tutorial uses a tiny dataset of images and their captions.

Download the [tutorial images](https://github.com/qdrant/examples/tree/master/multimodal-search/images) and place them in a folder named `images`, in the same folder as your code or notebook.

## Connect to Qdrant

1. **Create a client object for Qdrant, with Cloud Inference enabled**.

You'll use a [Qdrant Cloud Free Tier Cluster](/documentation/cloud/create-cluster/#free-clusters). [Create a free cluster](https://cloud.qdrant.io/), save the associated API key and endpoint URL, and instantiate the Qdrant client. Set `cloud_inference=True` so Qdrant can generate embeddings for you:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="client-connection" >}}

2. **Define the dataset and a helper to encode images**.

Cloud Inference accepts images as base64 data URLs, so convert each file before uploading it:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="define-dataset" >}}

3. **Create a collection for the images with captions**.

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="create-collection" >}}

## Upload Data to Qdrant

Upload your images with captions to the collection. Each image and its caption is embedded by Cohere Embed 4.0, through [Cloud Inference](/documentation/inference/external-inference-providers/#cohere), and stored as a [point](/documentation/concepts/points/).

Pass your Cohere API key through a header, and describe each vector as a `models.Document` (for text) or `models.Image` (for the image), naming the Cohere model and the output dimension you want:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="upload-data" >}}

## Search

### Text-to-Image

See what image comes back for the query "*Plane components*". Wrap the query in a `models.Document` the same way you did while uploading, so Cloud Inference embeds it with the same model:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="text-to-image-search" >}}

**Response:**

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

### Multilingual Search

Now run the same query in Italian, one of the 30+ languages Cohere Embed 4.0 supports, and compare the results:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="multilingual-search" >}}

**Response:**

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

### Image-to-Text

Now run a reverse search, starting from this image:

![Diagram of airplane components](/documentation/advanced-tutorials/airplane.png)

Embed the image with `models.Image`, and search only among the text vectors:

{{< code-snippet path="/documentation/headless/snippets/tutorial-multimodal-search/" block="image-to-text-search" >}}

**Response:**

```text
'An image about airplane components.'
```

## Next Steps

Even image and text multimodal search alone supports many use cases: e-commerce, media management, content recommendation, emotion recognition, biomedical image retrieval, and spoken sign language transcription, among others.

Consider a shopper who has a picture of a product they want, plus a specific textual requirement, like "*in beige color*". You can search using text or images alone, or combine their embeddings through **late fusion** (summing and weighting the vectors can work surprisingly well).

Combining both modalities with [Discovery Search](/articles/discovery-search/) can also surface results that neither modality would find on its own.

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, experiment, and have fun!
