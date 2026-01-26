---
title: Hybrid Queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases:
  - ../hybrid-queries
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and Multi-Stage Queries

_Available as of v1.10.0_

With the introduction of [multiple named vectors per point](/documentation/concepts/vectors/#named-vectors), there are use-cases when the best search is obtained by combining multiple queries,
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
RRF</a> considers the positions of results within each query, and boosts the ones that appear closer to the top in multiple sets of results.
 
The formula is simple, but needs access to the rank of each result in each query.

$$ score(d\in D) = \sum_{r_d\in R(d)} \frac{1}{k + r_d} $$

Where $D$ the set of points across all results, $R(d)$ is the set of rankings for a particular document, and $k$ is a constant (set to 2 by default).

Here is an example of RRF for a query containing two prefetches against different named vectors configured to hold sparse and dense vectors, respectively.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rrf/" >}}

#### Parametrized RRF
_Available as of v1.16.0_

To change the value of constant $k$ in the formula, use the dedicated `rrf` query variant.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rrf-k/" >}}


### Distribution-Based Score Fusion (DBSF)

_Available as of v1.11.0_
  
<a href=https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18 target="_blank">
DBSF</a> 
normalizes the scores of the points in each query, using the mean +/- the 3rd standard deviation as limits, and then sums the scores of the same point across different queries.

<aside role="status"><code>dbsf</code> is stateless and calculates the normalization limits only based on the results of each query, not on all the scores that it has seen.</aside>


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

For more information on the `grouping` capabilities refer to the reference documentation for search with [grouping](/documentation/concepts/search/#search-groups) and [lookup](/documentation/concepts/search/#lookup-in-groups).
