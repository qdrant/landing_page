---
label: Why It Matters
title: Pick the Right Embedding Model, Or Bring Your Own
subheading: Use the embedding model that fits your use case.
description: >-
  Start at no cost: BM25 and a dense model like all-MiniLM-L6-v2 are free to use,
  including on free-tier clusters. On paid clusters, models like mxbai and SPLADE run on
  metered tokens with a monthly free allowance of up to 5 million tokens per model.


  Choose from supported hosted models or bring your own API key for an external provider.
  Send text or images; Qdrant embeds and searches in one call.
link:
  text: Follow the embedding model migration guide
  url: /documentation/tutorials-operations/embedding-model-migration/
cards:
  - id: 0
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: Shield
    title: Embed without leaving your cluster
    description: >-
      Inference runs inside your Qdrant Cloud cluster's network, so every upsert and
      query stays on one path, with no external hops, no extra egress, and fewer moving
      parts to maintain.
  - id: 1
    icon:
      src: /icons/outline/layers-blue.svg
      alt: Layers
    title: Text, image, and sparse vector models included
    description: >-
      Managed Cloud gives you access to multimodal embeddings, plus sparse vector
      support for BM25-style retrieval, all callable through the same API as your
      database.
  - id: 2
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: Puzzle
    title: Bring your own model or provider
    description: >-
      Point the client at an
      <a href="/documentation/inference/external-inference-providers/">externally hosted model</a>,
      or run your own
      <a href="/documentation/fastembed/fastembed-postprocessing/">client-side inference</a>
      locally using Qdrant's FastEmbed library. You're never locked to a fixed model
      catalog.
  - id: 3
    icon:
      src: /icons/outline/square-pen-blue.svg
      alt: Edit
    title: Swap and test without rebuilding
    description: >-
      Retrieval performance and domain specificity both depend on the embedding model
      you choose. Swapping models on Managed Cloud makes migration significantly easier.
sitemapExclude: true
---
