---
draft: false
title: "PiPNN: Build Your Qdrant Index Up to 8x Faster"
short_description: "PiPNN is a new way to build the HNSW graph in Qdrant, with builds that are 5 to 8 times faster, recall at or above the HNSW baseline, and search latency on par or better."
description: "PiPNN, available in Qdrant 1.20.1 behind a feature flag, builds the same HNSW graph 5 to 8 times faster on datasets of about 1M vectors, with recall@10 at or above the HNSW baseline and query latency on par or better."
preview_image: /blog/pipnn-faster-index-builds/hero.jpg
social_preview_image: /blog/pipnn-faster-index-builds/preview/social_preview.jpg
title_preview_image: /blog/pipnn-faster-index-builds/preview/title.jpg
small_preview_image: /blog/pipnn-faster-index-builds/preview/preview.jpg
date: 2026-11-27T00:00:00Z
author: Clelia Bertelli
tags:
  - indexing
  - hnsw
  - pipnn
  - benchmark
---

## TL;DR

PiPNN is a new way to build the HNSW graph in Qdrant, available in v1.20.1 behind a feature flag. On three datasets of about 1M vectors it builds the graph **5 to 8 times faster** than the default builder, reaches **equal or slightly higher recall@10** (by 0.3 to 0.7 percentage points), and serves queries at **the same speed or slightly faster** at matched recall.

## Why Index Build Time Matters

Swapping an embedding model, changing a vector datatype, or adding a new vector field all mean building a fresh HNSW index, and on a large collection that rebuild can keep your next experiment waiting for hours. The effect is easy to see at the top end: a full HNSW build of a 1 billion vector dataset takes about 2.5 to 3 hours even on a machine with 288 vCPUs and 2.2 TB of RAM, while most real workloads run on far smaller machines. A faster builder shortens every one of those experiments.

PiPNN, short for Pick-in-Partitions Nearest Neighbors and based on a [2026 paper by Rubel et al.](https://arxiv.org/pdf/2602.21247), is the answer we decided to adopt to that bottleneck: it produces the same kind of graph as HNSW, so everything on the search side stays as it is, and only the way the graph gets built changes.

## What Changes Under the Hood

HNSW builds its graph by inserting points one at a time and searching the partially built graph for each new point's neighbors, which makes the build slow and heavily dependent on memory bandwidth. PiPNN instead splits the dataset into many small overlapping groups, compares every point with the other points in its group using fast matrix operations, and then prunes the resulting candidate edges into the final graph. Comparing small groups all at once keeps the CPU busy with arithmetic instead of waiting on memory, which is why the build gets so much faster on modern hardware.

## The Results

We built the same segment twice in Qdrant, once with the default HNSW builder and once with PiPNN, on three datasets of about 1M vectors, using `m = 16`, `ef_construct = 100`, and the default `ef = 100` at search time. The chart shows the build time on two machines, a Ryzen 5 9600X and an older Ryzen 9 5900XT, and the toggle switches between them.

{{< chart id="pipnn/build-time" caption="On the Ryzen 5 9600X, PiPNN builds the same segment 5.0x to 5.6x faster than HNSW, for example 16.2 s instead of 84.0 s on cohere-wiki-1M." caption2="On the older Ryzen 9 5900XT the gap grows to 6.0x to 7.9x, with cohere-wiki-1M dropping from 210.6 s (about 3.5 minutes) to 26.5 s." >}}

Faster builds usually cost search quality, but recall@10 here is higher than the HNSW baseline on every dataset and on both machines, by 0.3 to 0.7 percentage points (for example 97.83% against 97.32% on cohere-wiki-1M on the 9600X), which means you do not trade accuracy for the speedup.

## What About Query Speed?

A PiPNN graph makes a query score between 5% and 17% more vectors than an HNSW graph (for example 2,684 vs 2,291 on glove-100), so we also checked whether that costs latency. For each dataset we swept `ef` on both graphs, sent one query at a time, and compared the server-side latency at the same recall.

{{< chart id="pipnn/query-latency" caption="Median latency at matched recall: PiPNN's graph answers 13% to 25% faster than HNSW's in these three cases, for example 0.421 ms against 0.527 ms on sift-128 at 0.99 recall." caption2="95th percentile latency at matched recall: PiPNN's graph answers 15% to 27% faster than HNSW's in these three cases, for example 0.547 ms against 0.693 ms on sift-128 at 0.99 recall." >}}

Across every recall target we tested, PiPNN's graph answers between 1% slower and 28% faster than HNSW's, so despite scanning more vectors the query speed is on par with HNSW or slightly better.

## Who Benefits Most

PiPNN is designed for the case where index builds are your bottleneck: tens, hundreds, or thousands of millions of vectors, and workflows where you regularly re-embed, change a datatype, or add a vector field. It also helps at 100K to 1M vectors, as the numbers above show, although the absolute time saved is smaller there. 

For now it works for dense vectors with Cosine, Dot, or Euclid distance (optionally with scalar, binary, or TurboQuant quantization) and for from-scratch builds, and Qdrant falls back to HNSW for sparse vectors, multivectors, Manhattan distance, and product quantization.

## Try It

PiPNN is available from Qdrant v1.20.1 and is currently behind a feature flag, with no collection setting:

```yaml
feature_flags:
  pipnn_graph_building: true
```

You can also set `QDRANT__FEATURE_FLAGS__PIPNN_GRAPH_BUILDING=true`. Then fill a collection and let the optimizer build a segment of 30,000 points or more. 

To check that the flag took effect, set `log_level: DEBUG`, and the log will tell you when the main graph was built `with PiPNN` or why it was not. The resulting graph is a regular HNSW graph, so searching it works exactly as before.

We are working on a way to choose the indexing method directly from your application, so stay tuned for Qdrant v1.21, and let us know how PiPNN works for your data [on our Discord community](https://discord.gg/qdrant).

## Dive Deeper

For how PiPNN carves the dataset into overlapping groups, scores points inside each group, and prunes the candidate edges back to a graph, together with the full benchmark setup, read our technical deep dive: [Faster Indexing at Scale with PiPNN](/articles/faster-indexing-at-scale-with-pipnn/).
