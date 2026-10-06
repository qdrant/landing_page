---
title: "Fine-Tuning Sparse Embeddings for E-Commerce Search | Part 3: Evaluation and Hard Negatives"
short_description: "Part 3 (hands-on) of a 5-part tutorial: evaluate fine-tuned SPLADE in Qdrant, then improve it with hard negative mining."
description: "Part 3 of a 5-part tutorial on fine-tuning SPLADE for e-commerce search: evaluate the model in Qdrant and add ANCE-inspired hard negative mining."
social_preview_image: /documentation/tutorials/sparse-embeddings-ecommerce-part-3/preview/social_preview.jpg
weight: 22
author: Thierry Damiba
author_link: https://github.com/thierrydamiba
date: 2026-03-09T00:00:00.000Z
goal: Search Quality
stack:
  - Python
  - Sentence Transformers
example_resources:
  - label: View Code
    url: https://github.com/qdrant-labs/finetune-ecommerce-search
aliases:
  - /articles/sparse-embeddings-ecommerce-part-3/
---

<link rel="stylesheet" href="/documentation/tutorials/sparse-embeddings-ecommerce/figures.css">

*This is Part 3 of a 5-part tutorial on fine-tuning sparse embeddings for e-commerce search. In [Part 2](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-2/), we trained a SPLADE model on Modal. Now we evaluate it and push further with hard negative mining.*

**Series:**
- [Part 1: Why Sparse Embeddings Beat BM25](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/)
- [Part 2: Training SPLADE on Modal](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-2/)
- Part 3: Evaluation and Hard Negatives (here)
- [Part 4: Specialization vs Generalization](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/)
- [Part 5: From Research to Product](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-5/)

---

