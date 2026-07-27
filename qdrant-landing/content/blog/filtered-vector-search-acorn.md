---
draft: false
title: "Filtered Vector Search: What ACORN Fixes, and What Fixes ACORN"
slug: filtered-vector-search-acorn
short_description: "Benchmark four filtered vector search strategies in Qdrant: plain HNSW, ACORN, filterable HNSW, and query planning."
description: "Benchmark filtered vector search in Qdrant: how ACORN, filterable HNSW, and query planning trade recall against latency on one million points."
preview_image: /blog/filtered-vector-search-acorn/hero.jpg
social_preview_image: /blog/filtered-vector-search-acorn/hero.jpg
date: 2026-07-27
author: Dylan Couzon
featured: true
tags:
  - acorn
  - hnsw
  - filtered-search
  - benchmark
---

Filtered vector search breaks when metadata filters turn a healthy nearest-neighbor graph into scattered islands. HNSW's `m` parameter controls how many links each point gets; at Qdrant's default `m=16`, the collection we benchmark below averaged about 21 links per node on layer 0. Filter out 96% of the points and fewer than one link per node still passes, so traversal gets stranded before it reaches the true nearest matches.

Several search engines added ACORN variants between late 2024 and 2026, Qdrant among them. ACORN repairs a filter-blind HNSW graph at search time. Qdrant's filterable HNSW repairs the graph at index time, by adding edges for indexed payload values.

We benchmarked both approaches on the same engine and the same data, to see what each one catches that the other misses.

## The Two ACORN Variants

