---
title: "Module 6: Beyond Similarity (Bonus)"
short_description: "Bonus module of the Beginners course: the Qdrant features for better ranking, more variety, grouping, and search without a query."
description: "Match a search problem to the Qdrant feature that fixes it: score boosting, MMR diversity, reranking, grouping, relevance feedback, and discovery."
isLesson: true
weight: 70
---

{{< date >}} Module 6 {{< /date >}}

# Beyond Similarity

Modules 1 through 5 showed you how to design and build a complete retrieval pipeline. This bonus module covers the next layer: measuring and improving its results.

#### Overview

> You'll match common search problems to Qdrant features: score boosting and reranking for order, Maximal Marginal Relevance (MMR) for variety, grouping for one slot per document, and the Recommendation and Discovery APIs for searches from examples instead of text. You'll set up a way to measure relevance first, and pick up the trap that comes with each feature along the way.

## Today's Path

1. Find Your Problem
2. Measure First
3. Ranking: Score Boosting and Reranking
4. Diversity: MMR
5. Grouping: One Slot per Document
6. Searching From Examples and Feedback
7. Inspecting a Collection
8. Knowledge Check

## 1. Find Your Problem

Each row pairs a problem with the feature that addresses it, and names the stage of a query where it runs.

| Problem | Feature | Stage |
|---------|---------|-------|
| The right documents come back in the wrong order | [Score boosting](/documentation/search/search-relevance/#score-boosting) with a formula query | Rescore |
| The order should account for recency or distance | [Decay functions](/documentation/search/search-relevance/#decay-functions) inside the formula | Rescore |
| The accurate model is too slow to run over the whole collection | [Multi-stage query](/documentation/search/hybrid-queries/#multi-stage-queries) | Rescore |
| The top results are near-identical | [Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) | Select |
| One document fills the page with its own chunks | [Grouping](/documentation/search/search/#grouping-api) | Select |
| A better model, or user clicks, disagree with retrieval | [Relevance feedback](/documentation/search/search-relevance/#relevance-feedback) | Next query |
| There is no query text, only examples of good and bad | [Recommendation and Discovery APIs](/documentation/search/explore/#recommendation-api) | Replaces the query |

![One query drawn as three stages left to right. Retrieve, which is wide and cheap, holds prefetch, hybrid, and filters. Rescore, which runs over the candidates, holds score boosting, decay, and reranking. Select, which decides what fills the page, holds MMR and grouping.](/courses/beginners/module-6/pipeline.png)

## 2. Measure First

Ranking changes are hard to judge by eye, because a worse results page still looks like a list of plausible documents. Measure what you have before you change anything.

A golden set pairs queries with the documents that should come back for them. It turns a ranking change into a number.

Sample query and click pairs from your logs, or have someone who knows the domain write 20 or 30 queries with the answers they expect. [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/) covers both and computes the metrics with the Python library [`ranx`](https://amenra.github.io/ranx/).

Pick the metric that matches the labels you ended up with.

- `Recall@K`: the share of the relevant documents that reach the top K. Start here, since logs and a hand-written set both give you the binary labels it needs.
- `MRR` (Mean Reciprocal Rank): how high the first relevant document lands. Use it when the page shows a single answer, as in a chatbot.
- `NDCG@K` (Normalized Discounted Cumulative Gain): how closely the top K matches the best possible order. Use it once you have graded labels, such as 0, 1, and 2.

Measure a baseline at one K, change one thing, then measure the same metric at the same K.

## 3. Ranking: Score Boosting and Reranking

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

## 4. Diversity: MMR

Maximal Marginal Relevance (MMR) picks results one at a time, preferring candidates that match the query and differ from what it has already picked. In Qdrant it is a parameter on a nearest neighbors query, and `diversity` sets how much relevance it trades for variety.

The trap is `candidates_limit`. It defaults to the query's `limit`, which leaves MMR nothing spare to choose from, so all it can do is reorder the results it was already given. This is the most common reason MMR looks like it did nothing.

![Two rows over the same eight documents, drawn as five identical squares followed by a circle, a triangle, and a diamond. In the first row, candidates_limit equal to limit gives MMR a pool of only the first four squares, all four of which it selects, so the outcome is a reorder. In the second row, candidates_limit of 8 gives it the whole set, and it selects one square plus the circle, triangle, and diamond, leaving four squares unselected, so the outcome is a different set of documents.](/courses/beginners/module-6/mmr-pool.png)

- [Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr): both parameters, and the scores an MMR query returns.
- [The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf): the 1998 paper the `diversity` parameter implements.

## 5. Grouping: One Slot per Document

Chunking creates the neighbor problem: one long document becomes many points, and a strong match on it can fill the whole first page with its own chunks. [`query_points_groups`](/documentation/search/search/#grouping-api) groups results by a payload field and returns a set number of groups, so one document takes one slot.

`group_size` caps how many chunks come back inside each group, and `with_lookup` attaches a parent record from another collection.

Deduplicating the results yourself after the search does not fill the page. If the top 10 hits are all chunks from three documents, you are left with three results and no way to get more without searching again. Asking the server for 10 groups returns 10 documents the first time.

Strict mode is on by default in Qdrant Cloud, and it rejects grouping on a field with no payload index, returning a 400. The field most often missing one is `document_id`.

- [Grouping API](/documentation/search/search/#grouping-api): `group_by`, `group_size`, and `with_lookup`.
- [Multi-Representation Search](/documentation/tutorials-search-engineering/multi-representation-search/): storing one document as several points and grouping them back together.

## 6. Searching From Examples and Feedback

Some searches have no query text. A reader clicks "more like this", or an analyst has three documents that are right and two that are wrong and no words for what separates them.

The [Recommendation API](/documentation/search/explore/#recommendation-api) searches from positive and negative examples. The [Discovery API](/documentation/search/explore/#discovery-api) takes context pairs, where each pair names one region of the vector space to move toward and one to move away from.

When a better model or a click log disagrees with your ranking, [relevance feedback](/documentation/search/search-relevance/#relevance-feedback) folds that disagreement into the next query, across the whole collection. It needs a second model and three weights fitted to your own setup, so start with the tutorial below.

A point passed in by ID, whether as `example`, `positive`, `negative`, or a relevance feedback `target`, is left out of the results. Pass its raw vector instead to keep it eligible.

- [Recommendation API](/documentation/search/explore/#recommendation-api) and [Discovery API](/documentation/search/explore/#discovery-api): searching from examples and from context pairs.
- [Relevance Feedback](/documentation/search/search-relevance/#relevance-feedback): the query interface and what the `naive` strategy computes.
- [Relevance Feedback Retrieval in Qdrant](/documentation/tutorials-search-engineering/using-relevance-feedback/): fitting the weights and evaluating the result.

## 7. Inspecting a Collection

Two features for checking what you actually ingested.

| Feature | What it does |
|---------|--------------|
| [Facet counts](/documentation/manage-data/payload/#facet-counts) | Counts how many points hold each value of a payload field, which also shows how selective a filter would be. |
| [Random sampling](/documentation/search/search/#random-sampling) | Returns a random subset of a collection, for spot-checking ingested data. For a subset that repeats across queries, such as an evaluation set, use the [slice](/documentation/search/filtering/#slice) filter condition instead. |

## 8. Knowledge Check

<details>
<summary>You turn MMR on and your Recall@10 drops. Is MMR broken?</summary>

No. MMR spends result slots on documents further from the query, so a measure that only counts relevance goes down while the page stops repeating itself. Check what those slots held before: if they were eight versions of one story, the drop bought something your metric cannot see. If they were eight distinct relevant documents, lower `diversity`.

</details>

<details>
<summary>Your formula boosts newer articles on top of a hybrid query, and recency now decides every ranking. Why?</summary>

A decay term reaching 1.0 is the same size as the entire RRF score it is being added to, so it decides every comparison on its own. That ceiling rises with each extra prefetch, so measure your own fused scores rather than assuming 1.0.

</details>

<details>
<summary>You group results by <code>document_id</code> on a Qdrant Cloud cluster and the request returns a 400. What is missing?</summary>

A keyword payload index on `document_id`. Strict mode rejects the request without it, so the fix belongs on the field rather than in the query.

</details>

<details>
<summary>A reader clicks "more like this" on an article. You pass its point ID to the Recommendation API as a <code>positive</code> example, and the article itself never comes back. Is something broken?</summary>

No. A point passed in by ID is left out of the results, and here that is what you want, since the reader is already looking at it. When you do need it back, look the point up and pass its raw vector.

</details>

## Where to Go After the Course

- [Qdrant Essentials](/course/essentials/) goes deeper on HNSW tuning, quantization and rescoring, high-throughput ingestion, and the full Query API.
- [Multi-Vector Search](/course/multi-vector-search/) covers ColBERT and ColPali, including MaxSim scoring, pooling, and MUVERA indexing.
- [Qdrant Cloud](https://cloud.qdrant.io/) has a free cluster to run any of this on.
