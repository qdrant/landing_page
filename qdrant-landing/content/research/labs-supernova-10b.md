---
title: "Supernova: Open Tooling and a 10-Billion-Vector Benchmark"
draft: false
slug: supernova-10b
short_description: "We release Supernova, an open framework that builds vector search benchmarks at scale, and three new datasets. The largest holds more than 10 billion vectors and approximately 50 TB of data."
description: "Supernova is an open-source framework for the construction of large vector search benchmarks. We use it to release FineWeb-10B, a 10-billion-vector dataset with exact dense, sparse, and filtered ground truth."
preview_image: /research/supernova-10b/hero.png
social_preview_image: /research/supernova-10b/hero.png
date: 2026-08-10
author: Qdrant Labs team
featured: true
tags:
  - benchmark
  - billion-scale
  - performance
  - vector search
  - open source
---

Humans continue to generate data at unprecedented speeds. It is often cited that 90% of the world’s data was generated in the last two years alone. At Qdrant, our customers consistently push the envelope of what it means to run vector search at scale. Beyond individual enterprise use cases, the broader vector search community is witnessing the emergence of a new paradigm. We are moving past the era of micro-optimizations on pristine, million-scale datasets toward architectures capable of operating at true internet-scale.

To measure a vector database, you need a benchmark that matches the work you actually do. The public benchmarks do not match that work yet. This post explains the gaps, and it describes the tools we built to close them.

We release two things today. The first is **Supernova**, an open-source framework that builds vector search benchmarks and evaluates vector databases. The second is a set of three new datasets that we made with it. The largest is **FineWeb-10B**, which holds more than 10 billion dense vectors, more than 10 billion sparse vectors, and equates to approximately 50 TB of data.

## Three Gaps in the Current Benchmarks

Current public benchmarks have three main limitations:

**Size.** Most public sets hold fewer than 10 million vectors and a few gigabytes of data. A set of this size fits in the memory of one machine. It therefore does not test the distributed behaviour of a real system, and it does not test the storage path at all.

**Filters.** Many benchmarks provide no filtered search. Real queries almost always carry constraints: a date range, a language, a category, a permission. A system that is fast without filters can be slow with them, because the filter and the vector search must operate together.

**Missing parts.** Some large sets give no ground truth. Without ground truth you cannot measure recall, which is the primary quality metric for approximate search. Other sets give no payload. They give the vectors but not the source text and the metadata, so you cannot test filters and you cannot test the application that consumes the results.

![Number of vectors in common open-source benchmarks compared to the datasets in this work](/research/supernova-10b/corpus_scale.svg)

There is also a fourth problem, and it is structural. Retrieval now uses dense vectors, sparse vectors, multi-vector representations, images, filters, and combinations of all of these. No single dataset can cover that range. The community needs a growing set of benchmarks, and therefore it needs a repeatable method to build them.

![Capabilities provided by common open-source benchmarks](/research/supernova-10b/capability_matrix.svg)

## How We Found This Problem

We did not start with a plan to build a framework. We started with 10 billion vectors.

We generated those vectors with an internal embedding engine. The engine wrote the vectors to storage, but it wrote them apart from the source text and the metadata. This is normal behaviour for embedding tools, and it is not a problem at a small size. At 10 billion records it is a serious problem. To support filters and application tests, we had to join the vectors back to their source records across more than 100 TB of data.

The exact ground truth was the second problem. The cost of exact ground truth is the product of the corpus size and the query count. Every filter adds a further set of exact results, because a filtered query has different correct answers than an unfiltered one. At 10 billion vectors this work does not fit on one machine. It is possible to distribute it, but each stage needs its own engineering, and the compute bill is real.

We built Supernova because we needed both problems solved, and because the next team will need the same thing.

## What Supernova Does

Supernova is a set of tools with one interface, `nova <command>`. Each tool has a single job. The tools exchange data through stable file formats and YAML configuration.

**`nova-embed`** generates the embeddings. It keeps the source text and the metadata with each vector, so no join is necessary later. It presents one interface to several backends, which include SentenceTransformers, vLLM, OpenAI, and FastEmbed. Its workers hold no shared state and do not communicate. Each worker reads its own part of the input and writes its own output, so throughput increases linearly with the worker count. The tool is also aware of the model. A model such as BGE-M3 produces dense, sparse, and multi-vector output in one forward pass, so `nova-embed` loads that model one time instead of three.

**`nova-bf`** computes the exact ground truth. It streams the corpus from remote storage, scores on the GPU with PyTorch, holds a running top-k result, and writes small partial files. It never holds the full corpus or the full score matrix in memory. It has a separate scoring path for dense, sparse, and multi-vector data, and it treats filters as part of the pipeline rather than as a step after the search.

