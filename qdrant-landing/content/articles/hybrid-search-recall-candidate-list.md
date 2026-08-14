---
title: "Your Hybrid Search Is Leaving Recall in the Candidate List"
short_description: "Your second prefetch retrieves relevant documents that your top 10 never shows. We measured the two mechanisms separately across five corpora."
description: "Measure what a second prefetch buys in Qdrant hybrid search: the gain comes from reordering, and the extra recall sits unused below rank 10."
preview_dir: /articles_data/hybrid-search-recall-candidate-list/preview
social_preview_image: /articles_data/hybrid-search-recall-candidate-list/preview/social_preview.jpg
weight: -213
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

You run a dense prefetch and a sparse one, fused into a single ranking. When you tested that setup, it beat either prefetch alone by a couple of points of nDCG@10. That is about where it has stayed.

Coverage is the argument for that setup. Dense retrieval matches meaning and can miss an exact string. BM25 matches strings and can miss a paraphrase. Run both, and you catch what either one alone would drop.

The coverage is real. The second prefetch does retrieve relevant documents the first one never returned. Those documents stop short of your top 10: measured across five corpora, they are worth between -0.013 and +0.001 nDCG@10, and on four of the five they cost more than they pay.

The numbers below come from five public corpora of 5,183 to 100,000 documents. Each ran unquantized on one shard, with `sentence-transformers/all-MiniLM-L6-v2` for dense retrieval and Qdrant's core BM25 for sparse retrieval.

One dense model across arguments, products, source code, scientific claims, and entities cannot settle dense versus sparse retrieval in general. The experiment asks a narrower question: what did a second prefetch contribute to one stack across five domains? Every gain carries a 95% interval from resampling per-query differences, and [building a labeled set](/articles/before-tuning-a-qdrant-collection/) covers why that matters.

## The Request These Numbers Describe

One call, two prefetches each against its own named vector, one fusion over both:

