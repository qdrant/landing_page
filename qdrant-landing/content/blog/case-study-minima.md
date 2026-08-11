---
draft: false
title: "Qdrant and Minima Deliver 2.78x More Agentic RAG Tasks per GPU-Hour"
short_description: "A joint benchmark of Qdrant retrieval and Minima-optimized inference with Qwen3.6-27B on a single RTX PRO 6000 Blackwell GPU."
description: "Hybrid search, payload filters, and late-interaction reranking in Qdrant plus Minima-optimized inference delivered 2.92x more successful agentic RAG tasks per GPU-hour without reducing grounded quality."
preview_image: /blog/case-study-minima/social_preview.png
social_preview_image: /blog/case-study-minima/social_preview.png
date: 2026-08-11T00:00:00+00:00
author: Qdrant and Minima Engineering
featured: false
tags:
  - case study
  - agentic ai
  - hybrid search
  - reranking
  - inference optimization
  - benchmark
---

### Reducing Retrieval and Calls

When a retrieval-augmented generation (RAG) agent runs, it often has to plan a search, check the evidence it gets back, and try again when that evidence falls short. Those inefficiencies compound. Every extra retrieval and every extra model call adds latency, context, and inference cost.

To attack that cost, Minima built a bounded retrieval agent. It planned the query, searched Qdrant, decided whether the evidence was sufficient, and rephrased the query when it was not. It then generated a cited answer with Qwen3.6-27B. Qdrant handled [hybrid search](https://qdrant.tech/documentation/search/hybrid-queries/), applied [payload filters](https://qdrant.tech//documentation/search/filtering/), and ran [late-interaction reranking](https://qdrant.tech//documentation/tutorials-basics/reranking-hybrid-search/). Minima served each request on a single 96 GB NVIDIA RTX PRO 6000 Blackwell GPU.

Across 1,800 evaluated tasks and 10,000 full agent episodes, the joint stack reached 3,750 tasks per GPU-hour, compared to 1,350 for dense retrieval with BF16 inference. Median task latency fell from 21.3 seconds to 7.7 seconds, grounded task success rose from 80.1% to 84.2%, and successful throughput climbed from 1,081 to 3,158 tasks per GPU-hour.

| First-Pass Evidence | Context per Task | Inference Throughput | Joint Capacity |
|:---:|:---:|:---:|:---:|
| 72% to 87% sufficient | 5.2K to 2.3K tokens (56% less) | 392.2 output tokens/s on one GPU | 1,350 to 3,750 tasks/GPU-hour |

## What We Tested

Minima ran 1,800 multi-step tasks across SciFact, FiQA, HotpotQA, and a deterministic tenant-and-version filtering set. Every run used the same agent prompt, tool schema, stopping rule, and a maximum of two Qdrant calls per episode. Answers were capped at 256 output tokens. Minima then replayed 10,000 complete episodes against one million 400-token chunks and ran a separate 50,000-query adversarial filtering test for each retrieval condition.

| Layer | Baseline | Qdrant + Minima |
|---|---|---|
| **Agent loop** | Plan, retrieve, check evidence, refine once if needed, answer with citations | Identical prompt, tool schema, stopping rule, and call limit |
| **Retrieval** | Qdrant dense retrieval, indexed payload filters, top 16 | Dense plus BM25 sparse, RRF fusion, ColBERT-style late-interaction reranking, the same indexed payload filters, top 8 |
| **Inference** | Qwen3.6-27B BF16 weights and BF16 attention KV | Minima NVFP4 W4A4 weights with native Blackwell kernels, FP8 recent and anchor KV, and Minima TQ3 stale KV |

![Architecture of the joint benchmark: the agent loop calls the Qdrant Query API for hybrid retrieval, fusion, filtering, and reranking, while the Minima-served Qwen3.6-27B endpoint handles planning, evidence checking, and answering on a single Blackwell GPU](/blog/case-study-minima/qdrant-minima-agentic-rag-architecture.png)

All three configurations used the same hardware, Qwen3.6-27B checkpoint, sampling settings, agent prompt template, concurrency, and endpoint. Qdrant and inference ran on separate hosts. Retrieval strategy and Minima compression were the only variables that changed between runs. Minima accepted a configuration only if grounded task quality stayed within 1 percentage point of BF16 with retrieval fixed, citation quality held, and at least 99.5% of episodes completed. Query vectors were precomputed only for the isolated Qdrant latency measurement. The end-to-end agent run included planning, embedding, retrieval, evidence checking, and generation.

## Why the First Qdrant Call Was Usually Enough

Dense retrieval handled semantic similarity well. Minima added BM25 to recover the names, IDs, and version strings that embeddings can miss. Qdrant fused the two result sets with reciprocal rank fusion (RRF), then reranked the shortlist with token-level late interaction. Payload filters enforced tenant, language, document type, and version at query time.

The numbers below cover retrieval and the agent loop. Recall@10 and nDCG@10 use the same top-10 ranked evaluation list. The agent prompt was then truncated to the stated dense top 16 or hybrid top 8 context budget. "First-pass evidence sufficient" means the agent did not invoke its optional second search. Per-call latency is warmed Qdrant query time with query vectors precomputed.

| Metric | Dense Pipeline | Hybrid plus Reranking | Change |
|---|:---:|:---:|:---:|
| Supporting-document recall@10 | 89.6% | 90.2% | +0.6 pp |
| nDCG@10 | 0.704 | 0.751 | +0.047 |
| Context precision | 32.8% | 55.7% | +22.9 pp |
| First-pass evidence sufficient | 72.0% | 87.0% | +15.0 pp |
| Mean Qdrant calls per task | 1.28 | 1.13 | -11.7% |
| Retrieved context per task | ~5.2K tokens | ~2.3K tokens | -56.0% |
| Retrieval latency p50 / p95 | 8.4 / 19.6 ms | 18.7 / 43.2 ms | +10.3 / +23.6 ms |
| Tenant-policy violations | 0 / 50,000 | 0 / 50,000 | Passed |

Qdrant's p95 query time was 43.2 milliseconds, less than 0.3% of the 20.8-second p95 BF16 agent episode. The first search was sufficient in 87% of tasks, and mean context fell from 5.2K to 2.3K tokens. Even before Minima was enabled, median task latency dropped from 21.3 to 14.6 seconds and successful throughput rose from 1,081 to 1,669 tasks per GPU-hour, a 54% gain.

<!-- PUBLICATION BLOCKER: placeholder quote below. Replace with a real, approved quote from a Qdrant or Minima engineer on why sufficient first-pass evidence matters inside an agent loop. Do not publish without it. -->

> [PLACEHOLDER QUOTE, needs attribution.]

## How Minima Accelerated Every Model Call

Minima stored Qwen3.6-27B weights in NVFP4 W4A4 and ran them with native Blackwell kernels. Recent and anchor KV stayed in FP8. Stale pages moved to the 3-bit TQ3 tier. Minima disabled Qdrant vector [quantization](https://qdrant.tech/documentation/guides/quantization/) so the retrieval and inference effects stayed separate.

| Metric | BF16 Reference | Minima | Result |
|---|:---:|:---:|:---:|
| Nominal model weights | 54.0 GB | 16.9 GB | 3.20x smaller |
| Attention KV per active token | 64.0 KiB | 18.3 KiB | 3.50x smaller |
| Attention KV for one 32K session | 2.00 GiB | 0.57 GiB | 3.50x smaller |
| Resident 32K sessions before admission failure | 11 | 96 | 8.7x more |
| Standalone 512-in / 256-out throughput | 206.4 tokens/s | 392.2 tokens/s | 1.90x |

Compression held task quality. With Qdrant retrieval fixed, grounded task success was 84.3% for BF16 and 84.2% for Minima, citation F1 was 90.8% and 90.7%, and valid tool calls were 99.8% for both. The paired task-quality delta was -0.1 percentage point (95% CI [-0.7, +0.5]), which cleared the pre-registered non-inferiority gate.

## The Joint Result: 2.92x More Successful Tasks per GPU

With BF16 unchanged, Qdrant raised raw capacity from 1,350 to 1,980 tasks per GPU-hour. Holding Qdrant fixed, Minima raised it to 3,750. Applying the grounded task success rate gives 3,158 successful tasks per GPU-hour, 2.92x the baseline.

The table below reports agent results at concurrency 8, with final answers capped at 256 tokens. Task rates are wall-clock completions per GPU-hour.

| Configuration | Context | p50 / p95 | Raw Tasks/h | Grounded Success | Successful Tasks/h |
|---|:---:|:---:|:---:|:---:|:---:|
| Qdrant dense top 16 + BF16 weights/KV | ~5.2K | 21.3 / 33.8 s | 1,350 | 80.1% | 1,081 |
| Qdrant hybrid + reranking top 8 + BF16 weights/KV | ~2.3K | 14.6 / 20.8 s | 1,980 | 84.3% | 1,669 |
| Qdrant hybrid + reranking top 8 + full Minima | ~2.3K | 7.7 / 11.0 s | 3,750 | 84.2% | 3,158 |

 *At US$1.50 per GPU-hour rate Minima used for test accounting, GPU cost per 1,000 successful agent tasks fell from US$1.39 to US$0.48, a 65% reduction. This GPU-only comparison excludes the Qdrant host and embedding services. The same provisioned services stayed online across all three conditions, though the hybrid pipeline put more work on them.*

*Minima did not multiply the 3.2x weight compression, 3.5x KV compression, and smaller retrieval context into a single system claim. They affect different bottlenecks. The measured end-to-end results were 2.78x more raw task capacity and 2.92x more successful tasks per GPU-hour.*

## Why This Matters for Agentic RAG

Qdrant and Minima address different costs inside the loop. Qdrant made the first search sufficient more often and reduced the evidence passed to the model on each attempt. Minima reduced the memory and compute cost of planning, checking, and answering.

A production agent is limited by the whole run, not by vector search or model throughput in isolation. In this test, Qdrant improved the evidence passed to the model and Minima increased the amount of inference one GPU could serve. Together they delivered 2.92x more successful tasks without reducing tool-call validity, grounded quality, or citation quality.

## Reproduce This on Your Corpus

If you run agentic RAG on Qdrant, Qdrant and Minima would like to reproduce this benchmark on your corpus and agent loop. [Contact Qdrant](https://qdrant.tech/contact-us/) or [contact Minima](https://mnma.ai) to get started.

## Technical References

The [Qdrant guide to agentic vector search](https://qdrant.tech//articles/agentic-builders-guide/) explains why retrieval latency, memory, filtering, and reranking matter inside multi-step agent workflows.

The [agentic RAG with LangGraph and Qdrant tutorial](https://qdrant.tech//documentation/tutorials-build-essentials/agentic-rag-langgraph/) covers tool selection, repeated retrieval, and stateful agent control flow.

The [Qdrant hybrid and multi-stage queries documentation](https://qdrant.tech//documentation/search/hybrid-queries/) describes dense and sparse prefetch, RRF and DBSF fusion, and multi-stage ranking.

The [Qdrant hybrid search with reranking tutorial](https://qdrant.tech//documentation/tutorials-basics/reranking-hybrid-search/) walks through the dense, sparse, and ColBERT-style late-interaction workflow.

The [Qdrant multivectors and late interaction tutorial](https://qdrant.tech//documentation/tutorials-search-engineering/using-multivector-representations/) covers native multivector representations and MaxSim scoring.

The [Qdrant filtering documentation](https://qdrant.tech//documentation/search/filtering/) describes payload and point-ID conditions for application-defined constraints.

The [NVIDIA RTX PRO 6000 Blackwell product page](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/) lists the 96 GB GDDR7 memory and Blackwell FP4 support.

The [Minima site](https://mnma.ai) covers model-weight, KV-cache, and serving optimization.