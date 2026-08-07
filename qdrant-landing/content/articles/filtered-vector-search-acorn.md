---
title: "Filtered Vector Search: What ACORN Fixes, and What Fixes ACORN"
short_description: "ACORN patches a filter-blind HNSW graph at query time. Extra edges repair it at index time. We benchmarked both in Qdrant on one million points."
description: "Benchmark filtered vector search in Qdrant: how ACORN, filterable HNSW, and query planning trade recall for latency on one million points."
social_preview_image: /articles_data/filtered-vector-search-acorn/preview/social_preview.jpg
preview_dir: /articles_data/filtered-vector-search-acorn/preview
author: Dylan Couzon & Meina Ghafouri
author_link: https://qdrant.tech
date: 2026-08-07T00:00:00Z
draft: false
category: qdrant-internals
weight: 5
aliases:
  - /blog/filtered-vector-search-acorn/
keywords:
  - acorn
  - filtered vector search
  - filterable hnsw
  - hnsw
  - query planning
---

Filtered vector search breaks when metadata filters turn a healthy nearest-neighbor graph into scattered islands. HNSW's `m` parameter controls how many links each point gets; at Qdrant's default `m=16`, the collection below averaged about 21 links per node on layer 0. Filter out 96% of the points and fewer than one link per node survives on average, so traversal can get stranded before it reaches the true nearest matches.

Qdrant repairs that damage in two places. ACORN patches a filter-blind HNSW graph at search time; filterable HNSW repairs the graph at index time, by adding edges for indexed payload values. Both are available on the same collection, but ACORN earns its cost only where the extra edges don't reach: oversized value groups, `AND` intersections, and fields the build quietly skipped.

We benchmarked both on the same data: Qdrant on one machine, configured four ways, with no other engine measured.

## The Two ACORNs

