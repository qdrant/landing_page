---
title: "Candidate Depth and the Memory Budget in Qdrant"
short_description: "Raising candidate depth moves the ceiling and barely moves the score. What that gap means, and the knobs that decide what your collection costs in RAM."
description: "Set candidate depth and hnsw_ef in Qdrant, measure the gap between ceiling and score, and trade memory with quantization and on-disk storage."
preview_dir: /articles_data/retrieval-candidate-depth-and-memory/preview
social_preview_image: /articles_data/retrieval-candidate-depth-and-memory/preview/social_preview.jpg
weight: -212
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - candidate depth
  - hnsw_ef
  - scalar quantization
  - memory tiers
  - HNSW tuning
category: search-quality
---

Retrieval tuning stops being about relevance as soon as the collection has to fit somewhere real. Latency, memory, disk, and build time all meet at the same controls: how many candidates you fetch, how hard the index works to find them, and what the collection costs to keep in RAM.

Candidate depth looks like the cleanest quality knob. Fetch more candidates, give ranking more to work with, and the score should rise.

It does not behave that way. More depth mostly raises the ceiling that a better ranker could reach later. The ranking you ship barely moves.

The measurements come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25, on a single shard in Docker on a laptop. Scale matters more in this article than in its companions, because index behavior is the one thing that does not transfer, so every finding below ships with the check that finds your own number.

## Depth Raises the Ceiling, Not the Ranking

Score the union of your two candidate lists as if it were ordered perfectly and you get the ceiling: the best nDCG@10 any ranking of that candidate set could reach. Raising the prefetch `limit` raises that number a long way.

| Corpus | Ceiling at 10 | Ceiling at 500 | Shipped at 10 | Shipped at 500 |
|---|---|---|---|---|
| SciFact | 0.890 | 0.993 | 0.709 | 0.717 |
| ArguAna | 0.878 | 0.999 | 0.521 | 0.523 |
| WANDS | 0.859 | 0.983 | 0.720 | 0.727 |
| CodeSearchNet | 0.813 | 0.962 | 0.645 | 0.655 |
| DBPedia-entity | 0.688 | 0.970 | 0.460 | 0.463 |

Fifty times the candidates moved the ceiling by 0.10 to 0.28. The score a reader would see moved by 0.002 to 0.010.

The gap between ceiling and shipped score widens at every step on every corpus. On DBPedia it opens from 0.229 at depth 10 to 0.507 at depth 500.

Depth is not even monotonic on the shipped number. CodeSearchNet's best fusion setting peaks at `limit=100` and is lower at 500, and DBPedia's peaks at 200. Past a point, the extra candidates are competing for ten seats against documents that deserved them.

Set `limit` to somewhere around 100 to 200 because the candidates have to exist before anything can rank them. Then stop expecting the score to follow. What you are buying is headroom, and it takes a second ranking stage to collect it. [A reranker](/articles/when-a-reranker-pays/) is one. A [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query), which rescores the same candidates using payload fields such as recency or popularity, is another.

Depth is cheap in latency, which is the one honest argument for setting it generously. Measured as a reader would issue it, one fused `query_points` per request, going from `limit=10` to `limit=500` cost between 40% and 45% more median time: 2.14 ms to 3.06 ms on SciFact, 2.77 ms to 3.94 ms on DBPedia-entity. Those are single-shard figures on one machine with no concurrent load, so take the shape and measure the magnitude yourself.

**Depth is per shard.** A shard receives its own `limit` and runs the full prefetch against its own data, so on twelve shards a `limit` of 200 means each shard returns up to 200 candidates and collection-level fusion sees up to 2,400. The root-level fusion itself runs once, at collection level; only a fusion nested inside a prefetch runs per shard. Both matter when you are reading a latency profile and wondering why depth cost more than you budgeted.

## `hnsw_ef` Only Matters Before Recall Saturates

`hnsw_ef` decides how wide the HNSW graph traversal searches. It is a pure exchange, recall for latency, with no memory cost.

On these corpora it does nothing. Sweeping 16, 64, 128, and 512 at depth 200 moved the fused score by at most 0.0022 on any of the five, and union recall by at most 0.0040. On SciFact the results at 128 and 512 are byte-identical.

Do not read that as a null result. It is a statement about collections of 5,000 to 100,000 documents on one shard, where graph recall saturates almost immediately.

Somewhere above this scale the graph stops saturating and `hnsw_ef` becomes your primary recall-against-latency knob. The check below tells you which side of that line you are on, by measuring approximate search against exact search on your own data:

```python
import time

from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")
# Your own query vectors, embedded with the model the collection was built with.
queries = [...]


def exact_top(queries, limit=100):
    """Ground truth, computed once: a full scan does not depend on hnsw_ef."""
    return [
        {point.id for point in client.query_points(
            collection_name="products", query=vector, using="dense",
            limit=limit, search_params=models.SearchParams(exact=True),
        ).points}
        for vector in queries
    ]


def recall_at(ef, queries, truth, limit=100):
    """Share of the exact top-`limit` an approximate search at this hnsw_ef returns."""
    found, elapsed = 0.0, 0.0
    for vector, wanted in zip(queries, truth):
        started = time.perf_counter()
        approx = client.query_points(
            collection_name="products", query=vector, using="dense",
            limit=limit, search_params=models.SearchParams(hnsw_ef=ef, exact=False),
        ).points
        elapsed += time.perf_counter() - started
        found += len({point.id for point in approx} & wanted) / limit
    return found / len(queries), elapsed / len(queries) * 1000


truth = exact_top(queries)
for ef in (16, 64, 128, 256, 512):
    print(ef, recall_at(ef, queries, truth))
```

