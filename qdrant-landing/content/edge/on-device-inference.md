---
label: ON-DEVICE INFERENCE
title: Everything Runs On The Device
description: Qdrant Edge keeps Qdrant's full retrieval surface. The same query primitives run in your process on the device as they do server-side.
features:
  - id: 0
    title: Embed With FastEmbed
    description: Generate vector embeddings directly on the device with FastEmbed, so both halves of a retrieval step run in the same process.
    link:
      url: /documentation/edge/edge-fastembed-embeddings/
      text: Read About On-Device Embeddings
    codeBar: python
    code: |
      from fastembed import ImageEmbedding, TextEmbedding
    
      TEXT_MODEL_NAME='Qdrant/clip-ViT-B-32-text'
      VISION_MODEL_NAME='Qdrant/clip-ViT-B-32-vision'
      MODELS_DIR="./qdrant-edge-directory/models"
    
      ImageEmbedding(
          model_name=VISION_MODEL_NAME,
          cache_dir=MODELS_DIR
      )
    
      TextEmbedding(
          model_name=TEXT_MODEL_NAME,
          cache_dir=MODELS_DIR
      )
  - id: 1
    title: Run Hybrid Search
    description: Prefetch dense and BM25 sparse results inside the same shard and fuse them with Reciprocal Rank Fusion, in-process and offline.
    link:
      url: /documentation/edge/edge-bm25/
      text: On-Device BM25
    codeBar: python
    code: |
      from qdrant_edge import (
          EdgeConfig,
          EdgeShard,
          EdgeSparseVectorParams,
          Modifier,
      )
      
      config = EdgeConfig(
          sparse_vectors={"text": 
      EdgeSparseVectorParams(modifier=Modifier.Idf)}
      ,
      )
      
      shard = EdgeShard.create(SHARD_DIRECTORY, config)
  - id: 2
    title: Filter And Facet On Payload
    description: Store payload next to your vectors, filter on it at query time, and keep live facet counts per class.
    link:
      url: /documentation/edge/edge-quickstart/
      text: See It Running
    image:
      src: /img/edge/edge-demo.png
      alt: Demo
sitemapExclude: true
---

