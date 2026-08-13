---
title: "Scaling Ground-Truth Retrieval with Supernova"
draft: false
slug: nova-bf
short_description: "Exact ground truth for a 10-billion-vector benchmark takes over 1 quadrillion distance comparisons. Supernova solves this with a distributed, GPU-accelerated brute-force search engine."
description: "Supernova brute-force search is Qdrant's distributed, GPU-accelerated brute-force search engine. It computes exact nearest neighbours over billions of vectors for dense, sparse, multi-vector, and filtered workloads."
preview_image: /research/nova-bf/hero.png
social_preview_image: /research/nova-bf/hero.png
date: 2026-08-13
author: Qdrant Labs team
featured: false
tags:
  - benchmark
  - billion-scale
  - performance
  - vector search
  - gpu
  - open source
---

When building vector search systems, evaluating approximate nearest neighbor (ANN) search algorithms requires an absolute benchmark: the **ground-truth exact nearest neighbors**. During the construction of our 10-billion-vector benchmark—**FineWeb-10B**—we encountered a massive computational hurdle. To establish ground truth across the corpus for our evaluation queries, we needed to compute over **1 quadrillion distance comparisons**. Naively iterating over each embedding in a query set against a multi-terabyte corpus would take years on a single machine. Loading the corpus into RAM was equally non-viable, requiring more than 15 TB of memory just for a single pass.

To overcome this, we built **`nova-bf`**: a distributed, streaming-first, GPU-accelerated brute-force search engine designed specifically for exact vector retrieval across billions of vectors. This post explains how we engineered `nova-bf`, overcame memory and I/O bottlenecks, and implemented custom kernels for complex retrieval paradigms.

## Architecture: Two-Tier Map-Reduce and Shared Compute

To execute quadrillions of distance calculations affordably, `nova-bf` relies on a streaming map-reduce model applied at two distinct structural tiers:

1. **Intra-Worker Streaming (Chunk-Level Map-Reduce):** Rather than materializing the full corpus in RAM, a worker streams smaller, manageable chunks of `.parquet` files from remote storage. Each chunk is transferred to the GPU for batch distance computation. The worker maintains an in-memory priority queue buffer of the current top-$k$ results, merging the new top-$k$ candidates from each chunk until its assigned partition is complete.
2. **Inter-Worker Parallelism (Node-Level Map-Reduce):** Because the corpus is partitioned into thousands of Parquet files, we parallelize across dozens of GPU instances without requiring inter-worker communication. Each node processes a disjoint subset of corpus files and emits a compact local top-$k$ table. A final lightweight driver job reduces these local top-$k$ tables into the global ground truth.

Orchestrated via **SkyPilot**, running the FineWeb-10B ground-truth generation across 50 AWS `g5.16xlarge` nodes required just 1.5 hours—costing under **$600 in total compute**.

![Two-tier map-reduce architecture: chunk-level streaming inside each worker, and node-level parallelism across the cluster](/research/nova-bf/two-tier-mapreduce.svg)

## Overcoming the I/O and Memory-Bound Wall

Even with PyTorch tensor operations accelerating matrix multiplications (GEMM) on NVIDIA A10G GPUs, the system quickly became memory-bound. We had a difficult time keeping the GPUs fed across the cluster. To remedy this, we took a three-pronged approach. We describe these in turn.

### 1. Multi-Tiered Parallel Ingest

Data streaming from AWS S3 or high-performance file systems like Lustre introduces access latency. To saturate compute, `nova-bf` implements parallel data loading at four nested layers:

* **Inter-Node:** Disjoint file assignment per worker rank.
* **Worker-Level:** A dedicated pool of CPU reader threads fetches multiple files concurrently, hiding network transfer behind GPU computation.
* **File-Level:** Column chunks are read in parallel across Parquet row-groups.
* **Byte-Level:** For complex data types (such as multivectors with variable token lengths per row), single row-group reads can still bottleneck. We add concurrent byte-range HTTP/POSIX requests to saturate Network Interface Cards (NICs) at full line-rate.

### 2. CPU Thread Allocation for Decompression

Profile measurements revealed that **Parquet file decompression and Apache Arrow deserialization** on the CPU were the primary bottlenecks starving the GPU. By re-architecting reader threads to perform CPU-bound Snappy/ZSTD decompression asynchronously—overlapping decompression directly with active GPU execution—we halved total execution time.

