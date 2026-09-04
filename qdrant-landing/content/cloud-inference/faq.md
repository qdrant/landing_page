---
title: FAQs
questions:
  - id: 0
    question: Which models are available through Cloud Inference on Managed Cloud?
    answer: Managed Cloud includes dense text models, multimodal (text and image) models, multi-vector models, and sparse (BM25) models on the free tier, with additional larger models on paid clusters. External providers (OpenAI, Cohere, Jina AI, OpenRouter) are supported with your own API key. For the current list, see the Inference tab in the Console.
  - id: 1
    question: Can I use my own fine-tuned embedding model with Managed Cloud?
    answer: Yes. You can point the client at an externally hosted model, or generate vectors yourself and upsert them as raw vectors. This client-side approach runs entirely in your application, for example with Qdrant's FastEmbed library, and is separate from Cloud Inference. To add a model to our hosted lineup, request it at <a href="https://support.qdrant.io/" target="_blank">support.qdrant.io</a>.
  - id: 2
    question: Is Cloud Inference available on Hybrid Cloud or self-hosted deployments?
    answer: Cloud Inference is a Managed Cloud feature. Hybrid Cloud and self-hosted deployments use client-side inference or in-cluster BM25, as well as any external embedding provider. See the <a href="/documentation/inference/">inference documentation</a>.
  - id: 3
    question: Which regions is Cloud Inference available in?
    answer: Inference runs in the EU for clusters in EU regions and in the US for clusters in all other regions. Free models are hosted in the US region but can be called from any region.
  - id: 4
    question: What are the pricing and billing details for Cloud Inference?
    answer: Inference is billed per token at a fixed, region-independent price that depends on the model. Each model's price and your current usage appear in the Inference tab of the cluster detail page in the Cloud Console. Free models carry no token charges, and paid Qdrant Cloud users receive a monthly free allowance of up to 5 million tokens per model. For questions specific to your usage volume, <a href="/contact-us/">contact Qdrant</a>.
sitemapExclude: true
---