```python
from qdrant_client import QdrantClient, models

# Both queries must come from the models the collection was indexed with.
from your_embedding_setup import dense_query, sparse_query

client = QdrantClient(url="http://localhost:6333")

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

## Fusing Costs Quality on One Corpus of Five

Run each prefetch on its own at candidate depth 200, then score the top 10 with nDCG@10. The metric gives more credit to relevant documents near the top; [choosing a metric](/articles/before-tuning-a-qdrant-collection/#choose-a-metric-before-you-tune) covers when to use it.

| Corpus | Dense alone | Sparse alone | Both, fused | Over the better one |
|---|---|---|---|---|
| SciFact | 0.6239 | 0.6886 | 0.7175 | +0.0289 |
| ArguAna | 0.4905 | 0.4224 | 0.5216 | +0.0311 |
| WANDS | 0.6921 | 0.7098 | 0.7254 | +0.0156 |
| CodeSearchNet | 0.6299 | 0.5126 | 0.6555 | +0.0256 |
| DBPedia-entity | 0.4677 | 0.3857 | 0.4638 | -0.0039 |

DBPedia-entity is the row to read first. Fusing there returns a worse ranking than the dense prefetch alone, and the response looks healthy the whole time: results come back, the scores are in their usual range, and the metric sits a fraction below what one prefetch would have given you. Scoring the fusion against each prefetch alone on labeled queries is what surfaces it.

On the other four, fusing beats the better of the two prefetches. Dense wins alone on three corpora and sparse on two, so which prefetch carries your search is a property of your data.

No corpus property we tested predicts the winner. DBPedia has the second-highest vocabulary overlap between query and relevant document, at 0.743, and dense wins there by 0.082. SciFact has 0.507 overlap and goes to sparse. Query length and agreement between the two prefetches fail the same test.

Run both on your own data.

## Most of the Gain Comes From Agreement

Fusing buys about +0.03 nDCG@10 in the four positive cases here. The gain comes from exactly two places.

The first is discovery: documents the second prefetch alone retrieved. The second is voting: a better ordering of documents the first prefetch already had.

Those are separable. Hold one prefetch fixed and take the fused ranking, then delete every document the held prefetch never retrieved. What remains is exactly that prefetch's own 200 candidates, reordered by the fused score. Score that, and the gain splits in two.

| Corpus | Leading prefetch | From reordering | From new candidates |
|---|---|---|---|
| SciFact | sparse, 0.689 | +0.028 | +0.001 |
| ArguAna | dense, 0.491 | +0.032 | -0.001 |
| WANDS | sparse, 0.710 | +0.029 | -0.013 |
| CodeSearchNet | dense, 0.630 | +0.039 | -0.013 |
| DBPedia-entity | dense, 0.468 | -0.001 | -0.003 |

Reordering is the entire gain. The documents the second prefetch alone contributed are worth between -0.013 and +0.001. On four of the five corpora, they are a net loss at rank 10.

The same split holds in the other direction. Hold the weaker prefetch and admit the stronger one's exclusive documents: reordering carries the gain in nine of the ten corpus and direction cells, by between +0.028 and +0.103. The tenth is DBPedia holding dense, where reordering is worth -0.001 and the new candidates -0.003. That is the corpus fusing loses on from either direction.

The query-level outcomes are harsher than the averages. On CodeSearchNet, letting the sparse prefetch's exclusive documents into the list improves 10 queries and damages 128. The counts are 6 against 61 on ArguAna, 49 against 105 on WANDS, and 21 against 63 on DBPedia.

The split survives other fusion settings. RRF's constant `k` sets how steeply the top of each list outranks its tail, and [tuning fusion](/articles/how-to-tune-hybrid-search/) covers it alongside DBSF. At the flat end of that range, `k=61`, and under DBSF, new candidates still contribute between -0.001 and +0.004 on every corpus. Reordering moves between -0.007 and +0.054.

The gentler settings change the damage. `k=2` loses 0.013 on WANDS and CodeSearchNet by admitting those documents, and `k=61` and DBSF bring that to roughly zero. The largest gain any setting extracted from them was +0.004, on CodeSearchNet under DBSF.

A fusion setting can stop new candidates from hurting you at rank 10. None of them turns those documents into a gain worth the second index.

## The Extra Candidates Still Matter

The second prefetch's exclusive documents include genuinely relevant ones, stranded below the cutoff. They move the metrics that judge a candidate set instead of its current ranking. Relevant recall at depth 200 rises on every corpus once you take the union, as does the best nDCG@10 a perfect ranking of those candidates could achieve.

| Corpus | Relevant Recall, Leading | Union | Best Possible nDCG@10, Leading | Union |
|---|---|---|---|---|
| SciFact | 0.940 | 0.982 | 0.941 | 0.982 |
| ArguAna | 0.983 | 0.997 | 0.983 | 0.997 |
| WANDS | 0.514 | 0.622 | 0.959 | 0.975 |
| CodeSearchNet | 0.921 | 0.949 | 0.921 | 0.949 |
| DBPedia-entity | 0.796 | 0.871 | 0.924 | 0.951 |

WANDS is the clearest case. Adding the second prefetch raises relevant recall from 0.514 to 0.622, a fifth more of the relevant products present in the candidate set. The fused score at rank 10 gets 0.016 of that, and the new documents contribute nothing.

The second prefetch finds documents the first one missed, but many stop below the top 10. Its reliable top-10 gain comes from corroborating documents that were already present.

Two mechanisms explain the shortfall. Fusion under RRF reads rank and nothing else, so a document sitting at rank 1 in one list and absent from the other has one vote where its competitors have two, and agreement wins. And rank 10 is a fixed number of seats: a new document that takes one has to displace something, and at ten seats the incumbent is usually better.

The second mechanism is testable by moving the cutoff, and it holds up. Measure the same new-candidate contribution deeper and the loss shrinks or reverses: on SciFact it goes from +0.001 at rank 10 to +0.006 at rank 100, on DBPedia from -0.003 to +0.008.

## Go Collect the Recall You Paid For

On four of five corpora, the second prefetch was worth +0.016 to +0.031 nDCG@10. On three of those, that is a larger gain than [tuning the fusion](/articles/how-to-tune-hybrid-search/) produced on the same corpus. It costs a second index, a second vector per point, and 0.6 to 1.5 ms of query time in our single-shard measurements. Score it against your better prefetch on labeled queries and keep it on that evidence. On DBPedia it would not have survived.

The gain arrives as corroboration rather than as new documents, and nothing we measured predicts its size from how much the two prefetches agree. CodeSearchNet has the lowest agreement of the five at 0.418 and the largest reordering gain; DBPedia has the highest at 0.901 and no gain at all. Score it on your own labels.

The recall you paid for is sitting in the candidate list at ranks 10 through 200, and your current ranking leaves it there. [Raising candidate depth](/articles/candidate-depth/) makes that pool larger, and [a reranker](/articles/when-a-reranker-is-worth-it/) is the stage that can turn it into a result.

If the second prefetch makes things worse, as it did on DBPedia, check whether your metric depth matches your relevance structure before you remove it. A corpus with 38 relevant documents per query scored at rank 10 is a hard place for new candidates to prove themselves.

## When the Retrieval Stack Has Hit Its Limit

The moves below all need a rebuild or a new index, so they come after the free tuning, not before it. Reach for them once fusion, depth, and reranking are tuned and the candidate set is still missing the documents you need. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) carry the cost order these sit at the bottom of.

**The dense model sets the upper bound** for everything downstream. Nothing later in the pipeline recovers what it failed to retrieve, which is what makes it worth reopening once the cheaper stages are exhausted. [How to choose an embedding model](/articles/how-to-choose-an-embedding-model/) covers it.

**Core BM25 is the sparse default.** It needs `Modifier.IDF` on the vector and a correct `avg_len`, both of which are in [the pre-tuning audit](/articles/before-tuning-a-qdrant-collection/) because both fail silently. [Sparse vectors](/documentation/manage-data/vectors/#sparse-vectors) and [hybrid search](/documentation/search/text-search/hybrid-search/) cover the configuration. It costs a second index and a second vector per point.

**Only if core BM25 underperforms on your vocabulary** are learned sparse models worth the extra cost. [SPLADE](/documentation/fastembed/fastembed-splade/) and [miniCOIL](/documentation/fastembed/fastembed-minicoil/) run model inference on every document and query, while BM25 counts terms. Domain vocabulary that a general model tokenizes badly is the case that justifies them.

**Only if you need maximum retrieval quality and have the storage** does [ColBERT](/documentation/fastembed/fastembed-colbert/) belong in the retrieval stage, because it stores a vector per token. [The reranking article](/articles/when-a-reranker-is-worth-it/) has its storage numbers and the stage where it earns that cost.

**Only if you are memory-bound** is truncating the embedding worth it. A Matryoshka model lets you keep the first m dimensions of each vector; on `nomic-embed-text-v1.5`, going from 768 dimensions to 256 costs 1.24 MTEB points and going to 64 costs 6.18. That is a quality knob turned the wrong way on purpose, in exchange for a vector a third or a twelfth of the size.

## Adjacent Work

- [Kusupati et al. (2022)](https://arxiv.org/abs/2205.13147) introduce Matryoshka representation learning, where the first m dimensions of one embedding are each about as accurate as a model trained natively at that size.
- The [nomic-embed-text-v1.5 model card](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) carries the MTEB average by dimension behind the truncation numbers: 62.28 at 768 dimensions, 61.04 at 256, and 56.10 at 64.
