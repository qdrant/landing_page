---
title: "What a Second Retrieval Prefetch Buys"
short_description: "Adding a sparse prefetch to a dense one pays, but not for the reason everyone gives. Measured on five corpora, with the mechanism separated out."
description: "Measure what adding a second retrieval prefetch buys in Qdrant: the gain splits into reordering and new candidates, and only one of them pays."
preview_dir: /articles_data/what-a-second-retrieval-prefetch-buys/preview
social_preview_image: /articles_data/what-a-second-retrieval-prefetch-buys/preview/social_preview.jpg
weight: -213
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - hybrid search
  - dense and sparse retrieval
  - BM25
  - retrieval prefetch
  - search relevance
category: search-quality
---

Adding a sparse prefetch to a dense one sounds like an easy win. Dense retrieval matches meaning and fumbles exact strings. BM25 matches strings and misses paraphrase. Run both, catch what either one alone would drop, and quality should rise.

The first half is true. The second half is where the story breaks.

The second prefetch does find relevant documents the first one missed. The surprise is that those documents are not what improve the shipped ranking. The gain mostly comes from corroboration: two prefetches voting on documents already in the candidate set.

All the numbers below come from five public corpora of 5,183 to 100,000 documents, retrieved with one dense model, `sentence-transformers/all-MiniLM-L6-v2`, against Qdrant's core BM25, unquantized on a single shard. One model across arguments, products, source code, scientific claims and entities means a comparison between the two prefetches is really a comparison between one model and one domain, which is why this article asks what the second prefetch contributes rather than which kind of retrieval is better. Every gain carries a 95% bootstrap interval over per-query differences, and [sizing a labeled set](/articles/tuning-retrieval-what-to-check-first/) covers why that matters more than it looks.

## Neither Prefetch Owns the Corpus

Run each prefetch on its own, at candidate depth 200, and score the top 10.

| Corpus | Dense alone | Sparse alone | Both, fused | Over the better one |
|---|---|---|---|---|
| SciFact | 0.6239 | 0.6886 | 0.7175 | +0.0289 |
| ArguAna | 0.4905 | 0.4224 | 0.5216 | +0.0311 |
| WANDS | 0.6921 | 0.7098 | 0.7254 | +0.0156 |
| CodeSearchNet | 0.6299 | 0.5126 | 0.6555 | +0.0256 |
| DBPedia-entity | 0.4677 | 0.3857 | 0.4638 | -0.0039 |

Dense wins on three corpora. Sparse wins on two. Fusing beats the better of the two on four out of five.

DBPedia is the warning. The fused result is slightly worse than the dense prefetch by itself. A second prefetch is not free quality.

It is tempting to look for a corpus property that predicts the winner so you can skip the test. We looked. Vocabulary overlap between query and relevant document does not predict it: DBPedia has the second-highest overlap of the five at 0.743 and dense wins there by 0.082, while SciFact at 0.507 goes to sparse. Query length and the agreement between the two prefetches do not predict it either.

Run both on your own data.

## The Gain Comes From Voting

Fusing buys about +0.03. Only two mechanisms can pay for it.

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

Counting queries rather than averaging makes the same point harder. On CodeSearchNet, letting the sparse prefetch's exclusive documents into the list improves 10 queries and damages 128. On ArguAna it is 6 against 61, on WANDS 49 against 105, on DBPedia 21 against 63.

This is not an artifact of the default fusion setting. Run the same split under `k=61` and under DBSF and the new candidates still contribute between -0.001 and +0.004 on every corpus, while reordering moves between -0.007 and +0.054.

The gentler settings change the damage. `k=2` loses 0.013 on WANDS and CodeSearchNet by admitting those documents, and `k=61` and DBSF bring that to roughly zero. The largest gain any setting extracted from them was +0.004, on CodeSearchNet under DBSF.

A fusion setting can stop new candidates from hurting you at rank 10. None of them turns those documents into a gain worth the second index.

## The Missing Documents Are Real

The obvious reading is that the second prefetch retrieves junk. It does not.

Its exclusive documents include genuinely relevant ones, enough to move the metrics that judge a candidate set rather than a ranking. Relevant recall at depth 200 rises on every corpus once you take the union. So does the ceiling, meaning the nDCG@10 a perfect ranking of those candidates would score.

| Corpus | Relevant recall, leading | Union | Ceiling, leading | Union |
|---|---|---|---|---|
| SciFact | 0.940 | 0.982 | 0.941 | 0.982 |
| ArguAna | 0.983 | 0.997 | 0.983 | 0.997 |
| WANDS | 0.514 | 0.622 | 0.959 | 0.975 |
| CodeSearchNet | 0.921 | 0.949 | 0.921 | 0.949 |
| DBPedia-entity | 0.796 | 0.871 | 0.924 | 0.951 |

