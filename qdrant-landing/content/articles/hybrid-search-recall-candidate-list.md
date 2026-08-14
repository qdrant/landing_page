---
title: "Your Hybrid Search Is Leaving Recall in the Candidate List"
short_description: "Your second prefetch retrieves relevant documents that your top 10 never shows. We measured the two mechanisms separately across five datasets."
description: "Measure what a second prefetch buys in Qdrant hybrid search: the gain comes from reordering, and the extra recall sits unused below rank 10."
preview_dir: /articles_data/hybrid-search-recall-candidate-list/preview
social_preview_image: /articles_data/hybrid-search-recall-candidate-list/preview/social_preview.jpg
weight: -212
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-10T00:00:00+03:00
draft: false
keywords:
  - hybrid search
  - dense and sparse retrieval
  - BM25
  - retrieval prefetch
  - search relevance
category: search-quality
---

You run a dense prefetch and a sparse one, fused into a single ranking. It beat either prefetch alone by a few points of `nDCG@10`, then stopped improving.

Coverage is the argument for that setup. Dense retrieval matches meaning and can miss an exact string. BM25 matches strings and can miss a paraphrase. Run both, and you catch what either one alone would drop.

The coverage is real. The second prefetch retrieves relevant documents that the first never returned. At rank 10, though, those documents were worth between -0.013 and +0.001 `nDCG@10` across five datasets. On four, they cost more than they paid.

The numbers below come from five public datasets of 5,183 to 100,000 documents. Each ran unquantized on one shard, with `sentence-transformers/all-MiniLM-L6-v2` for dense retrieval and Qdrant's core BM25 for sparse retrieval.

One dense model across arguments, products, source code, scientific claims, and entities cannot settle dense versus sparse retrieval in general. This experiment asks a narrower question: what did a second prefetch contribute to one stack across five domains? Every gain has a 95% interval from resampling per-query differences. [Building a labeled set](/articles/before-tuning-a-qdrant-collection/) explains why that matters.

## The Request These Numbers Describe

One call, two prefetches against named vectors, and one fusion over both:

