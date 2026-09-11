---
title: "Ranking: Score Boosting and Reranking"
short_description: "Bonus module of the Beginner Course: change result order with formula queries and cross-encoders."
description: "Two ways to change result order: rescore candidates with a formula query and decay functions, or reorder a shortlist with a cross-encoder reranker."
weight: 4
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Ranking: Score Boosting and Reranking

Two ways to change the order when the right documents are already coming back.

### Score Boosting

Similarity is not always the final ranking signal. A result may be relevant, but you may still want to prefer an exact title match, a nearby store, or a recent article. A [formula query](/documentation/search/search-relevance/#score-boosting) lets you rescore the candidates returned by retrieval, combining their similarity score with payload values and conditions you define.

A formula only runs as a rescoring step. With no prefetch under it to supply candidates, the request fails with `cannot apply Formula without prefetches`.

[Decay functions](/documentation/search/search-relevance/#decay-functions) turn a value such as age or distance into a score from 0 to 1. Newer or closer items get a higher score; older or farther items get a lower one.

On a hybrid query, a decay score can overwhelm RRF: when two retrievers agree, the top result has an RRF score of 1.0. Print your fused scores, then scale the decay coefficient to match them.

### Reranking

A reranker reorders a shortlist with a slower, more accurate model. It reads the query and one document together, rather than comparing two vectors computed separately, which is what makes it both more accurate and too expensive to run over a whole collection.

Reranking can only reorder what retrieval already returned. Check the right answers reach the shortlist before you add one. When they are missing, the fix belongs in retrieval.

The model scores text rather than vectors, so you run it yourself, on the shortlist Qdrant returned. FastEmbed provides `TextCrossEncoder` for it. When the more accurate scorer is another vector instead, Qdrant can do the rescoring itself with a [multi-stage query](/documentation/search/hybrid-queries/#multi-stage-queries).

Shortlist size is the cost knob, because the model runs once per candidate: tens of candidates stay cheap, and hundreds do not. `Xenova/ms-marco-MiniLM-L-6-v2` is an 80 MB reranker available through FastEmbed, small enough to find out whether reranking helps you at all.

- [Multi-Stage Queries](/documentation/search/hybrid-queries/#multi-stage-queries): the prefetch and rescore syntax, in every client language.
- [Reranking with FastEmbed](/documentation/fastembed/fastembed-rerankers/): running a cross-encoder over the shortlist, with a worked example.
- [Hybrid Search with Qdrant's Query API](/articles/hybrid-search/): fusion and reranking as competing designs, with the reasoning behind the Query API.