We have a trained SPLADE model sitting on a Modal volume (or grab it from [HuggingFace](https://huggingface.co/Qdrant/splade-ecommerce-esci)). Now comes the question that matters: is it actually better? In this part, we'll index products into Qdrant, run retrieval benchmarks, implement hard negative mining, and dig into what the model learned. Full evaluation code is in the [GitHub repo](https://github.com/qdrant-labs/finetune-ecommerce-search). To run this entire pipeline on your own data, see the [`sparse-finetune`](https://github.com/qdrant/sparse-finetune) CLI.

## Indexing Products in Qdrant

You need Qdrant 1.19 or later (Qdrant Cloud, or `docker run -p 6333:6333 qdrant/qdrant`) and `pip install "qdrant-client>=1.19" sentence-transformers`. Load the published model or your Part 2 checkpoint:

```python
from sentence_transformers import SparseEncoder

model = SparseEncoder("Qdrant/splade-ecommerce-esci")  # on Apple silicon, add device="cpu"
```

`products` is a list of dicts with `product_id`, `text` (built with `build_product_text` from Part 2), `title`, and `brand`.

Before we can evaluate, we need products in a searchable index. Qdrant's sparse vector support makes this straightforward:

```python
from qdrant_client import QdrantClient, models


def chunked(items, size):
    return (items[i:i + size] for i in range(0, len(items), size))


def index_products(model, products, collection_name="ecommerce_splade"):
    # QDRANT_URL and QDRANT_API_KEY: your Qdrant Cloud cluster URL and API key
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    if client.collection_exists(collection_name):
        client.delete_collection(collection_name)  # re-index from scratch, e.g. each mining round

    # Create collection with sparse vector config
    client.create_collection(
        collection_name=collection_name,
        vectors_config={},
        sparse_vectors_config={
            "text": models.SparseVectorParams(
                index=models.SparseIndexParams(memory=models.Memory.COLD)
            )
        },
    )

    # Encode and index in batches
    batch_size = 32
    for i, batch in enumerate(chunked(products, batch_size)):
        start = i * batch_size
        texts = [p["text"] for p in batch]
        embeddings = model.encode(texts)

        points = []
        for j, (product, emb) in enumerate(zip(batch, embeddings)):
            emb = emb.coalesce()  # encode() returns sparse tensors
            indices = emb.indices()[0].tolist()
            values = emb.values().tolist()

            points.append(models.PointStruct(
                id=start + j,  # Qdrant point IDs are integers or UUIDs
                vector={
                    "text": models.SparseVector(indices=indices, values=values)
                },
                payload={
                    "product_id": product["product_id"],
                    "text": product["text"],
                    "title": product["title"],
                    "brand": product["brand"],
                },
            ))

        last_batch = start + batch_size >= len(products)
        upsert_with_retry(client, collection_name, points, wait=last_batch)

    return client
```

A few production details:

- **`memory=models.Memory.COLD`** keeps the inverted index on disk instead of RAM and needs Qdrant and qdrant-client 1.19 or later. SPLADE product vectors average about 340 active terms, and across millions of products, this adds up. Requires SSD for acceptable latency.
- **`wait=False`** on upserts (inside `upsert_with_retry`) lets you pipeline batches without blocking. Call with `wait=True` on the final batch.
- **Retry with exponential backoff** for cloud databases. Network hiccups happen in production.

```python
import time

def upsert_with_retry(client, collection_name, points, max_retries=5, wait=False):
    """Upsert with exponential backoff."""
    for attempt in range(max_retries):
        try:
            client.upsert(collection_name=collection_name, points=points, wait=wait)
            return
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) + (attempt * 0.5)
            time.sleep(wait_time)
```

## Retrieval Metrics

We evaluate with standard information retrieval metrics on 2,000 test queries against 10,000 products:

- **nDCG@k**: Ranking quality with position bias; top results matter more
- **MRR@k**: How high the first relevant result appears
- **Recall@k**: What fraction of relevant products appear in top-k
- **Precision@k**: What fraction of top-k results are relevant

**nDCG@10** (Normalized Discounted Cumulative Gain) is the primary metric. It rewards putting highly relevant products (Exact matches) at the top and penalizes relevant results that appear lower in the ranking. A perfect score is 1.0; random ranking on this dataset gives roughly 0.001.

### Searching the Index

```python
def search_products(query, model, client, collection_name="ecommerce_splade", limit=10):
    query_embedding = model.encode(query).coalesce()

    results = client.query_points(
        collection_name=collection_name,
        query=models.SparseVector(
            indices=query_embedding.indices()[0].tolist(),
            values=query_embedding.values().tolist(),
        ),
        using="text",
        limit=limit,
    )

    return [
        {"id": r.id, "score": r.score, "title": r.payload["title"]}
        for r in results.points
    ]
```

Five lines from query string to ranked products. The sparse vector lookup in Qdrant's inverted index is fast. The bottleneck is the 10-20ms query encoding through the transformer.

## The Results

Here's what we found, evaluated on 2,000 test queries:

| Model | nDCG@10 | MRR@10 | vs BM25 |
|---|---|---|---|
| BM25 (baseline) | 0.333 | 0.332 | - |
| SPLADE (off-the-shelf) | 0.362 | 0.361 | +8.7% |
| **SPLADE (fine-tuned)** | **0.389** | **0.387** | **+16.8%** |

> **Note:** These metrics were measured on a subsample of 10,000 products and 2,000 queries. They are not directly comparable to official Amazon ESCI benchmarks and should be treated as a comparative signal only.

The fine-tuned model beats BM25 by nearly 17%. More telling: it beats the off-the-shelf SPLADE by 7.5%. The off-the-shelf model was trained on MS MARCO (web search queries), not e-commerce.

## ANCE-inspired Hard Negative Mining

{{< include "content/headless/sparse-embeddings-ecommerce/figures/ance-loop.html" >}}

The training in Part 2 used in-batch negatives: other products in the same batch serve as negatives for a given query. This works but has a limitation: random products are easy negatives. The model doesn't learn to distinguish between genuinely confusable products.

Inspired by [ANCE](https://arxiv.org/abs/2007.00808), this approach mines hard negatives from the current model's own retrieval results:

1. **Index** products into Qdrant with the current model
2. **Retrieve** top-K products for each query
3. **Filter** to non-relevant products; these are the hard negatives
4. **Train** on (query, positive, hard_negatives) triplets
5. **Repeat** with the updated model

Each round mines harder negatives as the model improves.

The idea: if the current model retrieves a product for a query but that product isn't relevant, it's a hard negative. The model thought it was relevant, so training on it teaches the model where its mistakes are.

### Mining Implementation

Run this block from the root of the research repository. `queries_with_positives` is a list of `{"query", "positive_ids", "positive_text"}` dicts.

```python
from src.qdrant.mining import SparseQdrantMiner

# Index products with current model
client = index_products(model, products, collection_name)

# Mine hard negatives
miner = SparseQdrantMiner(client, model, collection_name)
hard_neg_examples = miner.mine_for_training(
    queries=queries_with_positives,
    top_k=20,           # Consider top-20 results
    num_negatives=3,    # Keep 3 hardest negatives per query
)

# hard_neg_examples now contains:
# [{"anchor": "wireless earbuds",
#   "positive": "Sony WF-1000XM5 Earbuds...",
#   "negative": ["Generic Bluetooth Earbuds...", ...]}, ...]
```

In our measurements, sparse retrieval was sub-millisecond per query in Qdrant. The miner skips known positives so you don't accidentally treat a relevant product as a negative.

### When to Use ANCE-inspired Mining

This approach adds complexity. You need to:
1. Index products with the current model
2. Run retrieval for all training queries
3. Filter and format the results
4. Retrain with the augmented dataset
5. Optionally repeat

This adds an additional boost on top of basic training. Whether that's worth the engineering effort depends on your use case. For a product search system serving millions of queries, even a small nDCG improvement translates to meaningfully better user experience and conversion rates.

## What Fine-Tuning Actually Changes

Looking at the model's outputs before and after fine-tuning reveals what it learned:

**Query expansion improves:**
- "laptop" → adds "notebook", "computer", "macbook"
- "wireless earbuds" → adds "bluetooth", "airpods", "tws"

**Term weighting sharpens:**
- Brand names get higher weights (users searching "Sony headphones" want Sony)
- Generic terms get lower weights ("good", "best", "cheap")

**Domain vocabulary emerges:**
- E-commerce terms like "refurbished", "renewed", "bundle" get meaningful weights
- Web-search-specific terms get downweighted

This domain adaptation explains both the strong in-domain results and, as we'll see in Part 4, the tradeoffs when applying the model to other domains.

## Production Latency

A common concern: isn't running a transformer on every query slow?

| Step | Latency | Note |
|---|---|---|
| Query encoding (SPLADE) | 10-20ms | Bottleneck |
| Sparse retrieval (Qdrant) | <1ms | Negligible |
| **Total** | **10-20ms** | Real-time |

The retrieval itself is negligible. Qdrant's Rust + SIMD-optimized inverted index scans millions of posting lists in sub-millisecond time. All the latency is in the encoder, which runs once per query regardless of catalog size.

Optimization strategies if 15ms isn't fast enough:
- **Batch queries**: Encode multiple queries together (autocomplete, related searches)
- **Distillation**: Train a smaller encoder (TinyBERT, MiniLM) to mimic SPLADE's outputs
- **Caching**: Popular queries can be cached at the sparse vector level
- **GPU inference**: 5-10x speedup on high-traffic systems

For most e-commerce applications, 15ms is fine, especially when it delivers 17% better relevance.

## Clean Up

Delete the collection when you are done:

```python
client.delete_collection("ecommerce_splade")
```

## Key Takeaways

- **Fine-tuned SPLADE beats BM25 by 17% and off-the-shelf SPLADE by 7.5%.** Domain-specific training matters, even for sparse models.
- **Hard negative mining (ANCE-inspired) adds an additional boost** on top of basic training. Qdrant's sparse retrieval makes the mining step cheap.
- **Production latency is 10-20ms total.** Transformer encoding is the bottleneck, not retrieval.
- **The model learns domain-specific patterns**: query expansion, term weighting, and e-commerce vocabulary all improve with fine-tuning.

---

*Next: [Part 4 - Specialization vs Generalization](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/)*