The [ACORN paper](https://arxiv.org/abs/2403.04871) (Patel et al., SIGMOD 2024) describes two algorithms. ACORN-gamma, renamed ACORN-W in the paper's latest revision, drives the headline claim of "2-1,000x higher throughput at a fixed recall," but it expands neighbor lists during index construction, and its reported build times run 8.8x to 33.1x slower than plain HNSW.

ACORN-1 is the lighter variant: build a standard HNSW graph, then check neighbors of neighbors at search time when the filter removes too many direct ones. That is the variant Qdrant ships, behind a selectivity gate that decides when it applies.

## The Graph Qdrant Builds Instead

Qdrant repairs the graph before the query ever arrives. [Filterable HNSW](/articles/filterable-hnsw/), described by our co-founder Andrey Vasnetsov back in 2019, builds the fix into the index: when a field has a [payload index](/documentation/manage-data/indexing/#payload-index), Qdrant adds extra HNSW edges between points that share a value in that field. A query filtering on that field keeps a connected graph to traverse. Those edges are paid for at build time: one million points indexed in 171 seconds without them and in 448 to 560 seconds with them.

There is a limit. Qdrant builds those edges per field, not for every combination. An `AND` filter creates an intersection that no single field's edges fully represent, and building edges for all combinations would not be practical.

ACORN covers that gap in Qdrant. Since [1.16](/blog/qdrant-1.16.x/), it has been one option behind the [query planner](/documentation/search/search/#query-planning), alongside full scan, retrieval straight from the payload index, and filterable HNSW.

## The Benchmark

We benchmarked four strategies on one million `deep-image-96` image vectors in Qdrant v1.18.2, with keyword filters from 20% down to 0.012% selectivity and recall@10 scored against exact brute force. Most filters are independent of the vectors; one 10% filter is correlated with them.

We compare four strategies over the same data. The plain graph checks the filter during traversal and discards points that fail; it is the control, with extra edges switched off. The second strategy forces ACORN on that same graph. The third is filterable HNSW.

The fourth is the planner on Qdrant's defaults, which stacks all three tools: extra edges, ACORN, and the payload-index fallback. All four are Qdrant on one machine, configured four ways; no other engine was measured. Latency is mean server-side query time. Full methodology and reproduction instructions are in the [reproduction kit](https://github.com/qdrant-labs/acorn-filterable-hnsw-benchmark).

Every number below was measured on Qdrant v1.18.2, July 27, 2026.

## Single Filters: Edges Beat the Patch

Recall@10 at `hnsw_ef=64`, with mean server-side latency. `hnsw_ef`, shortened to `ef` below, is the per-query search budget: how many candidates the search keeps in flight. Selectivity is the measured fraction of points passing the filter.

| Filter (selectivity) | Plain graph | Plain graph + ACORN | Filterable HNSW | Planner + ACORN |
|---|---|---|---|---|
| One keyword (20%) | 62.9% @ 1.6ms | 98.9% @ 4.4ms | 94.8% @ 1.2ms | 100% @ 10.9ms |
| One keyword (10%) | 20.6% @ 1.7ms | 98.1% @ 4.3ms | 99.0% @ 1.1ms | 99.9% @ 8.5ms |
| One keyword (1%) | 0.1% @ 1.6ms | 67.7% @ 4.7ms | 99.8% @ 1.0ms | 100% @ 1.5ms |
| Correlated (10%) | 88.4% @ 1.7ms | 98.6% @ 3.5ms | 99.0% @ 1.2ms | 99.9% @ 7.2ms |

The plain graph collapses as filters tighten. ACORN helps, but only up to a point: it pulls recall back at 2.1x to 2.9x plain-graph latency, then stalls at 67.7% on the 1% filter. That stall is a known ACORN-1 weakness, the one the [RACORN-1 follow-up paper](https://arxiv.org/abs/2607.00768) sets out to fix.

When extra edges exist, they solve the problem earlier and cheaper. They hold 99.0% to 99.8% recall on the 10%, 1%, and correlated 10% filters at 1.0ms to 1.2ms. ACORN gets close on two of those filters, but it needs 3.5ms to 4.7ms. Even correlation only lifts the plain graph from 20.6% to 88.4%, which still trails filterable HNSW.

{{< figure src="/blog/filtered-vector-search-acorn/single-filters.png" alt="Bar chart of recall at hnsw_ef=64 on four single-field filters, with each bar's mean server-side latency, comparing plain graph, plain graph with ACORN, and filterable HNSW." caption="Recall@10 and each bar's mean server-side latency at hnsw_ef=64 on the single-field filters. Extra edges hold the top recall at about 1ms; ACORN pays 3 to 4x that." width="100%" >}}

The 20% filter is the one case where ACORN finishes ahead of filterable HNSW, 98.9% against 94.8%. This field's value groups are big enough that the main graph keeps them connected, so Qdrant skips extra edges for it, and that connectivity alone does not deliver full recall at a small search budget. Recall still climbs from 62.9% to 94.8%, because edges built for the other fields densify the shared graph.

Once a query opts into ACORN, the planner applies it whenever the filter passes 40% of the points or fewer (the `max_selectivity` gate), and every filter here qualifies. That takes recall to 99.9% to 100%, at 7.7x to 9x filterable HNSW's latency on the uniform 10% and 20% filters. Skip the option and you get the filterable HNSW numbers.

## Double Filters: The Intersection Gap

The same four strategies at `hnsw_ef=64`, now with an `AND` filter over two keyword fields.

| Filter (selectivity) | Plain graph | Plain graph + ACORN | Filterable HNSW | Planner + ACORN |
|---|---|---|---|---|
| Two keywords (4%) | 0.1% @ 3.9ms | 95.2% @ 7.7ms | 63.7% @ 1.2ms | 99.9% @ 13.9ms |
| Two keywords (1%) | 0.0% @ 3.4ms | 72.7% @ 6.8ms | 70.8% @ 1.5ms | 100% @ 3.7ms |
| Two keywords (0.012%) | 0.5% @ 2.5ms | 0.6% @ 2.6ms | 1.8% @ 2.6ms | 100% @ 1.3ms |

The `AND` filter breaks the plain graph outright. At 1% it returned about 1.4 of the 10 requested points, and raising `ef` to 512 does not add a single one, because the traversal has already exhausted its disconnected island.

The 1% intersection is a tie. Both fields have full edge coverage, but their `AND` intersection does not. ACORN's 72.7% against filterable HNSW's 70.8% sits inside build-to-build noise: rebuilds at the same settings moved ACORN's recall between 70.7% and 74.1%.

The tie breaks when the search budget rises. At `ef=512`, filterable HNSW reaches 91.2% recall at 4.9ms, while ACORN needs 20.1ms to reach 90.3%. Spending a bigger search budget on a graph built for the filter is cheaper than repairing a filter-blind one at search time.

{{< figure src="/blog/filtered-vector-search-acorn/ef-sweep.png" alt="Recall versus server-side latency for four filtered-search strategies as hnsw_ef sweeps from 64 to 512." caption="Recall vs server-side latency on the 1% double filter, hnsw_ef swept from 64 to 512. Filterable HNSW reaches ACORN-level recall at roughly a quarter of the latency, while the planner holds 100% by switching strategy per query." width="100%" >}}

When neither field has extra edges, ACORN gets its clean win. That is the 4% intersection: both fields hold five values of 200k points, so neither earned extra edges, and the gap holds across the whole sweep, 99.6% against filterable HNSW's 92.5% at `ef=512`.

At 0.012%, the right move is to stop using the graph. With roughly 120 matching points in a million, the plain graph reaches 0.5%, ACORN reaches 0.6%, and filterable HNSW reaches 1.8%; all three sit on the graph only because the benchmark pins them there, where Qdrant's defaults would not. The planner uses the payload index instead and returns 100% recall at 1.3ms.

The planner changes the outcome before the graph fully collapses. On the 1% intersection, it sent 29 of the 500 queries to the graph and 471 to the payload index, reaching 100% recall at the 3.7ms mean shown before.

## Where ACORN Wins

The pattern is simple: ACORN wins when Qdrant had no extra edges for the queried field. That happened on two of the benchmark's seven payload fields, both with value groups too large for extra edges. On the five fields that did get those edges, ACORN never beat filterable HNSW by a defensible margin.

ACORN repairs the graph after filtering damages traversal, especially for oversized value groups and strict intersections. A [PostgreSQL study](https://arxiv.org/abs/2603.23710) shows the cost of that repair on a five-million-point OpenAI embedding set: 71.6K filter checks for ACORN at 1% selectivity against 2.6K for plain traversal.

Three questions decide filtered search quality: what the engine builds before the query arrives, what the search budget buys during traversal, and when the engine stops traversing altogether. ACORN answers part of the second one.

Qdrant answers all three: extra HNSW edges at index time, `ef` and opt-in ACORN at query time, and a planner that leaves the graph for the payload index when the filter is small enough to check directly. The [telemetry endpoint](/documentation/ops-monitoring/monitoring/) counts how many queries took each path, so you can see the split on your own workload.

The [reproduction kit](https://github.com/qdrant-labs/acorn-filterable-hnsw-benchmark) has the pinned image digest, dataset checksum, frozen queries, ground truth, and build receipts, so you can check those answers on your own machine. To talk through your filtered-search setup, [get in touch](https://qdrant.tech/contact-us/).
