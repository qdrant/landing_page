---
title: "Fine-Tuning Sparse Embeddings for E-Commerce Search, Part 1: Why Sparse Embeddings Beat BM25"
short_description: "Dense embeddings blur exact matches. Sparse embeddings keep the details that matter in e-commerce search."
description: "Part 1 of a 4-part series on fine-tuning SPLADE sparse embeddings for e-commerce search. Learn why sparse embeddings outperform BM25 and dense models for product search, how SPLADE works, and why Qdrant's native sparse vector support matters."
preview_dir: /articles_data/sparse-embeddings-ecommerce-part-1/preview
social_preview_image: /articles_data/sparse-embeddings-ecommerce-part-1/preview/social_preview.png
weight: -200
author: Thierry Damiba
author_link: https://github.com/thierrydamiba
date: 2025-01-28T00:00:00.000Z
category: practicle-examples
---

*This is Part 1 of a 4-part series on fine-tuning sparse embeddings for e-commerce search. We'll go from "why bother?" to a production system that beats BM25 by 29%.*

---

Search "iPhone 15 Pro Max 256GB" on a dense embedding system and it happily returns the 128GB model. The semantic similarity is high - it's the same phone! But the customer specified 256GB for a reason. In e-commerce, the details aren't noise. They're the whole point.

This is the gap that sparse embeddings fill. And with fine-tuning, they fill it dramatically well - we achieved a **29% improvement over BM25** on Amazon's ESCI dataset, one of the largest public e-commerce search benchmarks.

In this series, we'll build the entire system: data loading, GPU training on Modal, evaluation with Qdrant, and hard negative mining. But first, let's understand why sparse embeddings are the right tool for this job.

## The Problem with Dense Embeddings in E-Commerce

Dense embeddings (the kind you get from OpenAI, Cohere, or a fine-tuned sentence transformer) compress text into a fixed-size vector - typically 384 to 1024 dimensions, all non-zero. They're excellent at capturing semantic meaning. "Running shoes" and "jogging sneakers" land close together in the embedding space.

But this strength becomes a weakness in e-commerce:

**Exact matches get blurred.** When every dimension is active, the model prioritizes broad semantic similarity over exact term matching. SKU numbers, model names, specific sizes - these critical differentiators get averaged into the same neighborhood as similar-but-wrong products.

**Retrieval is approximate.** Dense vectors require Approximate Nearest Neighbor (ANN) indexes like HNSW. The "approximate" part means you're trading recall for speed. For search, where missing a relevant product means a lost sale, this tradeoff hurts.

**Results are opaque.** Why did product X rank above product Y? With dense embeddings, you can't say. The 768-dimensional vector offers no interpretability. When a merchandising team asks why a product isn't showing up, you're stuck.

## Enter Sparse Embeddings

Sparse embeddings take a fundamentally different approach. Instead of compressing text into a small, dense vector, they project it onto a large vocabulary space - typically 30,000+ dimensions (one per token in the vocabulary). But only 100-300 of those dimensions are non-zero.

| Dimension | Dense Embeddings | Sparse Embeddings |
|-----------|-----------------|-------------------|
| **Vector size** | 384-1024 dimensions | ~30,000 dimensions (vocabulary size) |
| **Non-zero values** | All dimensions active | Only 100-300 terms active |
| **Index type** | Approximate Nearest Neighbor (HNSW) | Inverted index |
| **Exact matching** | Weak | Strong |
| **Interpretability** | Black box | Transparent (see which terms matched) |

The key difference: each dimension in a sparse vector corresponds to an actual word in the vocabulary. You can inspect the vector and see exactly which terms the model considers important and how much weight it gives each one.

## SPLADE: Learned Sparse Representations

SPLADE (Sparse Lexical and Expansion) is the model architecture that makes this work. It passes text through a transformer with a masked language model (MLM) head, then applies max pooling and log saturation to produce sparse weights:

