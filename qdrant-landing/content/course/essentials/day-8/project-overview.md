---
title: Project Overview
weight: 1
---

{{< date >}} Day 8 {{< /date >}}

# Project Overview

It’s time to bring everything together. For your final project, you’ll build a documentation search engine in a single Jupyter notebook on Qdrant Cloud. The goal of this vector search engine is simple: given a user query, it should return the most relevant page and section, along with details on where to find it.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

<br/>

## Why this project

This mirrors real retrieval work. You will design chunks, choose payloads, and combine dense, sparse, and multivector signals so results are both relevant and explainable. Everything runs from one notebook, backed by Qdrant Cloud.
## What you will build

A notebook that ingests a docs set, stores three vector signals per point in Qdrant, and runs a two-stage search:
- dense: a primary retrieval embedding for each chunk
- sparse: a lexical representation (BM25/SPLADE) for hybrid matching
- multivector: token-level late-interaction representations (e.g., ColBERT) for titles/breadcrumbs, used for second-stage reranking with MAX_SIM; disable HNSW for this role (m=0)

Stage 1 retrieves with dense + sparse using server-side fusion (RRF or DBSF). Stage 2 reranks the candidates with the multivector and returns page, section, snippet, and score. Keep it reproducible and report a small accuracy table.

## The plan

- Connect to Qdrant Cloud and define one collection with three vector roles: a dense vector for primary retrieval, a sparse vector for lexical matching, and a multivector (multiple short dense views) for second-stage reranking. You have full freedom to choose model(s) and field names. Choose an appropriate similarity/distance metric for your dense vector. Enable sparse, and keep payloads for titles, url, anchor, path/breadcrumbs, tags, and a trimmed text field. If the multivector is only used for reranking, you can disable HNSW for it by setting m=0.
  - Recommended models:
    - Dense (primary retrieval): `BAAI/bge-small-en-v1.5` (fast) or `BAAI/bge-base-en-v1.5` (higher quality). For multilingual corpora, consider `intfloat/multilingual-e5-base`.
    - Multivector (reranking): use a late-interaction model (e.g., `ColBERT`/`ColBERTv2`); do not reuse your dense model.
    - Sparse (lexical): start with `BM25` sparse weights; optionally try a `SPLADE` encoder for stronger lexical recall (with slower indexing).
- Load and normalize docs, preserve headings and anchors. Chunk primarily by section boundaries. Store the raw text of the previous and next sections in payload fields `prev_section_text` and `next_section_text` to aid reranking/snippet building, without mixing that context into the dense embedding.
- Vectorize and upsert in batches: compute the dense embedding once for primary retrieval, compute token-level representations with a late-interaction model for the multivector (e.g., ColBERT) for short views like titles and breadcrumbs, compute the sparse representation, attach payloads, and write to Qdrant.
- Search flow: Stage 1 compute a dense query embedding and a sparse query representation; retrieve hybrid results using server-side fusion (RRF or DBSF) with the Query API. Stage 2 rerank the candidate set using the multivector, then return page + section + snippet. Control the Stage 1 candidate size with an oversampling limit before reranking.
  - Query embeddings:
    - Dense: embed the query once with the same model used for the primary retrieval vector. If the multivector uses the same model, reuse this query embedding for reranking. If the multivector uses a different model, compute an additional query embedding with that model for reranking.
    - Sparse: build the query’s sparse representation (BM25 or SPLADE) to match how the sparse vectors were indexed.
    - Multivector scoring: use a late-interaction query representation (same model as the multivector, e.g., ColBERT) with a MAX_SIM comparator across token vectors.
- Evaluate and iterate: run a small ground-truth set and report Recall@10, MRR, and P50/P95 latency. Tune ef at search time first; if you rebuild the index, adjust m and ef_construct. Adjust the fusion setup (RRF vs DBSF), sparse/dense balance, and the multivector comparator. Only consider quantization if your metrics hold.

## Chunking strategy

We recommend to chunk by sections, not by a fixed token window. Most documentation is written in self-contained sections with headings, and users often search for "how do I configure X" where the best answer aligns with a named section.

- Primary unit: one chunk per section. If a section is extremely long, split it into paragraph groups, but keep the section heading attached.
- Adjacent context: include `prev_section_text` and `next_section_text` as payload fields. Use them for display and reranking signals, but do not concatenate them into the dense embedding. This reduces topical leakage while giving the reranker enough context to disambiguate borderline cases.
- Titles matter: keep `section_title`, `page_title`, and breadcrumbs in payloads. Add the title texts to the multivector views so the second stage can prefer better-named sections.
- Overlap: avoid large overlaps when using section-based chunks. If you must split a long section, keep a small paragraph-level overlap just to preserve sentence continuity.
- Snippets: build the snippet from the chunk text and optionally append a short sentence from `prev_section_text` or `next_section_text` if it clarifies the answer.
 
Why this helps: section-first chunking aligns your units with how users and docs structure concepts. Keeping adjacent context in payloads gives the reranker extra evidence without diluting the embedding with unrelated text. This typically improves Recall@k at the same or lower latency compared to large sliding windows.

## Key choices you will make

- Chunking and overlap: big enough to contain answers, small enough to stay precise. Write one sentence explaining your choice.
- Payloads: include only fields that help display, filtering, and evaluation. Make sure section anchors are present so you can score at section level.
- Multivector design: which views go into the multivector and how you rerank (AVERAGE vs MAX across views).
- Fusion: prefer server-side fusion (RRF or DBSF) for dense+sparse; adjust candidate limits and weights based on your queries.
- HNSW parameters: increase ef for better recall until latency stops being acceptable. If you recreate the index, consider m and ef_construct appropriate for your data size and hardware. Pick a reasonable oversampling size for reranking (for example 50-200 candidates) based on latency.

## The eval

Create 20-30 realistic queries mapped to expected urls or anchors. Aim for Recall@10 of at least 0.8 on this small set. If you are below that, change one thing at a time: ef first, then alpha, then the multivector rerank rule or oversampling size. Keep short notes on what improved and why.

## What to submit

- A single Jupyter notebook that runs end-to-end against Qdrant Cloud: includes data loading, embedding, index/collection creation, upload/upsert, hybrid retrieval, reranking, and result display (page + section + snippet). It must be reproducible (fresh run succeeds with documented config/env variables).
- A tiny accuracy table (Recall@10, MRR, P50/P95) and one short paragraph on your main decisions (chunking, payloads, rerank design, tuning)
- Optional: filters (tags/path), synonym boosts, or quantization if you verified quality stayed acceptable 