The [ACORN paper](https://arxiv.org/abs/2403.04871) (Patel et al., SIGMOD 2024) describes two algorithms. ACORN-gamma is the high-performance variant and drives the paper's claim of "2-1,000x higher throughput at a fixed recall" over earlier filtered-search methods. It expands neighbor lists during index construction; the paper puts the cost at up to 11x plain HNSW's build time, though the ratios in its own build-time table run 8.8x to 33.1x.

ACORN-1 is the lighter variant. It builds a standard HNSW graph, then checks neighbors of neighbors at search time where direct neighbors fail the filter. Qdrant implements ACORN-1 as a query parameter you opt into per request, with no index-time changes required.

## The Graph Qdrant Builds Instead

[Filterable HNSW](/articles/filterable-hnsw/), which our co-founder Andrey Vasnetsov described in 2019, builds the fix into the index. When a field has a [payload index](/documentation/manage-data/indexing/#payload-index), Qdrant adds extra HNSW edges between points that share a value in that field, so a filtered query keeps a connected graph to traverse.

You pay for those edges at index time. On our one-million-point collection, building the HNSW index took 116 seconds without them and 392 to 652 seconds with them, a 3.4x to 5.6x cost. Ingest ran 47 to 56 seconds and is excluded. The 652-second build repeats the 507-second one at identical settings, so the top of that range is build-to-build variance.

ACORN-1 asks for nothing at build time and pays at query time instead. It is useful where the edges fall short, and they fall short in two places. Qdrant skips extra edges where a field's values each cover a large share of the collection, a size cap we unpack after the first result table. And it builds edges per field, never per combination, so an `AND` filter lands on an intersection that no single field's edges cover.

ACORN aims at both gaps from the query side. It is one option behind the [query planner](/documentation/search/search/#query-planning), alongside full scan, retrieval straight from the payload index, and filterable HNSW.

## The Benchmark

We benchmarked four strategies on one million `deep-image-96` image vectors, with keyword filters from 20% down to 0.012% selectivity and recall@10 scored against exact brute force over 500 queries per condition. Most filters are independent of the vectors; one 10% filter is correlated with them, the easy case where points that pass the filter also sit near each other in vector space.

The plain graph checks the filter during traversal and discards points that fail; it is the control, with extra edges switched off. The second strategy forces ACORN on that graph. The third is filterable HNSW. Those three pin `full_scan_threshold`, the collection setting that tells the planner when a filter is small enough to skip the graph, low enough that every query exercises the graph.

The fourth strategy leaves `full_scan_threshold` at its default and turns ACORN on, so the planner can combine extra edges, ACORN, and the payload-index fallback. Latency is mean server-side query time. The [reproduction kit](https://github.com/qdrant-labs/acorn-filterable-hnsw-benchmark) has the full methodology.

Every number below was measured on Qdrant v1.18.2, pinned by image digest, running in Docker with 15 CPUs on a laptop-class machine and queried serially. Read the ratios, not the absolute milliseconds.

## Single Filters: Edges Beat the Patch

Recall@10 at `hnsw_ef=64`, with mean server-side latency. `hnsw_ef`, shortened to `ef` below, is the per-query search budget: how many candidates the search keeps in flight. Selectivity is the measured fraction of points passing the filter.

| Filter (selectivity) | Plain graph | Plain graph + ACORN | Filterable HNSW | Planner + ACORN |
|---|---|---|---|---|
| One keyword (20%) | 62.9% @ 1.6ms | 98.9% @ 4.4ms | 94.8% @ 1.2ms | 100% @ 10.9ms |
| One keyword (10%) | 20.6% @ 1.7ms | 98.1% @ 4.3ms | 99.0% @ 1.1ms | 99.9% @ 8.5ms |
| One keyword (1%) | 0.1% @ 1.6ms | 67.7% @ 4.7ms | 99.8% @ 1.0ms | 100% @ 1.5ms |
| Correlated (10%) | 88.4% @ 1.7ms | 98.6% @ 3.5ms | 99.0% @ 1.2ms | 99.9% @ 7.2ms |

The plain graph collapses as filters tighten. ACORN helps, but only up to a point: it pulls recall back at 2.1x to 2.9x plain-graph latency, then stalls at 67.7% on the 1% filter. That stall is a known ACORN-1 weakness, the one the [RACORN-1 follow-up paper](https://arxiv.org/abs/2607.00768) sets out to fix.

Where extra edges exist, they solve the problem earlier and cheaper. They hold 99.0% to 99.8% recall on the 10%, 1%, and correlated 10% filters at 1.0ms to 1.2ms. ACORN gets close on two, at 3.5ms and 4.3ms. Correlation lifts the plain graph to 88.4%, still short of the edges.

{{< figure src="/articles_data/filtered-vector-search-acorn/single-filters.png" alt="Bar chart of recall at hnsw_ef=64 on four single-field filters, with each bar's mean server-side latency, comparing plain graph, plain graph with ACORN, and filterable HNSW." caption="Recall@10 and each bar's mean server-side latency at hnsw_ef=64 on the single-field filters. Extra edges hold the top recall at about 1ms; ACORN pays 3 to 4x that." width="100%" >}}

The 20% filter is the odd row out: it is the only single filter where ACORN beats filterable HNSW, 98.9% against 94.8%. That field got no extra edges of its own, and the build receipt shows why.

With ACORN enabled, the planner applies it when the filter passes 40% of points or fewer, controlled by the `max_selectivity` gate. Recall reaches 99.9% to 100%, at 7.7x to 9x filterable HNSW's latency on the uniform 10% and 20% filters. For the 1% filter, the planner answered all 500 queries from the payload index.

## The Size Cap: Which Fields Got Edges

Qdrant decides per field, at index time, whether extra edges are worth building. The first check is a size cap on each value group. A value shared by more points than the cap gets no extra edges, because the main graph should keep a group that large connected.

On this collection the cap came out at 190,476 points, about 19% of the collection: one million points divided by the measured average of 21 layer-0 links, times a fixed multiplier of 4. Qdrant measures that average while it builds and prints it to the build log at trace level. The 21 is specific to this data at `m=16`; a different `m` or different vectors move the cap, so read your own average out of your own build and compute from there. The 19% does not transfer.

The benchmark's seven payload fields, from the build receipt:

| Field | Distinct values | Points per value | Extra edges built |
|---|---|---|---|
| 2 fields | 5 | ~200,000 | No, all 5 value groups over the cap |
| 3 fields | 10 | ~100,000 | Yes, 10 of 10 groups |
| 2 fields | 100 | ~10,000 | Yes, 100 of 100 groups |

The 5-value fields clear the cap by 5%, so every one of their value groups was skipped. That is why ACORN beats filterable HNSW on the 20% filter before and the 4% intersection next, and nowhere else by more than build noise. The split follows from our cardinalities, not from anything inherent in ACORN.

The cap is a veto, not a promise. Over the cap means definitely no edges, but under it the field still has to pass a floor set by `full_scan_threshold` and a sampled connectivity test that runs on every field after the first. Both have teeth. Our graph collections pinned the threshold low; on Qdrant's default, the floor lands near 27,000 points for this dataset, and the planner collection's receipt shows its 10,000-point groups skipped for exactly that reason. When we rebuilt this collection at identical settings for the final section, the connectivity test skipped 9 of the 10 value groups on the correlated field, and recall dropped two points. Same settings and data, different edges.

From the outside, a capped field looks like a recall ceiling. In that rebuilt collection, filterable HNSW reads 93.0% on the 20% filter while fields with their own edges read 98.9% and 99.7%; a later section shows what closes the gap.

The skip is silent. Nothing in the API reports which fields got edges, and [telemetry](/documentation/ops-monitoring/monitoring/) records which search path the planner took, not whether edges exist. Our reproduction kit derives its verdicts by cross-referencing Qdrant's build log with known value-group sizes. Measure recall on each field you filter on instead of predicting edge construction from the source.

## Double Filters: The Intersection Gap

The same four strategies at `hnsw_ef=64`, now with an `AND` filter over two keyword fields.

| Filter (selectivity) | Plain graph | Plain graph + ACORN | Filterable HNSW | Planner + ACORN |
|---|---|---|---|---|
| Two keywords (4%) | 0.1% @ 3.9ms | 95.2% @ 7.7ms | 63.7% @ 1.2ms | 99.9% @ 13.9ms |
| Two keywords (1%) | 0.0% @ 3.4ms | 72.7% @ 6.8ms | 70.8% @ 1.5ms | 100% @ 3.7ms |
| Two keywords (0.012%) | 0.5% @ 2.5ms | 0.6% @ 2.6ms | 1.8% @ 2.6ms | 100% @ 1.3ms |

The `AND` filter breaks the plain graph outright. At 1% it comes back mostly empty, and raising `ef` to 512 doesn't add a single point because traversal has already exhausted its disconnected island.

The 1% intersection is a tie. Both fields have full edge coverage, but their `AND` intersection doesn't. ACORN's 72.7% against filterable HNSW's 70.8% sits inside build-to-build noise: rebuilds at the same settings moved ACORN recall between 70.7% and 74.1%.

The tie breaks when the search budget rises. At `ef=512`, filterable HNSW reaches 91.2% recall at 4.9ms, while ACORN needs 20.1ms to reach 90.3%. Spending a bigger budget on a graph built for the filter is cheaper than repairing a filter-blind one at search time.

{{< figure src="/articles_data/filtered-vector-search-acorn/ef-sweep.png" alt="Recall versus server-side latency for four filtered-search strategies as hnsw_ef sweeps from 64 to 512." caption="Recall vs server-side latency on the 1% double filter, hnsw_ef swept from 64 to 512. Filterable HNSW reaches ACORN-level recall at roughly a quarter of the latency, while the planner holds 100% by switching strategy per query." width="100%" >}}

The 4% intersection is different. ACORN wins because neither field has extra edges: both hold five values of about 200,000 points each, over the size cap. The gap holds across the sweep: 99.6% against filterable HNSW's 92.5% at `ef=512`.

At 0.012%, the right move is to stop using the graph. With roughly 120 matching points in a million, the plain graph reaches 0.5%, ACORN 0.6%, and filterable HNSW 1.8%; the benchmark pins all three to the graph. On defaults, the planner reads the payload index for 100% recall at 1.3ms.

The planner changes the outcome before the graph fully collapses. On the 1% intersection, it sent 29 of the 500 queries to the graph and 471 to the payload index, reaching 100% recall at 3.7ms mean latency.

## ACORN on a Normal Collection

Every forced ACORN row so far came from a graph built with extra edges deliberately switched off, which isolates the algorithm but is not a configuration anyone runs. The practical question is what ACORN adds on a collection that already has its edges. We rebuilt the filterable HNSW collection and ran it both ways: same build, ACORN off and forced on.

| Filter (selectivity) | Filterable HNSW | Filterable HNSW + ACORN |
|---|---|---|
| One keyword (20%) | 93.0% @ 0.7ms | 100% @ 11.6ms |
| One keyword (10%) | 98.9% @ 0.8ms | 100% @ 10.5ms |
| One keyword (1%) | 99.7% @ 0.6ms | 100% @ 10.2ms |
| Correlated (10%) | 97.0% @ 1.4ms | 100% @ 8.9ms |
| Two keywords (4%) | 48.8% @ 0.7ms | 100% @ 15.0ms |
| Two keywords (1%) | 70.0% @ 1.1ms | 100% @ 13.3ms |
| Two keywords (0.012%) | 1.1% @ 3.2ms | 98.0% @ 19.7ms |

Because this is a fresh build, its filterable column differs from the earlier tables. The receipt records one structural change: the connectivity test skipped 9 of the 10 correlated-field value groups this time, and that filter dropped from 99.0% to 97.0%. The 4% intersection fell further, from 63.7% to 48.8%, on two fields whose no-edges verdicts did not change. That leaves the missing correlated-field edges and ordinary build randomness in the shared graph as the remaining suspects, and the spread is itself a result: two builds of one configuration landed 15 recall points apart on the same intersection.

On the fields that kept their edges, ACORN buys about a recall point and costs 13x to 17x the latency. Leave it off there.

Everywhere else, the combination beats both mechanisms alone. On the capped 20% field, ACORN closes the ceiling: 93.0% to 100%. On the intersections, recall reaches 98% to 100%, including the 0.012% filter where every graph strategy so far scored under 2%. The stall never appears: forced on the 1% intersection, ACORN reached 100% here against 72.7% on the filter-blind graph.

{{< figure src="/articles_data/filtered-vector-search-acorn/acorn-on-edges.png" alt="Grouped bar chart comparing recall of filterable HNSW with and without ACORN on the same edges-built collection, across seven filters at hnsw_ef=64." caption="Same build at hnsw_ef=64, ACORN off and forced on. ACORN lifts every condition to 98% recall or better, including the intersections that break each mechanism alone; the price is 6x to 22x latency." width="100%" >}}

ACORN's neighbor-of-neighbor expansion is only as good as the neighborhood it expands. Extra edges make that neighborhood dense enough to traverse. What fixes ACORN is the thing it competes with.

The price is latency: 9ms to 20ms per query, 6x to 22x plain filterable HNSW, rising with `ef`. Below about 0.1% selectivity the graph is still the wrong tool: in the earlier grid, the planner answered the 0.012% filter from the payload index at 100% recall in about a millisecond.

## What to Do with Your Collection

Create a payload index on every field you filter on. That is what makes extra edges possible, and what the planner's payload-index path reads when the graph is the wrong tool.

ACORN is off by default and opt-in per request: set `acorn.enable` in the query's search params, and Qdrant applies it when estimated selectivity falls below the `max_selectivity` threshold, 0.4 by default. Lucene 10.2, Solr 10, Weaviate, and Vespa all ship ACORN variants marketed as the fix for filtered search. On Qdrant the extra edges already are that fix for most fields, and ACORN is the targeted tool for the filters they don't cover.

Finding those filters is a measurement, not a prediction. For each field you filter on, sample real filtered queries, get exact results with the `exact: true` search parameter, and score recall with ACORN off and then on. Where ACORN moves recall by a point or less, leave it off. Where it closes a real gap, 7 points on our capped field and 30 to 97 points on our intersections, that filter has outgrown its edges, and ACORN's latency buys recall nothing else on the graph can reach.

Run that measurement again after every rebuild, not once at launch. Two builds of one configuration landed 15 recall points apart on the same intersection here, because the sampled checks see a slightly different graph each time. A field that needed ACORN last month may not need it now, and the reverse.

One more knob completes the picture: setting `enable_hnsw: false` on a [payload index](/documentation/manage-data/indexing/#disable-the-creation-of-extra-edges-for-payload-fields) (available since 1.17) opts that field out of extra edges, which cuts build time for indexed fields you never filter on alone.

Three questions decide filtered search quality: what the index holds before the query arrives, what the search budget buys during traversal, and when the engine stops traversing altogether. The planner answers the third for you. The first two are yours, and they are one measurement away.

## Adjacent Work

The [ACORN paper](https://arxiv.org/abs/2403.04871) (Patel, Kraft, Guestrin, Zaharia, SIGMOD 2024) introduces ACORN-gamma and ACORN-1. [RACORN-1](https://arxiv.org/abs/2607.00768) extends ACORN-1 to address its recall collapse at low selectivity. A [PostgreSQL study](https://arxiv.org/abs/2603.23710) measures that repair from another angle: 71.6K filter checks for ACORN at 1% selectivity against 2.6K for plain traversal on a five-million-point OpenAI embedding set. [Filterable HNSW](/articles/filterable-hnsw/) describes the index-time approach Qdrant builds.

The [reproduction kit](https://github.com/qdrant-labs/acorn-filterable-hnsw-benchmark) includes the pinned image digest, dataset checksum, build receipts, and scripts that regenerate the frozen queries and ground truth. Re-run it against your Qdrant version rather than relying on these tables. To discuss your filtered-search setup, [get in touch](/contact-us/).
