---
title: Hybrid Queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases: 
  - ../hybrid-queries
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and Multi-Stage Queries

*Available as of v1.10.0*

With the introduction of [many named vectors per point](/documentation/concepts/vectors/#named-vectors), there are use-cases when the best search is obtained by combining multiple queries, 
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter, which enables making sub-requests.

Specifically, whenever a query has at least one prefetch, Qdrant will:
1. Perform the prefetch query (or queries),
2. Apply the main query over the results of its prefetch(es).

Additionally, prefetches can have prefetches themselves, so you can have nested prefetches.

## Hybrid Search

One of the most common problems when you have different representations of the same data is to combine the queried points for each representation into a single result.

{{< figure  src="/docs/fusion-idea.png" caption="Fusing results from multiple queries" width="80%" >}}

For example, in text search, it is often useful to combine dense and sparse vectors get the best of semantics,
plus the best of matching specific words.

Qdrant currently has two ways of combining the results from different queries:

- `rrf` - 
<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">
Reciprocal Rank Fusion
</a>

  Considers the positions of results within each query, and boosts the ones that appear closer to the top in multiple of them.
  
- `dbsf` - 
<a href=https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18 target="_blank">
Distribution-Based Score Fusion
</a> *(available as of v1.11.0)*

  Normalizes the scores of the points in each query, using the mean +/- the 3rd standard deviation as limits, and then sums the scores of the same point across different queries.
  
  <aside role="status"><code>dbsf</code> is stateless and calculates the normalization limits only based on the results of each query, not on all the scores that it has seen.</aside>

Here is an example of Reciprocal Rank Fusion for a query containing two prefetches against different named vectors configured to respectively hold sparse and dense vectors. 

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-basic/" >}}

## Multi-stage queries

In many cases, the usage of a larger vector representation gives more accurate search results, but it is also more expensive to compute.

Splitting the search into two stages is a known technique:

* First, use a smaller and cheaper representation to get a large list of candidates.
* Then, re-score the candidates using the larger and more accurate representation.

There are a few ways to build search architectures around this idea:

* The quantized vectors as a first stage, and the full-precision vectors as a second stage.
* Leverage Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>) to generate candidate vectors with a shorter vector, and then refine them with a longer one.
* Use regular dense vectors to pre-fetch the candidates, and then re-score them with a multi-vector model like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>.

To get the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later with larger vectors.

### Re-scoring examples

Fetch 1000 results using a shorter MRL byte vector, then re-score them using the full vector and get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring/" >}}

Fetch 100 results using the default vector, then re-score them using a multi-vector to get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multivector/" >}}

It is possible to combine all the above techniques in a single query:

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multistage/" >}}


## Re-ranking with payload values

The Query API can retrieve points not only by vector similarity but also by the content of the payload.

There are two ways to make use of the payload in the query:

* Apply filters to the payload fields, to only get the points that match the filter.
* Order the results by the payload field.

Let's see an example of when this might be useful:

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-with-payload/" >}}

In this example, we first fetch 10 points with the color `"red"` and then 10 points with the color `"green"`.
Then, we order the results by the price field.

This is how we can guarantee even sampling of both colors in the results and also get the cheapest ones first.
