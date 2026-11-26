---
draft: false
title: "Faster Indexing at Scale with PiPNN"
short_description: "Technical deep dive into PiPNN, a faster way of building HNSW graphs at scale"
description: "Qdrant 1.20.1 introduced PiPNN, a new indexing algorithm that speeds up HNSW builds at scale: in this article we explore how it works and what improvements it brings."
social_preview_image: /articles_data/faster-indexing-at-scale-with-pipnn/preview/social_preview.jpg
preview_dir: /articles_data/faster-indexing-at-scale-with-pipnn/preview
weight: 1
author: Clelia Bertelli, Jonas Schulz
date: 2026-11-25T00:00:00Z
keywords:
  - indexing
  - hnsw
  - pipnn
  - anns
category: qdrant-internals
---


When your vector search pipeline scales to billions of data points, even the fastest HNSW build might not be fast enough. For example: [Microsoft-SpaceV1B](https://github.com/microsoft/SPTAG/tree/main/datasets/SPACEV1B), a dataset of 1 billion int8 vectors, required approximately 2 hours and 25 minutes for a full HNSW build, on a machine with 288 vCPUs and 2.2TB of RAM(!), while a similar dataset, [Deep-1B](https://research.yandex.com/blog/benchmarks-for-billion-scale-similarity-search), which has 1 billion 96-dimensional float32 vectors, took 3 hours. 

Since most workloads are much more CPU and RAM-constrained than research benchmarks, you can see how indexing with HNSW can quickly become a bottleneck when dealing with huge datasets. The main problem is that, while the build is slow, a good HNSW graph yields high search quality.

So we wanted to get to the best of both worlds: replace the HNSW build algorithm, but keep the search accuracy of an HNSW graph.

That’s why, in [Qdrant 1.20.1](https://github.com/qdrant/qdrant/releases/tag/v1.20.1), we introduced experimental HNSW index builds based on PiPNN.

## “Ultra-Scalable Graph-Based Nearest Neighbor Indexing”

PiPNN (Pick-in-Partitions Nearest Neighbors, [Rubel et al., 2026](https://arxiv.org/pdf/2602.21247)) caught our attention because of the performance it achieved on the same benchmarks we mentioned above: it consistently outperforms other indexing techniques, such as VANAMA ([Subramanya et al., 2019](https://proceedings.neurips.cc/paper_files/paper/2019/file/09853c7fb1d3f8ee67a61b6bf4a7f8e6-Paper.pdf)) and HCCNG ([Munoz et al., 2019](https://doi.org/10.1016/j.patcog.2019.106970)), and by a wide margin. On SpaceV1B it only takes approximately 16 minutes, and on Deep-1B it takes 17 minutes, which *might* be the reason why authors of the paper call it “ultra-scalable […] indexing”.

But how does PiPNN work? Why is it so fast? And how did we integrate it in Qdrant? Let’s find out!

### *Divide et Indexa*

To see why PiPNN is fast, we first have to see why HNSW is slow at scale. HNSW inserts points one at a time: for every new vector, it runs a beam search on the graph built so far, then links the point to what it finds. Each search hops across memory, so the CPU cache barely helps, and every insert depends on the ones before it. The paper calls this the search bottleneck, and PiPNN's answer is to never search while building: split the data into small overlapping groups, find the neighbors inside each group by brute force, and merge the results into short neighbor lists.

The splitting is called *randomized ball carving*: we sample some points at random as leaders, every point joins the groups of its nearest few leaders (the `fanout`, 7 on the first step), and any group that's still too big repeats the process with a smaller fanout (2 on the second step).

{{< island path="content/articles/headless/faster-indexing-at-scale-with-pipnn/ball-carving" width="760" ratio="760 / 472" title="Randomized ball carving: random leaders are picked, each point joins its nearest leaders, and the resulting groups overlap. Select a step to focus on it. Point positions are illustrative." >}}
![Three panels. Random points become leaders, each point joins its two nearest leaders, and the resulting groups overlap so border points x and y sit in two groups.](/articles_data/faster-indexing-at-scale-with-pipnn/ball-carving.png)
{{< /island >}}

The overlap among partitions is by design: a point near the border between two groups would lose half of its neighbors if it only joined one. In Qdrant, a leaf holds at least 256 and at most 1,024 points, so a level of 1,000,000 points goes through two steps, and every point ends up in about 14 leaves (7 groups on the first step, times 2 on the second).

### Doing the Heavy Leaf-ting

Inside each leaf, we do something that sounds naive: we compare every point with every other point. With 1,024 points that's about half a million pairs, but it's a single matrix multiplication, which is what CPUs are best at: contiguous data, everything in cache, no graph to walk. The kernels live in our own [`pairwise` crate](https://github.com/qdrant/qdrant/tree/master/lib/common/pairwise), and they score the same vectors HNSW would, so quantized vectors are used if you configured quantization.

Each point then keeps its top `k` neighbors (4 by default), and every pick becomes an edge in both directions, since a search has to be able to walk either way:

{{< island path="content/articles/headless/faster-indexing-at-scale-with-pipnn/leaf-scores" width="760" ratio="760 / 490" title="Pairwise scores inside one leaf and the edges the top 2 picks of each point produce. Scores are illustrative. Select a point to see its picks." >}}
![A five-by-five score matrix with each point's best two neighbors outlined, and the graph of edges those picks produce, with one-way picks marked by dashed arrows.](/articles_data/faster-indexing-at-scale-with-pipnn/leaf-scores.png)
{{< /island >}}

### Pruning the Tree

Each point now has candidate edges from about 14 leaves, and most of them are redundant: several candidates pointing in the same direction don’t help the search much (they all build up to the same neighborhood of points in the graph). Luckily, we can fix this with *HashPrune*, a pruning algorithm that keeps one edge per direction. Every point owns a small reservoir (64 slots on level 0 with `m = 16`), and a new candidate is added to it if there's room, or, if the slots are all filled, it can replace the current worst candidate if it has a better score. Independently of the reservoir being full, if two candidates share the same direction (see below), only the best one is kept (only one candidate is allowed to represent a given direction, to maximize graph variability). 

A candidate's direction comes from *m* (usually 12) [hyperplanes](https://en.wikipedia.org/wiki/Hyperplane): these are random vectors drawn from a Gaussian distribution before the indexing starts. We then compute the dot product of these random vectors with each point in the corpus, and store the products as arrays of length *m* (we call them sketches).

With *m* hyperplanes going through a vector *p*, we can determine in which region (cone) of the geometric space another vector *c* lays by computing the residual hash, an *m*-bits hash obtained by comparing the sketches for *p* and *c* (if `sketch(c)[i] - sketch(p)[i] < 0` we add a 0 to the hash, else a 1). With `m` generally set to 12, we can store the residual hash as an unsigned 16-bits integer (`u16` in Rust).

{{< island path="content/articles/headless/faster-indexing-at-scale-with-pipnn/hashprune" width="760" ratio="760 / 460" title="HashPrune keeps one candidate per cone. Positions, scores, and hash bits are illustrative. Select a candidate to see what the reservoir does with it." >}}
![Point p with three candidates. c1 and c2 fall in the same cone, so the lower scoring c2 is dropped. c3 falls in a different cone and is kept.](/articles_data/faster-indexing-at-scale-with-pipnn/hashprune.png)
{{< /island >}}

The paper proves that the final reservoir doesn't depend on the order in which candidates arrive, which matters because it enables parallelization, and many threads can send edges for the same point at once. The last cut is *RobustPrune*: we reuse the heuristic HNSW applies when it inserts a point, which keeps the best candidate and drops every candidate that the kept neighbor already "covers", until the degree limit is reached.

## Bringing PiPNN To Production

Qdrant already has an HNSW graph with levels, entry points, a file format, and filtering built around it, and, as we said, we didn't want a second index, just a different way to build the same one and re-use as much as we can of it.

### Same Graph, New Builder

Qdrant assigns the random HNSW levels first, as usual, then runs the whole PiPNN pipeline once per level over just that level's points, and hands each point's neighbor lists to the graph. Everything after that (payload links, saving the graph) is unchanged, so search can't tell which builder was used. One detail: points are handed over in id order, because the graph's entry points keep the first point they see on each top level, and a fixed order makes the build deterministic on any number of threads.

### Making It Behave Like HNSW

A graph isn't ready just because every point has a list: search expects every point to be reachable, and real data might bend the algorithm in three places:

**Stalls.** Real embeddings share a common direction, so every point looks close to every leader, and a group can fail to shrink below the 1024 threshold. After two such steps in a row, we cut the group into random chunks instead.

**Backlinks.** PiPNN prunes each point separately: this can result in a situation where a point has edges towards good neighbors (out-links), but no other point in the graph links to it, so it’s essentially cut from search. HNSW avoids this because every neighbor of a new point adds it back. We do the same after the prune, filling the free slots of each list with the points that link to it, sorted by id. That is parallel, and it gives the result HNSW would give if it inserted the points in id order.

**Duplicates.** Identical vectors have identical hashes, so only one copy survives in each reservoir and the others get no in-links. So we find exact duplicates up front (a fingerprint per vector, confirmed with the sketches), build the graph over one point per group, and chain the other copies behind it:

{{< island path="content/articles/headless/faster-indexing-at-scale-with-pipnn/duplicate-chain" width="760" ratio="760 / 390" title="Identical vectors: only the first copy joins the build and the others are chained behind it. Choose how many copies exist to see the chain grow." >}}
![Five identical vectors c1 to c5. Only c1 is in the main graph. The copies are chained after it, the last links back to c1, and every copy points to c1's real neighbors.](/articles_data/faster-indexing-at-scale-with-pipnn/duplicate-chain.png)
{{< /island >}}

We tested this with groups of up to 1,000 identical vectors, and a search for their vector returns every copy.

This only applies to exact duplicates: merely similar vectors go through the normal pipeline, and distinct vectors whose quantized codes tie can still lose some links.

### Yes, But… The Recall?

We built the same segment with both builders in Qdrant on three datasets of about 1M vectors (HNSW `m = 16`, `ef_construct = 100`), once with the default HNSW builder and once with PiPNN via `QDRANT__FEATURE_FLAGS__PIPNN_GRAPH_BUILDING=true`, starting from empty storage each time. We then ran 1,000 held-out queries per dataset at the default `ef = 100` and compared the results to exact ground-truth nearest neighbors (recall@10, averaged over all queries). These numbers come from Qdrant itself, not from the paper:

| Dataset | CPU | PiPNN build | HNSW build | Recall@10, PiPNN | Recall@10, HNSW |
| --- | --- | --- | --- | --- | --- |
| glove-100 (1.18M × 100, Cosine) | Ryzen 5 9600X, 12 threads | 6.9 s | 38.4 s | 0.8122 | 0.8051 |
| glove-100 | Ryzen 9 5900XT, 14 threads | 9.9 s | 63.3 s | 0.8122 | 0.8090 |
| sift-128 (999K × 128, Euclid) | Ryzen 5 9600X, 12 threads | 5.4 s | 26.5 s | 0.9907 | 0.9856 |
| sift-128 | Ryzen 9 5900XT, 14 threads | 7.6 s | 45.9 s | 0.9909 | 0.9858 |
| cohere-wiki-1M (999K × 768, Dot) | Ryzen 5 9600X, 12 threads | 16.2 s | 84.0 s | 0.9783 | 0.9732 |
| cohere-wiki-1M | Ryzen 9 5900XT, 14 threads | 26.5 s | 210.6 s | 0.9783 | 0.9741 |

As you can see, recall@10 is slightly higher than the HNSW baseline on every dataset and machine, by 0.003 to 0.007, while the build is between 5 and 8 times faster. The gain is not free: PiPNN's graph makes a query score between 5% and 17% more vectors than HNSW's (for example, 2,684 vs 2,291 on glove-100), which is where part of the extra recall comes from.

{{< accordion >}}
- title: "Why two machines?"
  content: |
    The brute-force leaf comparisons run on SIMD kernels in the `pairwise` crate, and Qdrant picks the best kernel the CPU supports at runtime: AVX-512 (with VNNI for integer types) if available, then AVX2 on x86, and NEON on ARM. The Ryzen 5 9600X (Zen 5) supports AVX-512, while the Ryzen 9 5900XT (Zen 3) only goes up to AVX2. Running on both shows how PiPNN performs with different instruction sets: the 9600X builds faster even with fewer threads, but the speedup over HNSW holds on both, and recall is the same.
{{< /accordion >}}

### Try It

PiPNN is available starting from v1.20.1, and is currently behind a feature flag, with no collection setting:

```yaml
feature_flags:
  pipnn_graph_building: true
```

You can also set `QDRANT__FEATURE_FLAGS__PIPNN_GRAPH_BUILDING=true`. Then fill a collection and let the optimizer build a segment of 30,000 points or more: with `log_level: DEBUG`, the log tells you when the main graph was built `with PiPNN`.

We’re working on improving the interface and exposing a way for you to choose the indexing method you prefer directly in your application logic, so stay tuned for Qdrant v1.21!

## Should You Use PiPNN?

As you might’ve picked up from the article, PiPNN solves a *scale* problem: you have tens, hundreds or even thousands of millions of vectors, and HNSW builds start to *really* become your bottleneck when you want to experiment with a new embedding model, change a datatype or add a new vector field. If you’re in that situation, you should most definitely give PiPNN a shot (and let us know how it goes [on our Discord community](https://discord.gg/qdrant)!).

This doesn’t mean it won’t help you at a smaller scale, such as 100K or 1M vectors, but the gains might not be as noticeable. Also, PiPNN only works for dense vectors and with from-scratch builds, for now, so keep that in mind for your testing.

If you try out PiPNN, let us know your feedback: until then, happy indexing!
