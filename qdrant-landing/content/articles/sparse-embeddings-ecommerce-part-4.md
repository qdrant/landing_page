---
title: "Fine-Tuning Sparse Embeddings for E-Commerce Search, Part 4: Specialization vs Generalization"
short_description: "Does fine-tuning on Amazon data help on Wayfair and Home Depot? When to specialize vs generalize."
description: "Part 4 of a 4-part series. Test cross-domain generalization on Wayfair and Home Depot, train a multi-domain SPLADE model, and build a decision framework for when to specialize vs generalize your search embeddings."
preview_dir: /articles_data/sparse-embeddings-ecommerce-part-4/preview
social_preview_image: /articles_data/sparse-embeddings-ecommerce-part-4/preview/social_preview.png
weight: -203
author: Thierry Damiba
author_link: https://github.com/thierrydamiba
date: 2025-01-31T00:00:00.000Z
category: practicle-examples
---

*This is Part 4 of a 4-part series on fine-tuning sparse embeddings for e-commerce search. In [Part 3](/articles/sparse-embeddings-ecommerce-part-3/), we evaluated our model and implemented hard negative mining. Now we test how well it generalizes.*

---

We've built a SPLADE model that beats BM25 by 28% on Amazon ESCI. But here's the question that determines whether this is a lab result or a production strategy: does it work on data it wasn't trained on?

In this final article, we test cross-domain generalization, train a multi-domain model, and lay out a decision framework for when to specialize vs generalize.

## Cross-Domain Evaluation

We took our Amazon ESCI-trained model and tested it on three additional datasets:

- **WANDS** (Wayfair): Furniture and home goods search
- **Home Depot**: Hardware and home improvement search
- **MS MARCO**: General web search (the "out of distribution" control)

| Dataset | BM25 | SPLADE (off-shelf) | SPLADE (ESCI-tuned) | vs BM25 |
|---------|------|-------------------|---------------------|---------|
| **ESCI (Amazon)** | 0.305 | 0.326 | **0.389** | **+27.5%** |
| **WANDS (Wayfair)** | 0.329 | 0.341 | 0.355 | +7.9% |
| **Home Depot** | 0.349 | 0.391 | 0.384 | +10.0% |
| **MS MARCO** | 0.915 | 0.982 | 0.751 | -17.9% |

Three patterns emerge:

**In-domain (ESCI): +28% over BM25.** The model was trained on this data. No surprise it does well.

**Cross-domain e-commerce: +8-10% over BM25.** The Amazon-trained model still helps on Wayfair and Home Depot. E-commerce search shares enough structure — brand matching, attribute weighting, product vocabulary — that the patterns transfer. But notice the gap to off-the-shelf SPLADE narrows. On Home Depot, the off-the-shelf model actually wins (0.391 vs 0.384).

**Out-of-domain (MS MARCO): -18% vs BM25.** This is catastrophic forgetting in action. The model overfitted to e-commerce patterns. "Apple" became a brand, not a fruit. "Prime" became a shipping speed, not a math concept. The general IR capabilities of the original DistilBERT were overwritten during fine-tuning.

## Why Generalization Degrades

The cross-domain results reveal a fundamental tradeoff. Fine-tuning teaches the model:

- **Amazon-specific query patterns** — short, product-focused queries with brand names and model numbers
- **Amazon-specific vocabulary** — "renewed" (refurbished), "subscribe & save", "prime eligible"
- **Amazon-specific relevance signals** — what Amazon shoppers consider a good match vs a substitute

Wayfair customers search differently ("mid-century modern coffee table" vs "coffee table"). Home Depot customers use industry terminology ("3/8 inch drive socket set"). The Amazon-trained model helps on these datasets — e-commerce is e-commerce — but it's not optimal.

MS MARCO is the extreme case. Web search queries like "what is the capital of France" or "how to tie a tie" are nothing like e-commerce queries. The model's learned biases actively hurt.

## Multi-Domain Training

To address the generalization problem, we trained a **multi-domain SPLADE model** on combined data from ESCI, WANDS, and Home Depot — roughly 50K training pairs from each dataset, 150K total.

The hypothesis: exposure to diverse e-commerce catalogs should improve cross-domain transfer while maintaining reasonable in-domain performance.

| Dataset | SPLADE (ESCI-only) | SPLADE (Multi-domain) | Difference |
|---------|-------------------|----------------------|------------|
| **ESCI** | **0.389** | 0.372 | -4.4% |
| **WANDS** | 0.355 | **0.366** | +3.1% |
| **Home Depot** | 0.384 | **0.410** | +6.8% |
| **MS MARCO** | 0.751 | **0.829** | +10.4% |

Multi-domain training does exactly what you'd expect:

- **ESCI drops 4%**: Less specialization means less Amazon-specific optimization. The model can't memorize Amazon's vocabulary as deeply when it's also learning Wayfair and Home Depot patterns.
- **WANDS and Home Depot gain 3-7%**: Direct benefit from training data. The model now understands furniture terminology and hardware vocabulary.
- **MS MARCO recovers 10%**: More diverse training data prevents the catastrophic forgetting we saw with ESCI-only training. The model retains more general language understanding.