`exact=True` runs a full scan, which is the ground truth the approximation is trying to match. Sweep `ef` and plot recall against the millisecond figure. On SciFact's 5,183 documents, over 50 queries:

| `hnsw_ef` | Recall against exact | Milliseconds per query |
|---|---|---|
| 16 | 0.986 | 1.98 |
| 64 | 0.993 | 1.98 |
| 128 | 0.999 | 2.18 |
| 256 | 1.000 | 2.45 |
| 512 | 1.000 | 2.25 |

Recall starts at 0.986 and has nowhere to go. On a fused query at prefetch `limit` 200, raising `hnsw_ef` from 16 to 512 cost between 4% and 49% of median latency across the five corpora, for at most 0.0022 of nDCG@10.

At this scale, it is close to pure cost.

That is what a saturated graph looks like. On a collection where the recall column climbs, the knee is your setting. If it is flat from the start, spend the latency on breadth instead.

One check that does not work: running the same query at two `hnsw_ef` values and concluding from identical results that you are on a full scan. Recall saturates, so identical results are exactly what a healthy graph produces at a small scale. Read `indexed_vectors_count` instead, as [the pre-tuning audit](/articles/tuning-retrieval-what-to-check-first/) does.

## Memory Savings Spend Recall, Latency, or Build Time

Above a certain size, the binding constraint stops being relevance and starts being what fits in RAM. Two knobs dominate, and each one charges you something real.

**Quantization** stores each vector in fewer bits. Int8 scalar quantization is a quarter the size of float32, and it costs recall, which `oversampling` and `rescore` buy back: fetch more candidates from the compressed index than you need, then rescore those with the original vectors and keep the best.

We rebuilt SciFact and DBPedia-entity with int8 scalar quantization to find out what that costs downstream.

| Setting | Dense top-10 agreement with unquantized | Fused nDCG@10 change |
|---|---|---|
| No rescoring | 0.984 | -0.0001 to +0.0000 |
| `rescore=True` | 0.997 to 1.000 | -0.0001 to +0.0000 |
| `rescore=True`, `oversampling=4` | 0.998 to 1.000 | +0.0000 to +0.0001 |

Quantization does reorder the candidate list. Without rescoring, 1.6% of the dense prefetch's top 10 moves.

Almost none of that reaches the fused result. Fusion reads ranks, so a reordering has to be large before ranks change enough to matter. On SciFact, turning `rescore` on recovered the exact unquantized ordering.

That is int8 scalar quantization on one shard at 5,000 and 100,000 documents. Binary quantization is a far more aggressive trade and we did not test it here.

**`memory`** is the most direct memory knob Qdrant has, and every structure in the collection carries its own. Dense vectors, the HNSW graph, quantized vectors, the sparse index, payloads, and payload indexes each take `cold` or `cached`, and everything except dense vectors and payloads also takes `pinned`.<br>Pinned data sits on the heap and is never evicted. Cached data is memory-mapped and warmed into the page cache at startup, where the operating system can still evict it. Cold data stays on disk until something reads it.

Defaults differ by structure: `cached` for dense vectors and the HNSW graph, `cold` for payloads, `pinned` for the sparse index and payload indexes. [Memory tiers](/documentation/ops-configuration/memory-tiers/) has the full table.

Once a collection outgrows RAM, the pairing that matters is `cold` original vectors with `pinned` quantized ones. Scoring then runs against a compressed copy in memory, and only the rescore step reads disk. This parameter arrived in v1.19 and replaces `on_disk`, `on_disk_payload`, and `always_ram`. The old flags still work, and `memory` wins when both are set.

**Only if you can rebuild** are `m` and `ef_construct` available to you. `m` sets how many edges each node keeps and costs memory permanently; `ef_construct` costs build time only and nothing afterwards. At scale these are one-shot design decisions that bound everything else you might tune, so they are worth deliberating once and then leaving alone. Qdrant's defaults of `m=16` and `ef_construct=100` are reasonable.

**Only if you filter** does filterable HNSW matter, which for a multi-tenant collection is by definition every query. Qdrant builds extra edges into the graph so a filtered search stays on the graph instead of falling back to a scan. When several strict filters combine, those edges stop being enough, and the [ACORN search algorithm](/documentation/search/search/#acorn-search-algorithm) covers that case by also exploring neighbors of neighbors when direct neighbors are filtered out. It is disabled by default; once you set its `enable` flag it activates per query, whenever estimated filter selectivity falls below `max_selectivity`, which defaults to 0.4. It buys accuracy and spends latency, so gate it on the selectivity where your own filters actually land. If your tenants are a payload field, `is_tenant` tells Qdrant to organize storage around it.

**Only after quantization is on** is the `quantile` parameter worth a thought, and for most collections above RAM quantization is already on.

## The Gap Tells You Which Stage Is Stuck

The through-line of this part is one number: what your candidate set could score against what it does score. On these corpora that gap ran from 0.14 to 0.51 and grew every time we fetched more candidates.

You can measure it on your own collection with a [labeled set](/articles/tuning-retrieval-what-to-check-first/). Take the union of your two prefetch results, score it as if perfectly ordered, and compare against what you ship.

A large gap means your ranking stage is the constraint and no amount of retrieval tuning will move it. A small gap means the opposite: your ranking is close to the best this candidate set allows, and more quality has to come from better candidates, which means the embedding model or a third prefetch.

Almost everyone reading this will find a large gap. [When a reranker pays](/articles/when-a-reranker-pays/) is about the stage that closes it, and what it costs.