<div style="max-width: 640px; margin: 2rem auto; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);">
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #dc3545;">SPLADE Encoding Pipeline</div>
  <div style="background: #16213e; padding: 20px; color: #c0c0d8; line-height: 2; text-align: center;">
    <div style="color: #e0e0f0;">Input: <code style="color: #addb67; background: rgba(173,219,103,0.1);">"noise canceling headphones"</code></div>
    <div style="color: #8890a8;">&#x25BC;</div>
    <div style="color: #e0e0f0;">DistilBERT + MLM Head</div>
    <div style="color: #8890a8;">&#x25BC;</div>
    <div style="color: #e0e0f0;">Max Pooling over tokens</div>
    <div style="color: #8890a8;">&#x25BC;</div>
    <div style="color: #e0e0f0;">ReLU + Log Saturation: <code style="color: #7fdbca; background: rgba(127,219,202,0.1);">log(1 + ReLU(x))</code></div>
    <div style="color: #8890a8; font-size: 12px; font-style: italic;">A learned version of BM25's saturation curve</div>
  </div>
  <div style="background: #1a1a2e; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-top: 1px solid #2a2a4e; border-bottom: 2px solid #dc3545; color: #e0e0e0;">Output (~200 non-zero terms out of 30,522)</div>
  <div style="background: #16213e; padding: 0;">
    <table style="width: 100%; border-collapse: collapse; color: #e0e0e0; font-size: 14px;">
      <thead>
        <tr style="border-bottom: 1px solid #2a2a4e;">
          <th style="text-align: left; padding: 12px 20px; color: #8890a8; font-weight: 400;">Token</th>
          <th style="text-align: left; padding: 12px 20px; color: #8890a8; font-weight: 400;">Weight</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #2a2a4e;"><td style="padding: 10px 20px;">headphones</td><td style="padding: 10px 20px; color: #addb67;">2.3</td></tr>
        <tr style="border-bottom: 1px solid #2a2a4e;"><td style="padding: 10px 20px;">noise</td><td style="padding: 10px 20px; color: #addb67;">1.9</td></tr>
        <tr style="border-bottom: 1px solid #2a2a4e;"><td style="padding: 10px 20px;">canceling</td><td style="padding: 10px 20px; color: #addb67;">1.7</td></tr>
        <tr style="border-bottom: 1px solid #2a2a4e;"><td style="padding: 10px 20px;">audio</td><td style="padding: 10px 20px; color: #addb67;">1.2</td></tr>
        <tr style="border-bottom: 1px solid #2a2a4e;"><td style="padding: 10px 20px;">wireless</td><td style="padding: 10px 20px; color: #addb67;">0.8</td></tr>
        <tr><td style="padding: 10px 20px;">sound</td><td style="padding: 10px 20px; color: #addb67;">0.6</td></tr>
      </tbody>
    </table>
  </div>
</div>

The **log saturation** step is important. Without it, a single high-confidence term could dominate the score. The log compression keeps results balanced - "headphones" matters more than "audio", but not 10x more.

The model learns three things simultaneously:

1. **Weight important terms** higher (product names, key attributes)
2. **Expand queries** with related terms (implicit synonym expansion)
3. **Suppress noise** (common words get near-zero weights)

### Query Expansion: Why SPLADE Beats BM25

This expansion is what separates SPLADE from traditional keyword search. BM25 can only match terms that literally appear in both the query and the document. SPLADE adds related terms that the model learned from training data:

<div style="max-width: 640px; margin: 2rem auto; font-family: -apple-system, sans-serif; text-align: center;">
  <div style="color: #888; font-size: 13px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Query: "summer dress"</div>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; justify-content: center;">
    <span style="background: #1a4d2e; color: #4ade80; padding: 6px 14px; border-radius: 20px; font-size: 15px; font-weight: 500;">dress <span style="opacity: 0.6; font-size: 12px;">2.5</span></span>
    <span style="background: #1a4d2e; color: #4ade80; padding: 6px 14px; border-radius: 20px; font-size: 15px; font-weight: 500;">summer <span style="opacity: 0.6; font-size: 12px;">2.1</span></span>
  </div>
  <div style="color: #7fdbca; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">+ expanded by SPLADE</div>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
    <span style="background: #1a2e4d; color: #7fdbca; padding: 6px 14px; border-radius: 20px; font-size: 14px;">sundress <span style="opacity: 0.6; font-size: 12px;">1.8</span></span>
    <span style="background: #1a2e4d; color: #7fdbca; padding: 6px 14px; border-radius: 20px; font-size: 14px;">floral <span style="opacity: 0.6; font-size: 12px;">0.9</span></span>
    <span style="background: #1a2e4d; color: #7fdbca; padding: 6px 14px; border-radius: 20px; font-size: 14px;">lightweight <span style="opacity: 0.6; font-size: 12px;">0.7</span></span>
    <span style="background: #1a2e4d; color: #7fdbca; padding: 6px 14px; border-radius: 20px; font-size: 14px;">cotton <span style="opacity: 0.6; font-size: 12px;">0.6</span></span>
  </div>
