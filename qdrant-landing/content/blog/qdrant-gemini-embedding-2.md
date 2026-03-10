---
title: "Qdrant Meets Google Gemini Embedding 2"
draft: false
slug: qdrant-gemini-embedding-2
short_description: "Gemini Embedding 2 maps text, images, video, audio, and PDFs into one vector space. See how Qdrant makes multimodal semantic search and RAG simple with code examples in Python and JavaScript."
preview_image: /blog/qdrant-gemini-embedding-2/gemini-2-hero.png
social_preview_image: /blog/qdrant-gemini-embedding-2/gemini-2-hero.png
date: 2026-03-10
author: Neil Kanungo
featured: true
tags:
- Community
- Embeddings
---

**Search across text, images, video, audio, and PDFs in one vector space, stored and queried in Qdrant.**

Until now, building a search system that understands both what a document says *and* what its images, videos, or audio convey was complex and limited. It meant stitching together multiple embedding models and writing code to reconcile results across modalities. That pipeline complexity may have been the single biggest barrier to production-grade multimodal retrieval.

Today, Google launched [**Gemini Embedding 2**](https://ai.google.dev/gemini-api/docs/embeddings) in Public Preview, the first fully multimodal embedding model in the Gemini family, and Qdrant supports it from day one. This post explains what the model offers, why Qdrant is a natural fit, and how to get started.

### What Is Gemini Embedding 2?

Gemini Embedding 2 is Google's first embedding model capable of mapping **text, images, video, audio, *and* PDF documents** (including interleaved combinations of these) into a single, unified vector space. Built on the Gemini architecture with support for over 100 languages, it's now available through the Gemini API.

### What makes it significant?

**Natively multimodal.** Rather than converting images to captions or audio to transcripts before embedding, Gemini Embedding 2 processes each modality directly. This eliminates lossy intermediate steps and preserves the rich semantic information that lives in visual composition, audio tone, or document layout. Information that text-only pipelines discard.

**Flexible output dimensions via Matryoshka Representation Learning (MRL).** The model supports output dimensions ranging from 128 to 3072, with recommended sizes of 756, 1536, and the default 3072\. MRL means the most important semantic information is concentrated in the first dimensions of the vector. You can truncate embeddings to a smaller size for faster search and lower storage costs, then use the full-size embedding only when you need maximum precision.

**Broad format support with clear limits.** The model handles PNG and JPEG images (up to 6 per request), MP4/MOV video (up to 128 seconds), MP3/WAV audio (up to 80 seconds), and PDFs (up to 6 pages), with a maximum input of 8192 tokens.

**Strong benchmark performance.** Gemini Embedding 2 improves over its predecessor and ranks in the top 5 on the MTEB Multilingual leaderboard for text. Across most other modalities, it achieves state-of-the-art results among proprietary models.

### Why Qdrant is Right for This

Qdrant is built to handle exactly the kind of workloads that a multimodal embedding model like Gemini Embedding 2 enables. Here's where the fit is particularly strong:

**A Unified Collection for All Your Modalities.** Because Gemini Embedding 2 maps every modality into the same vector space, you can store text embeddings, image embeddings, video embeddings, audio embeddings, and PDF embeddings all in a single Qdrant collection. No separate indexes, no reconciliation logic. A text query retrieves relevant video clips. An image query surfaces matching documents. The vectors speak the same language.

**Named Vectors for Hybrid Strategies.** For more sophisticated architectures, Qdrant's named vectors let you store multiple vector representations per point within the same collection. You might store a Gemini Embedding 2 vector alongside a sparse BM25 vector for hybrid search, or keep separate embeddings for different aspects of the same data point. Named vectors keep everything in one place while giving you full control over which vector to query against.

**MRL-Friendly Architecture.** Gemini Embedding 2's flexible dimensionality pairs beautifully with Qdrant's support for multi-stage retrieval. You can build a two-pass search pipeline: first, use lower-dimensional embeddings (like 756 dimensions) for fast candidate retrieval over your entire corpus, then rescore the top candidates with the full 3072-dimensional embeddings for maximum precision. Qdrant's named vectors make this pattern straightforward to implement within a single collection.

**Production-Ready at Scale.** Qdrant is purpose-built in Rust for speed and reliability. Features like built-in quantization (scalar, product, and binary) can dramatically reduce memory usage for large 3072-dimensional vectors. Payload filtering lets you combine vector similarity with structured metadata queries — for example, searching for the most relevant video clips *from the last 30 days* or *in a specific language*. And Qdrant Cloud provides managed horizontal scaling for production deployments.

### How this Benefits You

The combination of a truly multimodal embedding model and a high-performance vector database opens up use cases that were previously impractical to build:

**Multimodal RAG.** Build retrieval-augmented generation systems that pull context from text documents, product images, tutorial videos, and customer support audio recordings, all from a single query against a single Qdrant collection.

**Cross-modal semantic search.** A user describes what they're looking for in text, and the system retrieves matching images, videos, or PDF pages. Or they upload a photo and find relevant documents. The shared vector space makes this work without any custom bridging logic.

**Unified content recommendation.** Recommend a mix of articles, videos, podcasts, and documents based on a user's interaction history, without maintaining separate recommendation engines per content type.

**Multilingual document intelligence.** With 100+ language support, embed and search across documents in any language. Combine this with PDF embedding to build document retrieval systems that work across languages and formats without OCR or translation pipelines.

### Start Building Today

Qdrant's enables you to use Gemini Embedding 2 today. Check out the full documentation with working examples in Python and JavaScript at our [**Gemini integration guide**](/documentation/embeddings/gemini/)**.**

Gemini Embedding 2 is compatible with both Cloud and Open Source deployments. To get started with Qdrant Cloud, [sign up for a free tier today](https://cloud.qdrant.io/signup). 

Multimodal search just got a lot simpler. With Gemini Embedding 2 handling the embeddings and Qdrant handling the storage and retrieval, you can build with the next wave of embedding model and vector search capabilities today.