```python
import os

from qdrant_client import QdrantClient, models

# Both queries must come from the models the collection was indexed with.
from your_embedding_setup import dense_query, sparse_query

# Use the Qdrant Cloud client your service already configures.
client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key=os.environ["QDRANT_API_KEY"],
)

response = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(query=dense_query, using="dense", limit=200),
        models.Prefetch(query=sparse_query, using="bm25", limit=200),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

Two fusion methods merge those lists. Reciprocal Rank Fusion (RRF), the default here, merges by each document's position in each list. Distribution-based score fusion (DBSF) merges by normalized score. [The hybrid-search guide](/documentation/search/text-search/hybrid-search/) has the request shape and [the fusion guide](/articles/how-to-tune-hybrid-search/) covers the choice between them.

## A Second Prefetch Does Not Always Improve the Top 10

Run each prefetch on its own with `limit=200`, then score the top 10 with `nDCG@10`. The metric gives more credit to relevant documents near the top. [Choosing a metric](/articles/before-tuning-a-qdrant-collection/#choose-a-metric-before-you-tune) covers when to use it.

| Dataset | Dense alone | Sparse alone | Both, fused | Over the better one |
|---|---|---|---|---|
| SciFact | 0.6239 | 0.6886 | 0.7175 | +0.0289 |
| ArguAna | 0.4905 | 0.4224 | 0.5216 | +0.0311 |
| WANDS | 0.6921 | 0.7098 | 0.7254 | +0.0156 |
| CodeSearchNet | 0.6299 | 0.5126 | 0.6555 | +0.0256 |
| DBPedia-entity | 0.4677 | 0.3857 | 0.4638 | -0.0039 |

DBPedia-entity is the row to read first. Its fused ranking is worse than the dense prefetch alone, although the request returns normally and scores look ordinary. Only a labeled comparison of the fused result with each prefetch reveals the loss.

On the other four, fusion beats the better prefetch. Dense retrieval wins alone on three datasets and sparse retrieval on two. Which prefetch carries your search depends on your data.

None of the dataset properties we tested predicts the winner. DBPedia has the second-highest vocabulary overlap between a query and its relevant documents, at 0.743, yet dense retrieval wins there by 0.082. SciFact has 0.507 overlap, and sparse retrieval wins. Query length and agreement between the two prefetches do not predict it either.

Run both on your own data.

## Most of the Gain Comes From Reordering

Fusion adds about +0.03 `nDCG@10` in the four positive cases here. It can help in two ways.

It can introduce documents the second prefetch found alone, or reorder documents the first prefetch already returned.

Those effects are separable. Hold one prefetch fixed, then remove from the fused ranking every document it did not retrieve. What remains is that prefetch's 200 candidates, reordered by the fused score. Comparing that ranking with the prefetch alone separates reordering from the second prefetch's exclusive documents.

| Dataset | Leading prefetch | From reordering | From new candidates |
|---|---|---|---|
| SciFact | sparse, 0.689 | +0.028 | +0.001 |
| ArguAna | dense, 0.491 | +0.032 | -0.001 |
| WANDS | sparse, 0.710 | +0.029 | -0.013 |
| CodeSearchNet | dense, 0.630 | +0.039 | -0.013 |
| DBPedia-entity | dense, 0.468 | -0.001 | -0.003 |

Reordering accounts for the measured gain. The documents the second prefetch alone contributed are worth between -0.013 and +0.001. On four of the five datasets, they are a net loss at rank 10.

The same pattern holds in the other direction. When we held the weaker prefetch fixed and admitted the stronger prefetch's exclusive documents, reordering carried the result in nine of 10 dataset-and-direction comparisons, by +0.028 to +0.103. The exception was DBPedia holding dense, where reordering was worth -0.001 and new candidates -0.003. Fusion loses there from either direction.

The query-level outcomes are harsher than the averages. On CodeSearchNet, letting the sparse prefetch's exclusive documents into the list improves 10 queries and damages 128. The counts are 6 against 61 on ArguAna, 49 against 105 on WANDS, and 21 against 63 on DBPedia.

The split survives other fusion settings. RRF's constant `k` controls how much more a high-ranked document contributes than one lower in the list. [Tuning fusion](/articles/how-to-tune-hybrid-search/) covers it alongside DBSF. At `k=61` and under DBSF, new candidates still contribute between -0.001 and +0.004 on every dataset. Reordering moves between -0.007 and +0.054.

The less top-heavy settings reduce the damage. With `k=2`, admitting those documents loses 0.013 on WANDS and CodeSearchNet. `k=61` and DBSF bring that close to zero. The largest gain any setting extracted was +0.004 on CodeSearchNet under DBSF.

A fusion setting can stop new candidates from hurting you at rank 10. None of them turns those documents into a gain worth the second index.

## The Extra Candidates Raise Recall, Not the Current Score

The second prefetch's exclusive documents include relevant ones that stop below the cutoff. They raise metrics that assess the candidate set rather than its current ranking. `Recall@200` rises on every dataset once you take the union, as does the best possible `nDCG@10` from those candidates.

| Dataset | Recall@200, Leading Prefetch | Union | Best Possible nDCG@10, Leading Prefetch | Union |
|---|---|---|---|---|
| SciFact | 0.940 | 0.982 | 0.941 | 0.982 |
| ArguAna | 0.983 | 0.997 | 0.983 | 0.997 |
| WANDS | 0.514 | 0.622 | 0.959 | 0.975 |
| CodeSearchNet | 0.921 | 0.949 | 0.921 | 0.949 |
| DBPedia-entity | 0.796 | 0.871 | 0.924 | 0.951 |

WANDS is the clearest case. Adding the second prefetch raises `Recall@200` from 0.514 to 0.622, a 21% relative increase in relevant products in the candidate set. Its fused `nDCG@10` improves by 0.016, while the new documents themselves contribute nothing at rank 10.

The second prefetch finds documents the first one missed, but many stop below the top 10. Its reliable top-10 gain comes from changing the order of documents already present.

RRF uses rank, not score magnitude. A document at rank 1 in one prefetch and absent from the other contributes once, while a document both prefetches return contributes twice. At rank 10, each new document also displaces an existing result.

The cutoff effect is testable. At deeper cutoffs, the loss from new candidates shrinks or reverses: on SciFact, it moves from +0.001 at rank 10 to +0.006 at rank 100; on DBPedia, from -0.003 to +0.008.

## Put the Extra Recall to Work

On four of five datasets, the second prefetch was worth +0.016 to +0.031 `nDCG@10`. On three, that was a larger gain than [tuning fusion](/articles/how-to-tune-hybrid-search/) produced on the same dataset. It costs a second index, a second vector per point, and 0.6 to 1.5 ms of query time in our single-shard measurements. Score it against your better prefetch on labeled queries, and keep it only if that gain survives. It would not have survived on DBPedia.

Nothing we measured predicts the size of the gain from agreement between the two prefetches. CodeSearchNet has the lowest agreement of the five at 0.418 and the largest reordering gain; DBPedia has the highest at 0.901 and no gain. Score it on your own labels.

The second prefetch's extra recall sits at ranks 10 through 200. [Candidate depth](/articles/candidate-depth/) can enlarge that candidate set. If a reranker earns its latency cost on your labels, it can reorder the candidates into results.

If the second prefetch makes things worse, as it did on DBPedia, check whether your metric depth matches your relevance structure before you remove it. A dataset with 38 relevant documents per query, scored at rank 10, gives new candidates little room to prove themselves.

## When the Retrieval Stack Has Hit Its Limit

The moves below need a rebuild or a new index. Consider them after lower-cost tuning when the candidate set is still missing documents your labels require. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) put them at the end of the cost order.

**Change the dense model only after cheaper stages are exhausted.** It requires regenerating every dense vector and rebuilding its index. Consider it when the dense prefetch misses documents your labels require. [How to choose an embedding model](/articles/how-to-choose-an-embedding-model/) covers the choice.

**Core BM25 is Qdrant's built-in sparse model.** It needs `Modifier.IDF` on the vector and a correct `avg_len`. [The pre-tuning audit](/articles/before-tuning-a-qdrant-collection/) covers both checks, while [sparse vectors](/documentation/manage-data/vectors/#sparse-vectors) and [hybrid search](/documentation/search/text-search/hybrid-search/) cover the configuration. It costs a second index and a second vector per point.

**Only if core BM25 underperforms on your labeled queries** are learned sparse models worth the extra cost. [SPLADE](/documentation/fastembed/fastembed-splade/) and [miniCOIL](/documentation/fastembed/fastembed-minicoil/) run model inference on every document and query, while BM25 counts terms.

**Only if you need maximum retrieval quality and have the storage** does [ColBERT](/documentation/fastembed/fastembed-colbert/) belong in the retrieval stage, because it stores a vector per token. [The reranking article](/articles/when-a-reranker-is-worth-it/) covers the stage where it earns its cost.

**Only if you are memory-bound** is truncating the embedding worth it. A [Matryoshka model](https://arxiv.org/abs/2205.13147) lets you keep the first m dimensions of each vector. On [`nomic-embed-text-v1.5`](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5), going from 768 dimensions to 256 costs 1.24 MTEB points, and going to 64 costs 6.18. You make that quality trade in exchange for a vector a third or a twelfth of the size.
