---
title: Matryoshka Models
weight: 50
---

# Reduce Vector Dimensionality with Matryoshka Models

[Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) (MRL) is a technique used to train embedding models to produce vectors that can be reduced in size with minimal loss of information. On Qdrant Cloud, for supported models, you can specify the `mrl` parameter in the `options` object to reduce the vector size to the desired dimension.

MRL on Qdrant Cloud helps minimize costs and latency when you need multiple sizes of the same vector. Instead of making several inference requests for each vector size, the inference service only generates embeddings for the full-sized vector and then reduces the vector to each requested smaller size.

The following example demonstrates how to insert a point into a collection with both the original full-size vector (`large`) and a reduced-size vector (`small`):

{{< code-snippet path="/documentation/headless/snippets/inference/mrl/" >}}

Note that, even though the request contains two inference objects, Qdrant Cloud's inference service only makes one inference request to the OpenAI API, saving one round trip and reducing costs.

A good use case for MRL is [prefetching](https://qdrant.tech/documentation/concepts/hybrid-queries/#multi-stage-queries) with smaller vectors, followed by re-scoring with the original-sized vectors, effectively balancing speed and accuracy. This example first prefetches 1000 candidates using a 64-dimensional reduced vector (`small`) and then re-scores them using the original full-size vector (`large`) to return the top 10 most relevant results:

{{< code-snippet path="/documentation/headless/snippets/inference/mrl-multi-stage/" >}}