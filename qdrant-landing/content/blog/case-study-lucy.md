---
draft: false
title: "How Lucy Built a Source-of-Truth Retrieval Layer for 2.8M+ SEC and DART Filings with Qdrant"
short_description: "Lucy grounds financial AI answers in the original filing with hybrid search and payload filtering on Qdrant."
description: "How Lucy built a retrieval layer over 2.8M+ SEC and DART filings on Qdrant: four-lane hybrid search, payload filtering, and TurboQuant, reaching 94.7% Recall@10 on FinanceBench."
preview_image: /blog/case-study-lucy/social_preview.png
social_preview_image: /blog/case-study-lucy/social_preview.png
date: 2026-09-21T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Lucy
  - case study
  - vector search
  - hybrid search
  - payload filtering
  - quantization
  - RAG
  - financial services
partition: case-studies
---

![Lucy builds data infrastructure for financial AI, turning 2.8M+ SEC and Korea DART filings into structured, source-linked data. Lucy RAG runs hybrid, filter-constrained retrieval on Qdrant, reaching 94.7% Recall@10 on FinanceBench and lifting answer accuracy by 0.160 on a fixed model](/blog/case-study-lucy/bento_box.png)

<a href="https://lucydata.ai/" target="_blank">Lucy</a> builds data infrastructure for financial AI. The company turns large-scale regulatory filings from the U.S. Securities and Exchange Commission (SEC) EDGAR system and Korea's DART disclosure system into structured data that AI systems can search, retrieve, and reason over.

Its corpus covers more than 2.8 million filings across 27 filing and report types, roughly 10 years of history from 2016 to 2026, with new filings processed on a near-real-time basis. On the SEC side that spans corporate, ownership, and fund filings: 10-K, 10-Q, 8-K, 20-F, DEF 14A, S-1, S-3, Forms 3, 4, and 5, 13F, 13D/G, N-1A, N-PORT, and the 485 and 497 series. Asset managers and ETF issuers already build on Lucy's data.

Financial filings are among the hardest documents to make usable for a language model. A single 10-K can run past 200 pages of narrative text, financial tables, images, cross-references, and metadata, and the tables are the part that matters most and parses worst. Lucy's bet is that the filings themselves are the source of truth for financial questions, and that a retrieval layer built around them can outperform a frontier model searching the open web.

## Frontier Models Get Financial Questions Wrong, and That Costs Money

An analyst or investor today has access to ChatGPT, Claude, Gemini, and every other frontier model. Lucy's customers told the team the same thing the team had found on its own: ask those models a specific question about a company's filings and they sometimes return a wrong answer. In finance, a wrong number in the wrong place can cost millions of dollars, so the standard for a usable answer is not "mostly right." It is "traceable to the filing."

{{< quote
  text="Finance is complex, and AI models can sometimes return incorrect answers to specific financial questions. We believe those answers need a source of truth, and for public-company financial data, that source is the original SEC filing."
  name="Jihoi Park"
  role="Co-Founder"
  company="Lucy"
  featured="true" >}}

Building that retrieval layer meant solving two problems at once. The first was data quality: converting 200-page filings into well-organized text, tables that keep their original row and column structure, standardized XBRL (eXtensible Business Reporting Language) financial facts, and source-linked chunks, all while preserving provenance back to the original document.

The second was retrieval precision over a corpus of millions of documents. As Jongbok Lee, a RAG engineer at Lucy, put it, embedding a huge volume of data is not the hard part. Narrowing the search scope so the right chunk ranks first is.

Cost and latency mattered too. Frontier models are expensive, heavy, and slow for this kind of workload. The team wanted to find out whether a well-built retrieval layer could let a small open-weight model answer financial questions as well as, or better than, a frontier model with web search.

## Why Lucy Chose Qdrant for Hybrid Search and Metadata Filtering

Lucy did not run a formal head-to-head benchmark against every alternative. The team picked Qdrant because it matched three specific requirements of an SEC and DART retrieval workload.

The first is filtering. Every question about a filing carries structured signals: which company, which ticker, which Central Index Key (CIK), which form type, which period, which item or section, and often which exact document by accession number. Those signals need to constrain the search before similarity ranking runs, not trim a long candidate list afterward. Qdrant's [payload filtering](https://qdrant.tech/documentation/search/filtering/) applies them inside the query, so the filter and the vector search execute together rather than as two passes.

