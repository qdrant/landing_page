---
draft: false
title: "Introducing Qdrant Cloud Inference"
short_description: "Run inferencing natively in Qdrant Cloud"
description: "Learn how to generate embeddings natively in Qdrant Cloud"
preview_image: /blog/qdrant-cloud-inference/inference-social-preview.jpg
social_preview_image: /blog/qdrant-cloud-inference/inference-social-preview.jpg
date: 2025-07-14T00:00:00Z
author: Daniel Azoulai
featured: true
tags:
- vector search
- inference
- multimodal search
- hybrid search
---

# Introducing Qdrant Cloud Inference

Today, we’re announcing the launch of Qdrant Cloud Inference [get started in your cluster](https://cloud.qdrant.io/). With Qdrant Cloud Inference, users can generate, store and index embeddings in a single API call, turning unstructured text and images into search-ready vectors in a single environment. Directly integrating model inference into Qdrant Cloud removes the need for separate inference infrastructure, manual pipelines, and redundant data transfers. 

This simplifies workflows, accelerates development cycles, and eliminates unnecessary network hops for developers. With a single API call, you can now embed, store, and index your data more quickly and more simply. This speeds up application development for RAG, Multimodal, Hybrid search, and more. 

## Unify embedding and search

Traditionally, building application data pipelines means juggling separate embedding services and a vector database, introducing unnecessary complexity, latency, and network costs. Qdrant Cloud Inference brings everything into one system. Embeddings are generated inside the network of your cluster, which removes external API overhead, resulting in lower latency and faster response times. Additionally, you can now track vector database and inference costs in one place. 

![architecture](/blog/qdrant-cloud-inference/inference-architecture.jpg)

## Supported Models for Multimodal and Hybrid Search Applications

At launch, Qdrant Cloud Inference includes six curated models to start with. Choose from dense models like `all-MiniLM-L6-v2` for fast semantic matching, `mxbai/embed-large-v1` for richer understanding, or sparse models like `splade-pp-en-v1` and `bm25` ([Check out this hybrid search tutorial to see it in action](https://qdrant.tech/documentation/tutorials-and-examples/cloud-inference-hybrid-search/)). For multimodal workloads, Qdrant uniquely supports `OpenAI CLIP`-style models for both text and images. 

*Want to request a different model to integrate? You can do this at [https://support.qdrant.io/](https://support.qdrant.io/).*

![architecture](/blog/qdrant-cloud-inference/inference-ui.jpg)

## Get up to 5M free tokens per model per month, and unlimited BM25 tokens

To make onboarding even easier, we’re offering 5 million free tokens per text model, 1 million for our image model, and unlimited for `bm25` to all paid Qdrant Cloud users. These token allowances renew monthly so long as you have a paid Qdrant Cloud cluster. These free monthly tokens are perfect for development, staging, or even running initial production workloads without added cost. 

## Inference is automatically enabled for paid accounts

Getting started is easy. Inference is automatically enabled for any new paid clusters with version 1.14.0 or higher. It can be activated for existing clusters with a click on the inference tab on the Cluster Detail page in the Qdrant Cloud console. You will see examples of how to use inference with our different Qdrant SDKs.

<iframe width="560" height="315" src="https://www.youtube.com/embed/nJIX0zhrBL4?si=s5hd6iaT7F8dj7M-" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Start Embedding Today

You can get started now by logging into [Qdrant Cloud](https://cloud.qdrant.io/), selecting a model, and embedding your data directly. No extra APIs. No new tools. Just faster, simpler AI application development.

*Available for paid cloud users. Available on AWS, Azure, and GCP for US regions only. Additional regions will be added soon.* 

## Join us live for an inferencing webinar on July 31

**How to Build a Multimodal Search Stack with One API**  
**Embed, Store, Search: A Hands-On Guide to Qdrant Cloud Inference**

Kacper Łukawski, Senior Developer Advocate, is hosting a live session on Thursday, July 31 at 8 a.m. PT / 11 a.m. ET / 3 p.m. GMT. 

We'll show you how to:

<ul style="margin: 0; padding: 0; list-style-position: inside;">
  <li style="margin-bottom: 0;">Generate embeddings for text or images using pre-integrated models</li>
  <li style="margin-bottom: 0;">Store and search embeddings in the same Qdrant Cloud environment</li>
  <li style="margin-bottom: 0;">Power multimodal (an industry first) and hybrid search with just one API</li>
  <li style="margin-bottom: 0;">Reduce network egress fees and simplify your AI stack</li>
</ul>


### [**Save your spot**](https://try.qdrant.tech/cloud-inference).