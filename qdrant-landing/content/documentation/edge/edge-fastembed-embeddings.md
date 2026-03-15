---
title: "On-Device Embeddings" 
weight: 15
---

# On-Device Embeddings with Qdrant Edge and FastEmbed

When using Python, you can use the [FastEmbed](/documentation/fastembed/) library to generate embeddings for use with Qdrant Edge. FastEmbed provides multimodal models that run efficiently on edge devices to generate vector embeddings from text and images.

# Provision the Device

Assuming the devices on which you will run Qdrant Edge have intermittent or no internet connectivity, you need to provision them with the necessary dependencies and model files ahead of time. First, install FastEmbed and the Qdrant Edge Python bindings:

```python
pip install fastembed qdrant-edge-py
```

Next, download the embedding models and save them locally on the device. Instantiate instances of `ImageEmbedding` and `TextEmbedding`, setting the `cache_dir` parameter to a local directory:

{{< code-snippet path="/documentation/headless/snippets/edge/fastembed/" block="download-models" >}}

The models will be downloaded and cached in the specified `MODELS_DIR` directory, from where you can use them to generate embeddings.

# Generate Image Embeddings

First, initialize an Edge Shard as described in the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).

<details>
<summary>Details</summary>

{{< code-snippet path="/documentation/headless/snippets/edge/fastembed/" block="initialize-edge-shard" >}}

</details>

Assuming you have an image file `temp.jpg`, you can generate an embedding for it using FastEmbed's `ImageEmbedding` class and then store it in the Edge Shard:

{{< code-snippet path="/documentation/headless/snippets/edge/fastembed/" block="embed-and-store-image" >}}

Note the use of `cache_dir=MODELS_DIR` and `local_files_only=True` to load the image embedding model from the local directory where it was previously downloaded.

# Generate Text Embeddings

At query time, you can generate text embeddings using FastEmbed's `TextEmbedding` class. For example, to query the Edge Shard:

{{< code-snippet path="/documentation/headless/snippets/edge/fastembed/" block="query-with-text-embedding" >}}

Again, using `cache_dir=MODELS_DIR` and `local_files_only=True` ensures the text embedding model is loaded from the local directory.