The second is the search itself. Financial text is full of exact terms, tickers, and line-item names that embeddings alone miss, so Lucy needs dense vectors for semantic matching and sparse vectors for lexical precision in the same query. Qdrant's [hybrid search](https://qdrant.tech/documentation/search/hybrid-queries/) covers both, and Lucy fuses the ranked lists with reciprocal rank fusion (RRF).

{{< quote
  text="Vector search alone can miss important details in financial filings, while sending too much context to an LLM can lead to omissions or hallucinations. Combining keyword and vector search gave us much more reliable retrieval. Qdrant made that hybrid approach easy to implement and scale."
  name="Jongbok Lee"
  role="RAG Engineer"
  company="Lucy" >}}

The third is cost as the corpus grows. New filings arrive continuously, so Lucy needs recall to hold without infrastructure cost tracking corpus size. Native [quantization](https://qdrant.tech/documentation/manage-data/quantization/) keeps the index footprint down, and Qdrant's distributed architecture and sharding give the team room to scale horizontally as coverage expands.

{{< quote
  text="We needed quantization to improve efficiency as the corpus grew, but our main concern was whether it would hurt retrieval quality. In our tests, TurboQuant significantly reduced the memory footprint while keeping retrieval performance nearly unchanged."
  name="Jongbok Lee"
  role="RAG Engineer"
  company="Lucy" >}}

Lucy evaluated TurboQuant on both corpora before committing to it. On its 10-K corpus at 1,536 dimensions, 4-bit TurboQuant cut the observed memory footprint from roughly 52 GB to 10.7 GB, a 4.9x reduction.

The quality cost was small. Measured without metadata filtering:

| Retrieval | Recall@20 | MRR | nDCG@20 |
|---|:---:|:---:|:---:|
| Dense only | -0.8% | -0.3% | -0.6% |
| Hybrid (dense + BM25, RRF) | +0.2% | +0.1% | -0.1% |

Hybrid retrieval was effectively unchanged, because the sparse side recovers what compression costs the dense side. On that basis Lucy runs 2-bit quantization on DART filings, where Korean text produces more chunks per filing and the higher compression ratio saves the most, and a more conservative 4-bit on SEC filings.

## Recall Above 94% on FinanceBench, and a 0.16 Answer Accuracy Gain From Retrieval Alone

Lucy evaluates its retrieval layer against two public finance benchmarks.

| Benchmark | Recall@5 | Recall@10 | nDCG@10 | MRR |
|---|:---:|:---:|:---:|:---:|
| FinanceBench | 93.4% | 94.7% | 0.771 | 0.774 |
| FinQABench | 83.1% | 89.6% | 0.762 | 0.745 |

The more telling test isolates retrieval from the answer model. Holding the answer model fixed (Claude Fable 5) and changing only the context layer, RAGAS Answer Accuracy moved from 0.792 with general web search context to 0.952 with Lucy RAG context, a gain of 0.160 attributable to retrieval alone.

That result also reframes the cost question. In a separate evaluation, an open-weight Gemma model paired with Lucy RAG outscored every frontier model running on web search context.

![RAGAS Answer Accuracy by context layer: an open-weight Gemma model on Lucy RAG context scores 0.863, ahead of three frontier models on web search context at 0.845, 0.792, and 0.786](/blog/case-study-lucy/chart-answer-accuracy.png)

A small model grounded in the right filing chunks beat larger models searching the open web.

{{< quote
  text="Frontier models can be expensive and slower for this type of workload. We found that with a strong RAG system, even a smaller open-source model can produce very competitive results."
  name="Jihoi Park"
  role="Co-Founder"
  company="Lucy" >}}

For Lucy's customers, the payoff is an answer that cites the chunk it came from and highlights the matching passage in the original filing, so an analyst can verify the number before acting on it. The clearest benefit so far is the time it takes to find and verify the right disclosure across a large volume of filings.

## How Lucy RAG Routes a Question Through Qdrant

![Lucy RAG architecture: a router resolves the entity, CIK, and exact filing, then passes payload filters into Qdrant, where four lanes each run the same dense-plus-sparse hybrid query. Reciprocal rank fusion and deduplication reduce the candidates to the top 20 chunks, which the answer model turns into a source-linked answer](/blog/case-study-lucy/lucy-rag-architecture.png)

A query enters Lucy RAG through a router whose first job is to determine which company and which filing the user means. It checks Lucy's catalog database, resolves the entity and CIK, and pins the exact document by SEC accession number or DART listing number. If the question is ambiguous, the router asks the user to clarify before retrieval runs.

Once the target is known, the router passes metadata filters (company, form type, date range, and document ID) to Qdrant, which serves as the main retrieval path. Retrieval runs across four lanes, each executing the same dense-plus-sparse hybrid query with the same filters.

The narrow lane runs focused multi-query retrieval with section filters for precision. The broad lane searches more widely as a safety net for recall and always runs alongside the narrow lane. The XBRL lane runs only for questions about financial statements or figures, adding the relevant XBRL tags to pull the right financial table higher in the ranking. The companion lane runs when a filing incorporates another by reference, for example a DEF 14A proxy statement referenced from a 10-K.

Each active lane returns up to 60 candidates. Lucy fuses the ranked lists with RRF, deduplicates them, and passes the final top 20 chunks to the answer model. A supplementary knowledge base in Amazon S3 holds preprocessed summaries and key financial facts for each filing, which the pipeline selects by topic and adds as extra context. The team is also adding a Neo4j graph layer to capture relationships between filings, starting with amendments.

Across 1,517 measured searches, Qdrant averaged 32 ms per search, with a p50 of 16 ms and a p90 of 82 ms. The lanes separate cleanly by how much they constrain the search.

| Lane | Average | p50 | p90 |
|---|:---:|:---:|:---:|
| Narrow | 23 ms | 9 ms | 62 ms |
| XBRL | 27 ms | 10 ms | 81 ms |
| Broad | 42 ms | 27 ms | 105 ms |
| Narrow + Broad (1,208 searches) | 34 ms | 21 ms | 83 ms |
| Narrow + XBRL + Broad (298 searches) | 26 ms | 9 ms | 81 ms |

The broad lane is the slowest because it applies the least restrictive filters over the widest scope, which is the same property that makes it useful as a recall safety net. The narrow and XBRL lanes, which carry tighter filters, finish in single-digit milliseconds at p50.

## What Running This in Production Looks Like

Lucy runs Qdrant self-hosted. Production holds 12 collections with roughly 52.25 million dense vectors and the same number of sparse vectors, and both figures keep climbing as the team embeds more SEC and DART filings.

The two corpora use different dense models and share a sparse one.

| | Dense embeddings | Sparse retrieval |
|---|---|---|
| SEC | OpenAI `text-embedding-3-small`, 1,536 dimensions | BM25 |
| DART | Upstage `solar-embedding-2`, 1,024 dimensions | BM25 |

Chunk counts differ by corpus as well, because Korean text produces higher token counts under Lucy's current tokenization and chunking setup. That difference is part of why DART gets the more aggressive 2-bit quantization.

![Chunks per filing for SEC and DART at P25, average, P75, and P90. SEC runs 91, 194, 236, and 373; DART runs 178, 418, 520, and 846, roughly double at every point in the distribution](/blog/case-study-lucy/chart-chunks-per-filing.png)

The collection layout took a round of iteration to get right, and it is the clearest lesson from Lucy's scaling experience. The team initially stored every SEC filing type in a single collection and prefixed each chunk with metadata such as company name, ticker, and report date. That worked at small scale. As coverage expanded, retrieval latency rose by roughly 2x to 3x and recall declined.

Lucy split the data into collections by filing type and moved that metadata out of the chunk text and into indexed payload fields: `accession_number` (`receipt_number` on the DART side), `chunk_type`, and `item_key`, plus the additional fields each document type needs for filtering. Narrowing the search scope this way improved latency and recall together as the corpus kept growing.

All of this is operated by a team of fewer than ten engineers across both the SEC and DART sides.

## What's Next: Benchmark Generation and Evaluation on the Same Retrieval Layer

Lucy is expanding on three fronts. Coverage will grow beyond the current 27 filing types and 10-year window, and the Korean DART corpus is available to partners interested in that market. The Neo4j graph layer will move amendment and cross-filing relationships into retrieval.

And the company is exploring partnerships with expert-led AI training and evaluation firms to automate the creation of private financial benchmarks grounded in verifiable filing evidence, which would extend Qdrant's role from retrieval into benchmark generation and evaluation workflows.

## From Plausible Answers to Verifiable Ones

Lucy started from the premise that frontier models alone cannot be trusted with financial questions, and that the filings are the source of truth. Making 2.8 million filings retrievable required preserving their structure at ingestion and constraining retrieval at query time.

With hybrid search, payload filtering, and quantization in Qdrant, Lucy RAG holds Recall@10 at 94.7% on FinanceBench, lifts answer accuracy by 0.160 on a fixed model, and lets an open-weight model outperform frontier models with web search, on a footprint a team of fewer than ten engineers can operate. The answer an analyst gets now comes with the filing passage it came from.
