---
title: Hybrid Queries
short_description: "Combine dense, sparse, and multivector queries in Qdrant with hybrid search, weighted RRF tuning, DBSF, and FormulaQuery custom scoring."
description: "Run hybrid queries in Qdrant: fuse dense, sparse, and multivector results with RRF, DBSF, or FormulaQuery, and pick the right fusion method for your data."
weight: 15
aliases:
  - ../hybrid-queries
hideInSidebar: false
---

# Hybrid and Multi-Stage Queries

_Available as of v1.10.0_

With the introduction of [multiple named vectors per point](/documentation/manage-data/vectors/#named-vectors), there are use-cases when the best search is obtained by combining multiple queries,
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter, which enables making sub-requests.

Specifically, whenever a query has at least one prefetch, Qdrant will:

1. Perform the prefetch query (or queries),
2. Apply the main query over the results of its prefetch(es).

Additionally, prefetches can have prefetches themselves, so you can have nested prefetches.

<aside role="status">Using <code>offset</code> parameter only affects the main query. This means that the prefetches must have a <code>limit</code> of at least <code>limit + offset</code> of the main query, otherwise you can get an empty result.</aside>

## Hybrid Search

One of the most common problems when you have different representations of the same data is to combine the queried points for each representation into a single result.

{{< figure  src="/docs/fusion-idea.png" caption="Fusing results from multiple queries" width="80%" >}}

For example, in text search, it is often useful to combine dense and sparse vectors to get the best of both worlds: semantic understanding from dense vectors and precise word matching from sparse vectors.

Qdrant has a few ways of fusing the results from different queries: `rrf` and `dbsf`

### Reciprocal Rank Fusion (RRF)

<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">
RRF</a> considers the positions of results within each query and boosts those that appear closer to the top in multiple sets of results. The score of a document is calculated using its rank in each result set:

$$ score(d\in D) = \sum_{r_d\in R(d)} \frac{1}{k + \frac{r_d + 1}{w_r} - 1} $$

Where:
- $D$ the set of points across all results
- $R(d)$ is the set of rankings for a particular document
- $k$ is a constant (set to 2 by default)
- $r$ is an ordered set of results from one source
- $r_d$ is the rank of document $d$ in ranking $r$
- $w_r$ is the weight of ranking $r$ (set to 1 by default)

Because $w_r$ defaults to 1, without setting explicit weights, the formula can be simplified to the original RRF function:

$$ score(d\in D) = \sum_{r_d\in R(d)} \frac{1}{k + r_d} $$

Here is an example of RRF for a query containing two prefetches against different named vectors configured to hold sparse and dense vectors, respectively.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rrf/" >}}

#### Setting RRF Constant k
_Available as of v1.16.0_

To change the value of constant $k$ in the formula, use the dedicated `rrf` query.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rrf-k/" >}}

#### Weighted RRF
_Available as of v1.17.0_

By default, each query is assigned an equal weight. In reality, some queries are stronger, more discriminative, or more domain-specific than others. For example, a semantic search model understands meaning better than a simple keyword matcher. Assigning equal weight to both can cause the weaker model to negatively influence results, leading to a suboptimal search experience. To address this, you can assign greater weight to rankers that perform well.

The `rrf` query allows you to configure relative weights for each of the prefetches. For example, if you have two prefetches and assign a weight of 3.0 to the first and 1.0 to the second, a document ranked third in the first query scores the same as a document ranked first in the second query. In the case of non-overlapping result sets, these weights return three results from the first set for every one result from the second set.

Weights should be provided as an array of numbers, where each weight is applied to the corresponding prefetch in the order they are defined. The number of weights must match the number of prefetches.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rrf-weights/" >}}

Weights are a hyperparameter, not a free knob. A held-out eval is the most defensible way to set them.

- **With an eval set (queries paired with known-relevant docs):** split your eval queries in two. Search the weight space on the first half, then report metrics on the second half (held out from the search). Reporting on the same set you tuned on inflates the result. The [Choosing a Fusion Method notebook](https://githubtocolab.com/qdrant/examples/blob/master/fusion-methods/Choosing_a_Fusion_Method.ipynb) demonstrates this with a reusable `tune_rrf_weights` grid-search helper. Random search and Bayesian optimization (Optuna, hyperopt) work equally well for two-retriever fusion.
- **Without an eval set:** leave weights at the default `(1.0, 1.0)`. Hand-tuned weights without measurement are unlikely to beat the default reliably.

Retune when your retrievers change (new embedding model, new chunking), when your corpus drifts substantially, or on a fixed cadence with a fresh eval sample.

### Distribution-Based Score Fusion (DBSF)

_Available as of v1.11.0_

<a href=https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18 target="_blank">DBSF</a> keeps the raw scores from each query but normalizes their distributions before combining. For each retriever's returned set, it computes the mean $\mu$ and sample standard deviation $\sigma$, then linearly remaps every score using the 3-sigma extremes as endpoints:

$$ \hat{s} = \frac{s - (\mu - 3\sigma)}{6\sigma} $$

Normalized scores are summed across retrievers. Different score magnitudes no longer matter because each retriever contributes on the same comparable range.

<aside role="status"><code>dbsf</code> is stateless and computes its normalization limits from each query's returned points, not from all the scores it has seen. Scores are <strong>not</strong> clipped to [0, 1]; values outside the 3-sigma range remain outside it after the remap. If all returned scores are identical (or only one point is returned), DBSF emits <code>0.5</code> rather than dividing by zero.</aside>

DBSF is a reasonable choice when you trust your retrievers' raw scores to carry magnitude information. Weighted RRF tends to win when you have an eval set and can grid-search, but DBSF remains competitive on retrievers with well-calibrated score distributions. Two caveats apply: the statistics come from the prefetch top-k (a small sample), and a single dominant outlier in that top-k can skew normalization for that query. Increase the prefetch `limit` if you see unstable rankings.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-dbsf/" >}}

### Custom Fusion with FormulaQuery

_Available as of v1.14.0_

`FormulaQuery` lets you write the combining expression explicitly, using scores from prefetches (`$score`), payload fields, and built-in helpers like `ExpDecayExpression` or `GaussDecayExpression`. It is **not** a replacement for tuned weighted RRF. Writing `0.7 * $score[0] + 0.3 * $score[1]` over raw retriever scores reintroduces the same scale problem that breaks naive linear fusion. If the prefetches are themselves `rrf` or `dbsf`, the scores are already on comparable scales and a weighted formula sum works.

`FormulaQuery` is designed for layering ranking logic **on top of** a fused result: recency decay, popularity boosts, geo decay, or category-conditional multipliers. The canonical pattern is to fuse with RRF (or DBSF) in a prefetch, then wrap the prefetch in a `FormulaQuery` that uses `$score` and payload fields:

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-formula-decay/" >}}

<aside role="status">Calibrate the decay weight against the scale of your fused <code>$score</code>. RRF scores are small (sums of <code>1/(k+rank)</code> terms), while decay functions return values in <code>[0, 1]</code>, so an unweighted decay term will dominate the fused score unless you multiply it by a smaller coefficient. Wrap the decay in <code>MultExpression(mult=[w, ...])</code> with a <code>w</code> tuned to your workload.</aside>

The [Choosing a Fusion Method notebook](https://githubtocolab.com/qdrant/examples/blob/master/fusion-methods/Choosing_a_Fusion_Method.ipynb) shows this pattern end-to-end with exponential decay on a `published_at` payload field. For full `FormulaQuery` and decay function syntax, see the [Search Relevance reference](/documentation/search/search-relevance/).

### Choosing a Fusion Method

| If you have... | Use |
| --- | --- |
| Business logic to apply after fusion (recency, boosts, geo) | RRF or DBSF in a prefetch, wrapped in `FormulaQuery` |
| An eval set (queries with known-relevant docs) to tune on | Weighted RRF, with weights tuned on a train/val split |
| Trust in your retrievers' raw scores and no eval set | DBSF |
| Neither an eval set nor strong score priors | RRF (the safe default) |

For a deeper breakdown of when to prefer each, see the [FAQ on RRF vs. DBSF](/documentation/faq/qdrant-fundamentals/#when-should-i-use-reciprocal-rank-fusion-rrf-vs-distribution-based-score-fusion-dbsf-for-hybrid-search).

<aside role="status">A common request is "alpha-weighted linear combination of dense and sparse scores." This is unreliable without first normalizing the scores: dense (cosine, bounded) and sparse (BM25, unbounded) scores live on different scales that also shift per query, so a fixed alpha over raw scores tends to be dominated by whichever retriever has larger raw magnitudes on a given query. RRF sidesteps this by using ranks. DBSF sidesteps it by normalizing distributions. <code>FormulaQuery</code> can do it explicitly if you write the normalization yourself.</aside>


## Multi-stage queries

In general, larger vector representations give more accurate search results, but makes them more expensive to compute.

Splitting the search into two stages is a known technique to mitigate this effect:

- First, use a smaller and cheaper representation to get a large list of candidates.
- Then, re-score the candidates using the larger and more accurate representation.

There are a few ways to build search architectures around this idea:

- The quantized vectors as a first stage, and the full-precision vectors as a second stage.
- Leverage Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>) to generate candidate vectors with a shorter vector, and then refine them with a longer one.
- Use regular dense vectors to pre-fetch the candidates, and then re-score them with a multi-vector model like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>.

To get the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later with larger vectors.

<aside role="status">Disable the HNSW index for vectors used only for rescoring by setting <code>m=0</code> in the vector's HNSW configuration. Rescoring does not use the HNSW index, so disabling it will free up memory.</aside>

### Re-scoring examples

Fetch 1000 results using a shorter MRL byte vector, then re-score them using the full vector and get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring/" >}}

Fetch 100 results using the default vector, then re-score them using a multi-vector to get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multivector/" >}}

It is possible to combine all the above techniques in a single query:

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multistage/" >}}

## Grouping

_Available as of v1.11.0_

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

REST API ([Schema](https://api.qdrant.tech/master/api-reference/search/query-points-groups)):

{{< code-snippet path="/documentation/headless/snippets/query-groups/basic/" >}}

For more information on the `grouping` capabilities refer to the reference documentation for search with [grouping](/documentation/search/search/#search-groups) and [lookup](/documentation/search/search/#lookup-in-groups).