**`nova-dist`** runs the work. It uses [SkyPilot](https://github.com/skypilot-org/skypilot) to provision machines, schedule jobs, and recover from failures on AWS, Slurm, Google Cloud, Azure, and Kubernetes. Each tool states how to divide its own work, and `nova-dist` places that work on the available hardware.

`nova-load`, `nova-sweep`, and `nova-storm` then load a dataset into a vector database, sweep its configuration, and apply query load while they measure speed and recall.

## How We Made Exact Ground Truth Affordable

Exact ground truth is brute force by definition. You must compare every query against every vector. The saving therefore cannot come from fewer comparisons. It must come from the removal of repeated work.

Supernova applies three ideas.

**One pass serves many searches.** A benchmark needs several sets of ground truth: dense, sparse, filtered, and unfiltered, each with its own value of k. A simple approach reads the corpus one time for each set. `nova-bf` instead reads the union of the required columns, decodes each vector type one time per file, and shares the batches, the device transfers, and the score matrices between all searches that can use them. A filtered search reuses the score matrix of the unfiltered search and then masks the rows that fail its filter.

**Filters run where they are cheapest.** A filter that applies to every query is evaluated one time per file on the reader threads, where the work hides behind disk latency. When every search of a vector type is filtered, the rejected rows are dropped before the transfer to the GPU, which removes both data movement and arithmetic. Text conditions stay on the CPU, where string matching is efficient, and their results are packed into bits before transfer. Numeric conditions run on the GPU, and only for the rows under evaluation.

**The GPUs stay fed.** These savings are worth nothing if the GPUs wait for data. Object storage and parallel file systems give high total throughput but high latency per request, so Supernova reads at four levels at the same time: each worker takes a separate set of files, several reader threads keep several files in flight, several column chunks are read at once inside a file, and, when one row is very large, the object itself is fetched as concurrent byte ranges.

The result is a number we can state plainly. We computed exact ground truth for 120,000 dense, sparse, and filtered [MS MARCO](https://microsoft.github.io/msmarco/) queries over 10 billion vectors, and the compute cost was **under $600**.

## The Three Datasets

| Dataset | Model | Data | Vectors | Ground truth |
|---|---|---|---|---|
| **FineWeb-10B** | gte-multilingual-base | text | 10.07B dense, 10.07B sparse | dense, sparse, filtered |
| **PubMed-BGE-M3** | BGE-M3 | text | 23.9M dense, 23.9M sparse, 8.37B multi-vector tokens | dense, sparse, multi-vector |
| **Coyo-VE** | Qwen3-VL-Embedding-2B | text and images | 15.4M dense | dense |

**FineWeb-10B** is the largest open-source vector database benchmark that we know of. It holds 24.47 TB of vectors and 28.66 TB of source text and metadata. That second number is the important one. It is larger than the vectors, and it is the part that most large benchmarks discard.

**PubMed-BGE-M3** covers scientific literature with three representations of the same corpus. Because the dense, sparse, and multi-vector data all come from one model over one text set, you can compare hybrid retrieval methods with the other variables held constant.

**Coyo-VE** places text and images in one shared representation, with 5.81 TB of payload against only 117 GB of vectors.

![Vector data and payload data in each benchmark](/research/supernova-10b/storage_footprint.svg)

## A Test at Full Scale

A dataset is only useful if a real system can consume it. We loaded the full 10-billion-vector workload into Qdrant on the [Aurora supercomputer](https://www.alcf.anl.gov/aurora). Each node holds two 52-core Intel Xeon CPU Max processors, approximately 1 TB of memory, and an HPE Slingshot network.

The load itself needed new work. To build the index in parallel and to reduce the load on the shared file system, we wrote a serverless tool that generates collections independently. Each worker builds its own part with no dependency on the others.

![The scale frontier for open vector search benchmarks](/research/supernova-10b/scale_frontier.svg)

## Read the Paper

Supernova is open source, and so are the three datasets. You can reproduce our results, or you can point the same tools at your own corpus, your own model, and your own filters. That second use is the one we care about most: the community needs more benchmarks, and the cost of a new one should not be the reason nobody builds it.

The code is in the [Supernova repository](https://github.com/qdrant/supernova). For a closer look at how we made exact ground truth affordable at this size, see our post on [`nova-bf`, the brute-force engine behind the benchmark](/research/nova-bf/).

<!-- TODO(nathan): add links once public -->
<!-- - FineWeb-10B on Hugging Face: -->
<!-- - Paper / arXiv: -->

<!-- TODO(nathan): the paper's evaluation sections (case studies, ablation, summary of
     findings, conclusion) are not written yet. Once they are, this post should gain a
     results section with recall, throughput, and per-stage runtime and cost. -->