</div>

The model adds "sundress", "floral", and "cotton" - terms that appear in product titles even when "summer" doesn't. This matches products like *"Floral Sundress for Women - Lightweight Cotton"* that BM25 would miss entirely.

No manual synonym file. No query rewriting rules. The model learned these associations from seeing millions of query-product pairs.

## Why Qdrant for Sparse Vectors?

Not every vector database treats sparse vectors as a first-class citizen. Qdrant does, and the difference matters in practice.

**Weighted sparse vectors.** SPLADE emits arbitrary learned weights; Qdrant stores them natively. If you're running a BM25 baseline, you can still add IDF at query time:

```python
sparse_vectors_config={
    "bm25": models.SparseVectorParams(
        modifier=models.Modifier.IDF,  # Apply IDF at query time
    )
}
```

**Hybrid in one request.** Combine sparse precision with dense semantics via native RRF/prefetch - no external reranker:

```python
client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(query=sparse_vector, using="sparse", limit=100),
        models.Prefetch(query=dense_vector, using="dense", limit=100),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

**Production-ready scaling.** Rust + SIMD inverted index with an on-disk option keeps RAM low even with 200+ active terms per doc across millions of products.

**No ANN approximation.** Sparse retrieval uses an inverted index, the same data structure powering BM25. Results are exact - no recall tradeoffs from approximate nearest neighbor search.

## The Stack

Our training pipeline combines three components:

<div style="max-width: 640px; margin: 2rem auto; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);">
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #dc3545;">Modal (GPU Training)</div>
  <div style="background: #16213e; padding: 16px 20px; line-height: 1.8; color: #c0c0d8;">
    <span style="color: #addb67;">&#x2022;</span> A100 GPUs on demand<br>
    <span style="color: #addb67;">&#x2022;</span> Persistent volumes for checkpoints<br>
    <span style="color: #addb67;">&#x2022;</span> Detached runs for long training
  </div>
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-top: 1px solid #2a2a4e; border-bottom: 2px solid #dc3545;">Sentence Transformers v5</div>
  <div style="background: #16213e; padding: 16px 20px; line-height: 1.8; color: #c0c0d8;">
    <span style="color: #addb67;">&#x2022;</span> SparseEncoder architecture<br>
    <span style="color: #addb67;">&#x2022;</span> SpladeLoss with regularization<br>
    <span style="color: #addb67;">&#x2022;</span> Built-in training utilities
  </div>
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-top: 1px solid #2a2a4e; border-bottom: 2px solid #dc3545;">Qdrant (Sparse Vector Store)</div>
  <div style="background: #16213e; padding: 16px 20px; line-height: 1.8; color: #c0c0d8;">
    <span style="color: #addb67;">&#x2022;</span> Native sparse vector support<br>
    <span style="color: #addb67;">&#x2022;</span> Inverted index<br>
    <span style="color: #addb67;">&#x2022;</span> Hybrid search ready
  </div>
</div>

Modal gives us serverless A100 GPUs - no idle hardware, no queue management. Sentence Transformers v5 introduced the `SparseEncoder` class that makes SPLADE training straightforward. And Qdrant handles storage, indexing, and retrieval with native sparse vector support.

## What We'll Build

Over the next three articles, we'll walk through the full pipeline:

- <span style="color: #888;">**Part 2: Training on Modal** (coming soon)</span> - Loading the Amazon ESCI dataset, creating the SPLADE model, configuring loss functions with sparsity regularization, and running GPU training with persistent checkpoints.

- <span style="color: #888;">**Part 3: Evaluation and Hard Negative Mining** (coming soon)</span> - Indexing products in Qdrant, running retrieval benchmarks (nDCG, MRR, Recall), implementing ANCE hard negative mining loops, and analyzing what fine-tuning actually changes in the model.

- <span style="color: #888;">**Part 4: Specialization vs Generalization** (coming soon)</span> - Cross-domain evaluation on Wayfair and Home Depot data, multi-domain training, when to specialize vs generalize, and production deployment guidance.

The end result: a fine-tuned SPLADE model that achieves **nDCG@10 of 0.388** on Amazon ESCI, compared to **0.301** for BM25 and **0.324** for off-the-shelf SPLADE. That 29% improvement over BM25 translates to meaningfully better search results for real e-commerce queries.

Stay tuned for Part 2, where we'll dive into the training pipeline on Modal.