WANDS is the clearest case. Adding the second prefetch raises relevant recall from 0.514 to 0.622, a fifth more of the relevant products present in the candidate set. The fused score at rank 10 gets 0.016 of that, and the new documents contribute nothing.

So the second prefetch does three things. It finds documents the first one missed. It fails to get them into the top 10. It improves the top 10 anyway by voting on what was already there.

Only the third one shows up in your metric.

Two mechanisms explain the shortfall. Fusion under RRF reads rank and nothing else, so a document sitting at rank 1 in one list and absent from the other has one vote where its competitors have two, and agreement wins. And rank 10 is a fixed number of seats: a new document that takes one has to displace something, and at ten seats the incumbent is usually better.

The second mechanism is testable by moving the cutoff, and it holds up. Measure the same new-candidate contribution deeper and the loss shrinks or reverses: on SciFact it goes from +0.001 at rank 10 to +0.006 at rank 100, on DBPedia from -0.003 to +0.008.

## Add the Prefetch, Then Expect Headroom

Add the second prefetch. On four of five corpora it was worth +0.016 to +0.031 nDCG@10. On three of those, that is a larger gain than [tuning the fusion](/articles/how-to-tune-hybrid-search/) produced on the same corpus, which makes it the better of the two moves to make first. It costs a second index, a second vector per point, and 0.6 to 1.5 ms of query time on our single-shard measurements.

Then hold two expectations.

The gain arrives as corroboration, so it will be largest where the two prefetches disagree enough to be informative and still overlap enough to vote.

The recall you paid for is sitting in the candidate list at ranks 10 through 200, unclaimed. That is the same headroom [raising candidate depth](/articles/retrieval-candidate-depth-and-memory/) produces, and collecting it is what [a reranker](/articles/when-a-reranker-pays/) is for.

If the second prefetch makes things worse, as it did on DBPedia, check whether your metric depth matches your relevance structure before you remove it. A corpus with 38 relevant documents per query scored at rank 10 is a hard place for new candidates to prove themselves.

## The Expensive Choices Come Before Fusion

**The dense model sets the ceiling** for everything downstream. It needs a rebuild to change, which makes it the most expensive decision here and the first one worth getting right. [How to choose an embedding model](/articles/how-to-choose-an-embedding-model/) covers it.

**Core BM25 is the sparse default.** It needs `Modifier.IDF` on the vector and a correct `avg_len`, both of which are in [the pre-tuning audit](/articles/tuning-retrieval-what-to-check-first/) because both fail silently. It costs a second index and a second vector per point.

**Only if core BM25 underperforms on your vocabulary** are the learned sparse models worth the extra cost. [SPLADE](/documentation/fastembed/fastembed-splade/) and [miniCOIL](/documentation/fastembed/fastembed-minicoil/) run model inference on every document and every query, where BM25 is a term count. Domain vocabulary that a general model tokenizes badly is the case that justifies them.

**Only if you need the ceiling and have the storage** does [ColBERT](/documentation/fastembed/fastembed-colbert/) belong in the retrieval stage. It stores a vector per token: 9M MS MARCO passages at 128 dimensions need 286 GiB, against 54 GiB at 48 dimensions, and ColBERTv2's residual compression cuts a further 6 to 10x. Reranking with it keeps every byte of that and drops only the HNSW graph over those vectors, which is still [the stage where it earns its cost](/articles/when-a-reranker-pays/).

**Only if you are memory-bound** is truncating the embedding worth it. A Matryoshka model lets you keep the first m dimensions of each vector; on `nomic-embed-text-v1.5`, going from 768 dimensions to 256 costs 1.24 MTEB points and going to 64 costs 6.18. That is a quality knob turned the wrong way on purpose, in exchange for a vector a third or a twelfth of the size.

Related: [candidate depth and the memory budget](/articles/retrieval-candidate-depth-and-memory/) measures the same headroom from the retrieval side, and [when a reranker pays](/articles/when-a-reranker-pays/) is about the stage that collects it.

## Adjacent Work

- [Khattab and Zaharia (2020)](https://arxiv.org/abs/2004.12832) introduce ColBERT and report the storage figures used here, 286 GiB for 9M MS MARCO passages at 128 dimensions and 54 GiB at 48. [ColBERTv2](https://arxiv.org/abs/2112.01488) adds residual compression and cuts that by a further 6 to 10x.
- [Kusupati et al. (2022)](https://arxiv.org/abs/2205.13147) introduce Matryoshka representation learning, where the first m dimensions of one embedding are each about as accurate as a model trained natively at that size.
- The [nomic-embed-text-v1.5 model card](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) carries the MTEB average by dimension behind the truncation numbers: 62.28 at 768 dimensions, 61.04 at 256, and 56.10 at 64.
