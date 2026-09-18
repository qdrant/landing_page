---
draft: false
title: "How Lucy Built a Source-of-Truth Retrieval Layer for 2.8M+ SEC and DART Filings with Qdrant"
short_description: "Lucy grounds financial AI answers in the original filing with hybrid search and payload filtering on Qdrant."
description: "How Lucy built a retrieval layer over 2.8M+ SEC and DART filings on Qdrant: four-lane hybrid search, payload filtering, and TurboQuant, reaching 94.7% Recall@10 on FinanceBench."
preview_image: /blog/case-study-lucy/social_preview.png
social_preview_image: /blog/case-study-lucy/social_preview.png
date: 2026-09-18T00:00:00.000Z
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

Its corpus covers more than 2.8 million filings across 27 filing and report types, roughly 10 years of history from 2016 to 2026, with new filings processed on a near-real-time basis. Wall Street firms including GraniteShares, VistaShares, and Canary Capital already use Lucy's data.

Financial filings are among the hardest documents to make usable for a language model. A single 10-K can run past 200 pages of narrative text, financial tables, images, cross-references, and metadata, and the tables are the part that matters most and parses worst. Lucy's bet is that the filings themselves are the source of truth for financial questions, and that a retrieval layer built around them can outperform a frontier model searching the open web.

## Frontier Models Get Financial Questions Wrong, and That Costs Money

An analyst or investor today has access to ChatGPT, Claude, Gemini, and every other frontier model. Lucy's customers told the team the same thing the team had found on its own: ask those models a specific question about a company's filings and they sometimes return a wrong answer. In finance, a wrong number in the wrong place can cost millions of dollars, so the standard for a usable answer is not "mostly right." It is "traceable to the filing."

{{< quote
  text="The finance field is so complicated and so complex. When you give a question to AI, sometimes it gives a wrong answer. We think we need a source of truth for the data, and we think it is the SEC filings."
  name="Glen Park"
  company="Lucy"
  featured="true" >}}

Building that retrieval layer meant solving two problems at once. The first was data quality: converting 200-page filings into well-organized text, tables that keep their original row and column structure, standardized XBRL (eXtensible Business Reporting Language) financial facts, and source-linked chunks, all while preserving provenance back to the original document.

The second was retrieval precision over a corpus of millions of documents. As Jongbok Lee, who leads Lucy's retrieval engineering, put it, embedding a huge volume of data is not the hard part. Narrowing the search scope so the right chunk ranks first is.

Cost and latency mattered too. Frontier models are expensive, heavy, and slow for this kind of workload. The team wanted to find out whether a well-built retrieval layer could let a small open-weight model answer financial questions as well as, or better than, a frontier model with web search.

## Why Lucy Chose Qdrant for Hybrid Search and Metadata Filtering

Lucy's retrieval design depends on doing two things in the same query. Every question about a filing carries structured signals: which company, which Central Index Key (CIK), which form type, which period, and often which exact document by accession number. Those signals need to constrain the search before similarity ranking runs, not trim a long candidate list afterward. On top of that constraint, the search itself needs both dense vectors for semantic matching and sparse vectors for the exact terms, tickers, and line-item names that dominate financial text.

Qdrant's [hybrid search](https://qdrant.tech/documentation/search/hybrid-queries/) covers the dense and sparse side, and [payload filtering](https://qdrant.tech/documentation/search/filtering/) applies the company, form type, date range, and document ID filters inside the query. Lucy runs the same hybrid query with the same filters across several retrieval lanes and fuses the ranked lists with reciprocal rank fusion (RRF).

{{< quote
  text="If you embed a huge volume of data, it is important to narrow down the scope to improve recall and precision. We provide structured metadata for filtering in the vector search engine, and it's really effective for improving recall and accuracy."
  name="Jongbok Lee"
  company="Lucy" >}}

Memory efficiency was the other requirement. Lucy evaluated Qdrant's [TurboQuant quantization](https://qdrant.tech/documentation/manage-data/quantization/) on both the SEC and DART corpora and now applies 4-bit quantization to SEC filings and 2-bit quantization to DART filings, an 8x and 16x reduction in vector storage respectively, while holding retrieval quality. TurboQuant compresses only the stored vectors and scores queries in full precision, so the accuracy cost of that compression stays small.

