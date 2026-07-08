---
draft: false
title: "Qdrant Beats Elastic’s DiskBBQ at 2x Throughput, Half the Latency, and 1/3 the Compute"
short_description: "Elastic's recent benchmark claims Elasticsearch with DiskBBQ hits 7x higher throughput than Qdrant on network-attached storage. The problem: they never tested Qdrant configured correctly."
description: "Elastic's recent benchmark claims Elasticsearch with DiskBBQ hits 7x higher throughput than Qdrant on network-attached storage. The problem: they never tested Qdrant configured correctly."
date: 2026-07-08
author: Alexis Musaelyan
featured: true
preview_image: /blog/benchmark-elastic-diskbbq/hero.png
social_image: /blog/benchmark-elastic-diskbbq/hero.png
tags:
  - elasticsearch
  - benchmark
  - comparison
---

## TL;DR

Elastic recently published a [benchmark](https://www.elastic.co/search-labs/blog/vector-search-benchmark-elasticsearch-vs-qdrant) claiming that their proprietary, disk-based index (dubbed “DiskBBQ”) delivers up to 7x higher throughput than Qdrant when deployed on nodes with network-attached storage. 

Elastic set out to benchmark DiskBBQ against a Qdrant cluster configured for disk-based retrieval, but their methodology omitted the exact features Qdrant built for this workload. Instead of enabling our documented two-stage retrieval and async disk scoring, they effectively ran a stress test on unbounded sequential disk access and reported the resulting I/O bottleneck as a baseline metric.

We took the same dataset and benchmarked it, demonstrating a \~2x higher throughput and \~50% lower latency at the same recall target, all without having to provision for the JVM heap. We leverage TurboQuant 4-bit (our recommended quantization for this recall range) on three **m6g.xlarge (4 vCPU x 16 GiB  x 64 GiB Disk)** instances, followed by another test on three even smaller **m6g.large (2 vCPU x 8 GiB x 32 GiB Disk)** instances.

The highlight: **At matched recall, Qdrant achieves 2.1x higher throughput, 51% lower latency, on roughly one-third of Elastic's per-node CPU and RAM. Also, the Qdrant engine tested on OSS is the same available on our cloud.**

## The Benchmark Setup

Elastic tested on three GCP n4-standard-8 nodes. Each pod was allocated 7 vCPU and 26 GB RAM, backed by 200 GiB Hyperdisk Balanced volumes at baseline allocation, with replication factor 2\. The corpus was [kenhktsui/wiki\_dpr\_e5](https://huggingface.co/datasets/kenhktsui/wiki_dpr_e5): 21 million passages, 768-dimensional e5-base-v2 embeddings, about 60 GiB of raw vector data. On their end, both engines ran at 2-bit quantization: Elasticsearch through bbq\_disk, its disk-optimized vector index, and Qdrant through filterable HNSW. Elastic notes bbq\_disk is only an Elasticsearch Enterprise feature. Qdrant is OSS under Apache 2.0 license.

| Item | Value |
| :---- | ----: |
| Dataset | wiki\_dpr\_e5: 21,015,300 points, 768 dimensions |
| Metric | recall@100 against prepared ground truth for 10,000 queries   |
| Load model | Fixed client concurrency (4 workers), back-to-back queries, client-side latency |

Their Qdrant configuration swept hnsw\_ef with segment-level rescoring and oversampling fixed at 1\. At recall@100 around 0.96, Elastic reported Elasticsearch at 32.4 QPS and 122.6 ms average latency. Their Qdrant row at the same recall band: 4.5 QPS, 883 ms which is roughly seven times slower on throughput and latency.

Elastic’s narrative attempts to frame Qdrant as bottlenecked by disk reads, positioning their proprietary DiskBBQ as the memory and disk efficient alternative. The glaring contradiction in their own benchmark is that this “memory-saving” index still requires 26 GB of RAM per pod just to keep the JVM stable.

But the setup Elastic tested maximizes disk traffic without any proper compensation. Qdrant’s [io\_uring-based](https://qdrant.tech/articles/io_uring/) async scorer, which helps to parallelize disk reads during the rescoring phase, was left off and the [two-stage query plan Qdrant documents for exactly this workload](https://qdrant.tech/documentation/tutorials-operations/large-scale-search/) wasn't used.

## What We Ran

We benchmarked the same dataset on Qdrant, targeting the same recall@100 metric and leveraging the same closed-loop load model: 4 concurrent clients, back-to-back queries, 120 seconds per operating point, latency measured end-to-end on the client. We swept hnsw\_ef from 50 to 256 and prefetched quantized vectors and rescored them with original vectors from disk.

Our Qdrant configuration differed in the ways that matter for disk-rescore performance:

* **TurboQuant 4-bit** with originals on disk (vectors.on\_disk=true, async\_scorer=true)  
* **Two-stage retrieval**: prefetch an oversampled candidate set from in-RAM quantized vectors, then rescore a bounded set against on-disk originals  
* **Qdrant 1.18.2** on Qdrant Cloud (AWS), RF=1

We used TurboQuant 4-bit for Qdrant, our current best-practice encoding for this recall band, not a bit-identical reproduction of their quantization choice. We tested replication factor \= 1 because we wanted to see the lowest footprint we could reasonably leverage to beat Elastic’s results. While we could have pushed the infrastructure footprint even lower to maximize throughput, benchmarking disk-based setups for a dataset of this size is largely an academic exercise. With Qdrant's compression, this entire corpus and its index consume as little as \~5GiB of RAM. In a real-world deployment, our users wouldn't even bother with disk here, they would simply run it in-memory for maximum performance.

Queries were driven from a separate AWS c5.2xlarge instance (8 vCPU, 16 GiB, us-east-1) running our open harness against the Qdrant cluster over the network; the same client-and-server separation Elastic used with Jingra.

We measured two cluster sizes on the same collection:

1. Before resize: 3 nodes × 4 vCPU / 16 GiB RAM / 64 GiB Disk (12 vCPU, 48 GiB RAM, 192 GiB Disk total)  
2. After resize: 3 nodes × 2 vCPU / 8 GiB RAM / 32 GiB Disk (6 vCPU, 24 GiB RAM, 96GiB Disk total)  

## The Results

At recall@100 around 0.96:

| Configuration | Nodes | Recall@100 | Throughput | Avg latency | P99 latency |
| :---- | ----: | ----: | ----: | ----: | ----: |
| Elasticsearch DiskBBQ (published) | 3 × 7 vCPU / 26 GB RF=2 | 0.9599 | 32.4 QPS | 122.6 ms | 184.3 ms |
| Qdrant, two-stage | 3 × 2 vCPU / 8 GB RF=1 | 0.9596 | 67.2 QPS | 59.5 ms | 86.0 ms |
| Qdrant, two-stage | 3 × 4 vCPU / 16 GB RF=1 | 0.9596 | 111.9 QPS | 35.7 ms | 83.1 ms |

![Elasticsearch vs Qdrant on Throughput and latency](/blog/benchmark-elastic-diskbbq/image1.png)  
*Throughput and average latency at recall@100 ≈ 0.96. Qdrant: two-stage rescore, TurboQuant 4-bit, RF=1. Elasticsearch: published DiskBBQ results, 2-bit quantization, RF=2. Same dataset and closed-loop load model (concurrency 4).*

On the smallest nodes we tested (2 vCPU and 8 GB RAM per node), roughly 3× less CPU and RAM per node than Elastic's 7 vCPU / 26 GB pods, Qdrant delivered 2× the throughput and half the latency of Elasticsearch at the same recall. More hardware makes Qdrant faster; that is expected. The result that matters for the efficiency argument is that Qdrant already beats Elastic's published numbers on the smallest footprint we tested. 

## Reproducing This Benchmark

The harness is in our [reproduction kit](https://github.com/qdrant-labs/wiki-dpr-disk-rescore-benchmark). The dataset is on [Hugging Face](https://huggingface.co/datasets/kenhktsui/wiki_dpr_e5); the 10k-query ground-truth file is documented in the kit.

To reproduce this on your own hardware:

1. Load wiki\_dpr\_e5 (21M × 768d) with TurboQuant 4-bit, originals on disk, HNSW m=16, ef\_construct=256  
2. Enable async\_scorer (self-hosted: qdrant\_config.yaml; Cloud: Advanced Optimizations)  
3. Query with the two-stage prefetch-and-rescore pattern from the [Query API documentation](https://qdrant.tech/documentation/search/hybrid-queries/)
4. Run closed-loop at concurrency 4 against the fixed 10k query set

## What This Means

Disk-based indexes attempt to run vector search at scale without keeping full-precision vectors in RAM. The index searches quantized vectors and then rescores against full-precision from disk to recover accuracy.

Elastic's solution is DiskBBQ: a proprietary, IVF-style index. It is a band-aid that seeks to reduce the RAM footprint of the vectors in order to [leave 50% of it for the JVM heap](https://www.elastic.co/search-labs/blog/elasticsearch-heap-size-jvm-garbage-collection), while capping your max node size at 64GiB so you don’t accidentally trigger OOM.

Qdrant's answer is true open source, advanced quantization, async disk scoring, unbounded instance types, and two-stage bounded rescoring delivering 67 QPS at 59 ms on 2 vCPU / 8 GB nodes versus Elastic's published 32 QPS at 123 ms on 7 vCPU / 26 GB pods, at the same recall.

If you want to talk through what this looks like on your workload, [get in touch.](https://qdrant.tech/contact-us/)  