### 3. Shared Matrix Caching Across Workloads

When running multiple search configurations simultaneously (e.g., evaluating top-10, top-100, or different payload filters over the same vector space), `nova-bf` decodes each vector column **once per file**. The underlying score matrices are cached in GPU memory, allowing multiple query specifications, metrics, and filter predicates to re-use a single GEMM operation.

## Expanding Beyond Dense Vectors: Sparse, Multivector, and Filters

Modern vector search applications extend beyond static dense embeddings. To serve as a complete benchmark engine, `nova-bf` supports **sparse lexical vectors (e.g., SPLADE)**, **multi-vector late-interaction models (e.g., ColBERT)**, and **metadata filtering**.

### 1. Vocabulary Remapping for Sparse Vectors

Sparse vectors contain non-zero weights over high-dimensional vocabularies (often $d > 30{,}000$). Decoding sparse data into standard Compressed Sparse Row (CSR) format across billions of records introduces insurmountable CPU-to-GPU transfer overhead.

To that end, `nova-bf` optimizes sparse evaluation by leveraging **remapped vocabulary projection**. For every Parquet file, the engine identifies the active vocabulary subspace required by the query batch and remaps the document matrix once per file. This eliminates sparse dimensions that cannot contribute to any active query, dramatically reducing CPU-to-GPU memory traffic and sparse-dense matrix multiplication (SpMM) overhead.

### 2. Custom Fused Kernels for Multivectors (MaxSim)

Multivector models represent a single document or query as a variable-length sequence of token vectors ($|Q| \times d$ and $|D| \times d$). Scoring relies on the Late-Interaction MaxSim operator:

$$s(Q,D) = \sum_{i=1}^{|Q|} \max_{1 \le j \le |D|} \mathbf{q}_i^{\top}\mathbf{d}_j$$

Naively evaluating MaxSim requires materializing full query-token to document-token similarity tensors, causing severe GPU memory fragmentation and Out-Of-Memory (OOM) errors.

To solve this, `nova-bf` flattens ragged multi-vector inputs into contiguous token matrices with offset arrays. Token similarities are computed via `cuBLAS` FP32 GEMM, immediately followed by a **custom fused CUDA kernel**. This kernel performs the row-wise `max` reduction and query-wise `sum` aggregation in-place on GPU register memory, writing out only the final scalar $s(Q,D)$ per document and completely bypassing intermediate tensor allocations.

![The fused MaxSim kernel: cuBLAS GEMM feeds directly into an in-place max-reduce and sum-aggregate, with no intermediate similarity tensor](/research/nova-bf/maxsim-fused-kernel.svg)

### 3. Filter-Aware Execution Pipelines

Finally, evaluating exact ground truth for filtered vector search requires applying metadata constraints without destroying compute throughput. `nova-bf` separates filtering into three execution paths based on predicate scope:

1. **Uniform Filters (Static):** Predicates identical across all queries (e.g., `category == 'tech'`) are evaluated on CPU reader threads using Apache Arrow kernels while reading Parquet files. Ineligible rows are dropped *before* GPU memory transfer, saving PCIe bandwidth and GEMM FLOPs.
2. **Numeric and Categorical Per-Query Filters:** Range and set constraints are evaluated directly on GPU bitmasks alongside score calculation for maximum locality.
3. **Text Predicates:** Regex and substring filters are tokenized and evaluated on CPU reader threads. Boolean match masks are bit-packed (8 queries/byte) before host-to-device transfer, minimizing memory footprint while maintaining exact per-query evaluation semantics.

## Conclusion

By treating I/O as a first-class citizen alongside GPU compute, `nova-bf` turns intractable brute-force searches into fast, deterministic, and affordable batch jobs.

Whether generating exact ground-truth nearest neighbors for 10-billion-vector corpora or evaluating complex hybrid, multivector, and metadata-filtered queries, `nova-bf` provides the exact baseline required to measure vector database recall accurately.

All of these capabilities are open-source and integrated into the broader **Supernova** benchmarking suite. You can explore the codebase, reproduce our benchmarks, or run brute-force ground-truth generation on your own datasets directly within the [Supernova Repository](https://github.com/qdrant/supernova).
