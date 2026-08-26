---
title: "Pre-Filtering vs Post-Filtering (and Why Qdrant Does Neither)"
draft: false
slug: pre-filtering-vs-post-filtering
short_description: "Pre-filtering degrades into brute force and post-filtering can return nothing. Qdrant filters during graph traversal and routes per query."
description: "Compare pre-filtering vs post-filtering in vector search: where each breaks, how Qdrant filters in place, and when ACORN earns its cost."
preview_image: /blog/pre-filtering-vs-post-filtering/preview/preview.jpg
social_preview_image: /blog/pre-filtering-vs-post-filtering/preview/social_preview.jpg
title_preview_image: /blog/pre-filtering-vs-post-filtering/preview/title.jpg
date: 2026-08-07
author: Dylan Couzon
featured: false
tags:
  - vector-search
  - filtering
  - hnsw
  - acorn
---

Adding a metadata filter to vector search can make good results disappear without making the query look broken. It still runs fast, returns something, and keeps the dashboards quiet, while some of the true nearest matches drop out. In the benchmark behind this post, a broad-value filter lowers recall to 90.8% and an `AND` filter over two broad values lowers it to 39.7%, while every other filter shape stays above 97%.

The usual choice is between two strategies: pre-filtering, which applies the filter before the search, and post-filtering, which applies it after. That choice is simple at the extremes. The middle is the problem: a filter can match too many points for pre-filtering to stay cheap and too few for post-filtering to return anything.

## Where Each Strategy Works

Pre-filtering resolves the filter first: the engine computes the set of points that pass, usually as a mask over the whole collection, then searches within it. The filter is fully enforced, and scoring the matches directly makes the results exact for that subset. The cost grows fast: the mask touches every point, every match becomes a scoring candidate, and a broad filter degrades into brute force.

Post-filtering searches first and filters the returned candidates after the fact. The engine compensates with an over-fetch, asking the nearest-neighbor search for more results than the query requested. That works for lenient filters, where most candidates pass, but strict filters can discard the whole set. The hard part is sizing it: undershoot and you return too little, overshoot and you drift back toward the brute-force work the index was meant to avoid.

## What Qdrant Does Instead

Qdrant runs the filter inside the search. A query walks the HNSW graph (Hierarchical Navigable Small World), the linked index that lets a search hop between neighbors instead of scanning the whole collection. Every candidate the traversal reaches is checked against the filter in place, and points that fail are skipped instead of scored.

In-place filtering ties the cost to the traversal itself. It has one failure mode of its own: a strict filter leaves so few eligible points that the paths between them break, and the traversal dead-ends short of the best matches.

Qdrant makes in-place filtering hold up with two repairs.

- **[Filterable HNSW](/articles/filterable-hnsw/)** (2019): adds extra edges to the graph at index time between points that share a value in an indexed [payload field](/documentation/manage-data/indexing/#payload-index), so filtered queries keep connected paths to follow.
- **<a href="https://arxiv.org/abs/2403.04871" target="_blank">ACORN</a>** (2024): repairs the traversal at query time, reaching matches through neighbors that fail the filter.

Extra edges cover most filter shapes, but they skip two cases by design. We have [a full article](/articles/filtered-vector-search-acorn/) on that gap: a value shared by too many points gets no extra edges, and a big tenant or a popular category is exactly that. An `AND` filter has no edges of its own even when each of its fields does, so an `AND` over two broad values falls into the same gap.

The two failing shapes from the opening sit in that gap, and both recovered to 100% with ACORN on, measured in the article's default configuration.

## How Qdrant Routes a Filtered Query

Inside Qdrant, the [query planner](/documentation/search/search/#query-planning) settles the strategy question per query. It estimates how many points pass the filter and picks one of four paths: the filterable HNSW graph, the same graph with ACORN, the payload index directly, or a full scan. The payload-index path stays cheap because the index already lists which points match. On one `AND` filter from the article, matching 1% of points, 471 of 500 queries read the payload index while 29 walked the graph.

{{< figure src="/blog/pre-filtering-vs-post-filtering/query-routing.svg" alt="A filtered query flows into the query planner, which estimates how many points pass the filter and routes to the HNSW graph, holding extra edges and opt-in ACORN traversal, to the payload index, or to a full scan. The arrow to the payload index is tagged 471 of 500 and the arrow to the graph 29 of 500." caption="The four paths the planner picks from. The tagged counts are that 1% `AND` filter's routing split." width="100%" >}}

For a deeper pass on testing your own collection, see [the full article](/articles/filtered-vector-search-acorn/). It covers `exact: true` for brute-force ground truth and when [`acorn.enable`](/documentation/search/search/#acorn-search-algorithm) is worth turning on: a few times the latency when a query runs on the graph, almost nothing when the planner routes it to the payload index.

Engines split on this choice: [some post-filter, others pre-filter](/benchmarks/filtered-search-benchmark/), and the choice becomes part of their architecture. Qdrant made it a planning decision instead, settled per query. Filtering belongs inside the search, where the engine has enough context to pick the path.
