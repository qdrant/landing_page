---
label: How It Works
title: From Raw Content to Search Results in Three Steps
description: Managed Cloud handles the inference layer so your code stays simple.
button:
  text: Learn More
  url: /documentation/cloud/inference/
steps:
  - id: 0
    number: "01"
    title: Cloud Inference Enabled Automatically
    description: >-
      Managed deployments on Qdrant Cloud have Cloud Inference enabled by default at no
      extra cost. Name the model in your upsert or query call and Qdrant embeds it
      in-cluster.
  - id: 1
    number: "02"
    title: Pass your content as an Inference Object
    description: >-
      In your upsert or query, replace the pre-computed vector with an Inference Object:
      the input, such as text or an image, plus the model to use. Qdrant embeds
      in-cluster on the same request, storing the vector when you write and matching
      against it when you search.
  - id: 2
    number: "03"
    title: Keep one integration surface for external models
    description: >-
      Point the call at OpenAI, Cohere, Jina AI, or OpenRouter and Qdrant Cloud proxies
      the request with your provider key, then stores or searches the result in the same
      operation. Your application uses the Qdrant client, with no provider SDKs to
      maintain.
sitemapExclude: true
---