### Setting Up Multi-Domain Training

The multi-domain loader normalizes labels across datasets:

```yaml
# configs/splade_multidomain.yaml
run_name: splade_multidomain
base_model: distilbert/distilbert-base-uncased
architecture: splade
batch_size: 32
learning_rate: 2e-5
num_epochs: 1
datasets:
  - name: esci
    max_samples: 50000
  - name: wands
    max_samples: 50000
  - name: homedepot
    max_samples: 50000
```

Label normalization is the key challenge. ESCI uses character labels (E, S, C, I), WANDS uses numeric scores (0, 1, 2), and Home Depot uses relevance ratings. The multi-domain loader maps everything to a common format: positive (relevant) and negative (irrelevant) pairs for contrastive training.

## Decision Framework

After running all these experiments, here's when to use each approach:

| Scenario | Recommended Model | Why |
|----------|------------------|-----|
| **Single retailer, lots of training data** | Domain-specific fine-tuning | Maximum performance on your catalog |
| **Multi-retailer or marketplace** | Multi-domain training | Better generalization across catalogs |
| **New domain, limited data** | Off-the-shelf SPLADE | Strong baseline without training data |
| **Hybrid (e-commerce + general search)** | Multi-domain training | Preserves general IR capabilities |

**Single retailer with abundant data** — If you're building search for Amazon, Wayfair, or any single retailer with click logs, domain-specific fine-tuning wins. The 4% you lose on other domains doesn't matter if you only serve one catalog.

**Marketplace or multi-retailer** — If you're building a platform that serves multiple retailers (Shopify search, a price comparison engine), multi-domain training provides better balance. You sacrifice some peak performance for consistency across catalogs.

**Cold start** — New to a domain with no training data? Off-the-shelf SPLADE (like `naver/splade-v3`) is a strong baseline. It beats BM25 on most e-commerce datasets without any fine-tuning. Start here, collect click data, then fine-tune.

## The Case for Owning Your Model

Why fine-tune at all when embedding APIs exist?

**You own the weights.** API providers can change models, deprecate endpoints, or adjust pricing. Your fine-tuned model runs wherever you deploy it — Modal, your own GPUs, or even CPU inference for low-traffic applications.

**You control the training data.** Generic embedding APIs can't be fine-tuned on your product catalog. Your customers search for "AirPods Max leather case" but the generic model doesn't know "AirPods Max" is a specific product. Fine-tuning on your click data teaches the model your vocabulary.

**The economics favor ownership at scale.** Embedding API costs are per-token. At 10M queries/month, self-hosted inference costs a fraction of API pricing, with no per-query fees.

**Latency is predictable.** No external API calls, no rate limits, no provider outages.

## The Data Flywheel

Fine-tuning isn't a one-time investment. It's the start of a compounding loop:

```
Better Model → Better Rankings →
More Clicks → Better Training Data →
Even Better Model → ...
```

**Phase 1: Bootstrap.** Use product metadata and relevance labels (or the ESCI dataset as a proxy). Train the initial model. This is what we've done in this series.

**Phase 2: Implicit feedback.** Log queries with clicked products (positive pairs). Log impressions without clicks (negative signals). Track add-to-cart and purchase events (high-confidence positives).

**Phase 3: Continuous improvement.** Retrain periodically on accumulated click data. A/B test new models against production. Monitor nDCG on held-out queries.

The 28% improvement we demonstrated is the starting point. Each iteration incorporates what customers actually searched for and clicked on — data your competitors can't access.

## What's Next

We've covered the full pipeline: from understanding why sparse embeddings work for e-commerce, through training on Modal and evaluating with Qdrant, to the specialization-generalization tradeoff.

Extensions worth exploring:

- **Cross-encoder reranking**: Add a second-stage ranker for the top-k results from SPLADE. This is the standard two-stage retrieval architecture in production systems.
- **Larger base models**: ModernBERT or DeBERTa instead of DistilBERT. More parameters, better representations, slower inference.
- **Full dataset training**: We used 100K samples from ESCI. The full 1.2M with multiple epochs would likely improve results further.
- **Curriculum learning**: Start with general data, gradually specialize to your domain. This can mitigate catastrophic forgetting while still achieving strong in-domain performance.

The code is [open source](https://github.com/qdrant/esci-sparse-encoder). The training infrastructure (Modal) is pay-per-second. The vector database (Qdrant) has native sparse support. The barrier to building better e-commerce search has never been lower.

---

## Series Summary

| Article | Topic | Key Result |
|---------|-------|------------|
| [Part 1](/articles/sparse-embeddings-ecommerce-part-1/) | Why sparse embeddings for e-commerce | SPLADE combines keyword precision with learned expansion |
| [Part 2](/articles/sparse-embeddings-ecommerce-part-2/) | Training pipeline on Modal | 6 min training, <$1, persistent checkpoints |
| [Part 3](/articles/sparse-embeddings-ecommerce-part-3/) | Evaluation and hard negatives | +28% vs BM25, +19% vs off-the-shelf SPLADE |
| [Part 4](/articles/sparse-embeddings-ecommerce-part-4/) | Specialization vs generalization | Domain-specific wins for single retailers; multi-domain for platforms |