## Recall Above 94% on FinanceBench, and a 0.16 Answer Accuracy Gain From Retrieval Alone

Lucy evaluates its retrieval layer against two public finance benchmarks.

| Benchmark | Recall@5 | Recall@10 | nDCG@10 | MRR |
|---|:---:|:---:|:---:|:---:|
| FinanceBench | 93.4% | 94.7% | 0.771 | 0.774 |
| FinQABench | 83.1% | 89.6% | 0.762 | 0.745 |

The more telling test isolates retrieval from the answer model. Holding the answer model fixed (Claude Fable 5) and changing only the context layer, RAGAS Answer Accuracy moved from 0.792 with general web search context to 0.952 with Lucy RAG context, a gain of 0.160 attributable to retrieval alone.

That result also reframes the cost question. In a separate evaluation, an open-weight Gemma model paired with Lucy RAG scored 0.863 on answer accuracy, while several frontier models using web search scored 0.845, 0.792, and 0.786. A small model grounded in the right filing chunks beat larger models searching the open web.

{{< quote
  text="GPT and Gemini are quite expensive, very heavy, and very slow. We found that if we build the RAG system well, we can get quite good results even with a small open-source model."
  name="Glen Park"
  company="Lucy" >}}

For Lucy's customers, the payoff is an answer that cites the chunk it came from and highlights the matching passage in the original filing, so an analyst can verify the number before acting on it.

## How Lucy RAG Routes a Question Through Qdrant

A query enters Lucy RAG through a router whose first job is to determine which company and which filing the user means. It checks Lucy's catalog database, resolves the entity and CIK, and pins the exact document by SEC accession number or DART listing number. If the question is ambiguous, the router asks the user to clarify before retrieval runs.

Once the target is known, the router passes metadata filters (company, form type, date range, and document ID) to Qdrant, which serves as the main retrieval path. Retrieval runs across four lanes, each executing the same dense-plus-sparse hybrid query with the same filters.

The narrow lane runs focused multi-query retrieval with section filters for precision. The broad lane searches more widely as a safety net for recall and always runs alongside the narrow lane. The XBRL lane runs only for questions about financial statements or figures, adding the relevant XBRL tags to pull the right financial table higher in the ranking. The companion lane runs when a filing incorporates another by reference, for example a DEF 14A proxy statement referenced from a 10-K.

![Lucy RAG architecture: a router resolves the entity, CIK, and exact filing, then passes payload filters into Qdrant, where four lanes each run the same dense-plus-sparse hybrid query. Reciprocal rank fusion and deduplication reduce the candidates to the top 20 chunks, which the answer model turns into a source-linked answer](/blog/case-study-lucy/lucy-rag-architecture.png)

Each active lane returns up to 60 candidates. Lucy fuses the ranked lists with RRF, deduplicates them, and passes the final top 20 chunks to the answer model. A supplementary knowledge base in Amazon S3 holds preprocessed summaries and key financial facts for each filing, which the pipeline selects by topic and adds as extra context. The team is also adding a Neo4j graph layer to capture relationships between filings, starting with amendments.

## What's Next: Benchmark Generation and Evaluation on the Same Retrieval Layer

Lucy is expanding on three fronts. Coverage will grow beyond the current 27 filing types and 10-year window, and the Korean DART corpus is available to partners interested in that market. The Neo4j graph layer will move amendment and cross-filing relationships into retrieval.

And the company is exploring partnerships with expert-led AI training and evaluation firms to automate the creation of private financial benchmarks grounded in verifiable filing evidence, which would extend Qdrant's role from retrieval into benchmark generation and evaluation workflows.

## From Plausible Answers to Verifiable Ones

Lucy started from the premise that frontier models alone cannot be trusted with financial questions, and that the filings are the source of truth. Making 2.8 million filings retrievable required preserving their structure at ingestion and constraining retrieval at query time.

With hybrid search, payload filtering, and quantization in Qdrant, Lucy RAG holds Recall@10 at 94.7% on FinanceBench, lifts answer accuracy by 0.160 on a fixed model, and lets an open-weight model outperform frontier models with web search. The answer an analyst gets now comes with the filing passage it came from.
