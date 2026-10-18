---
title: "Perplexity's New Late-Interaction Models Meet Qdrant's 21x Vector Compression"
draft: false
slug: pplx-embed-v2
short_description: "Search PDF pages as images with pplx-embed-v2. Qdrant TurboQuant shrinks their vectors 21x while retaining 96.5% of retrieval quality in our tests."
description: "Search PDF pages with pplx-embed-v2 and Qdrant TurboQuant: 21x smaller vectors, retaining 96.5% of retrieval quality in our tests."
preview_image: /blog/pplx-embed-v2/hero.jpg
social_preview_image: /blog/pplx-embed-v2/preview/social_preview.jpg
date: 2026-10-13
author: Dylan Couzon, Anush Shetty
author_profile: dylan-couzon
featured: true
weight: 0
tags:
  - embeddings
  - quantization
  - multivector
  - late interaction
  - TurboQuant
  - Perplexity
---

A number in a financial report needs its row, column, and unit to mean anything. A chart needs its labels. When you build search over PDFs, that context is part of what you want to retrieve.

Perplexity released [pplx-embed-v2-late](https://huggingface.co/collections/perplexity-ai/pplx-embed-v2), two late interaction models that search document pages as images. The model embeds the page image, including its tables, charts, and layout. You can skip the optical character recognition (OCR) step and search the page as it appears.

The catch is the size of that representation. We tested how far we could shrink it in Qdrant while keeping the retrieval quality.

## One Page, About 1,700 Vectors

Late interaction models keep one vector per token. pplx-embed-v2-late turns each page image into about 1,700 vectors of 128 dimensions. MaxSim scores a page by finding the best document-vector match for each query token and summing those matches.

That's 856 KB per page in float32. A million pages would need over 800 GB for their vectors alone.

## 21x Smaller Vectors, 96.5% of the Quality

Qdrant's [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) stores each vector in a few bits. At 1 bit, the compressed vectors take 40 KB per page instead of 856 KB. That's a 21x reduction without removing tokens or converting the page to text.

In our tests, searching the compressed vectors retained 96.5% of the retrieval quality we got with float32. Rescoring checks the top candidates against the original vectors and raises that to 99.9%.

{{< chart id="pplx-embed-v2/page-size-vs-retention" caption="Per-page vector size for pplx-embed-v2-late-9b. The 40 KB counts compressed vectors only; Qdrant also stores the originals. Rescoring uses four times as many candidates." caption2="Retrieval quality retained against exact float32 search, averaged over four ViDoRe v3 sets. Rescoring uses four times as many candidates. Higher is better." >}}

For a million pages, the compressed representation is about 40 GB, with original vectors stored separately. To reduce RAM use, [keep compressed vectors in RAM and originals on disk](/documentation/manage-data/quantization/#memory-and-speed-tuning).

At the same 1-bit setting without rescoring, binary quantization kept 76.4% of retrieval quality and TurboQuant kept 96.5%. The [full results](#full-results) include the other bit widths and rescoring settings.

## Index Big. Query Small.

You can reuse a document embedding across searches. Every new query needs its own. We think it makes sense to spend more compute on indexing than on each query. We tested that idea with [Constella](/blog/constella-research-preview/), our own model family, currently in research preview.

Perplexity's models give you the same choice. The two models share one embedding space, so you can index pages once with the 9b and embed queries with the 0.6b, which has about 20x fewer active parameters. On page images, this pairing scored 0.670 nDCG@10, between 0.666 for the 0.6b alone and 0.681 for the 9b.

## What This Means for OCR

We think OCR should become optional for document retrieval. For visually rich PDFs, we'd test searching page images before building a text-extraction pipeline. You still need OCR if your application needs extracted text or structured fields.

In our tests, page images scored 0.681 nDCG@10 with the 9b, against 0.671 for the same pages converted to Markdown. A Markdown page took 14 KB of compressed vectors, compared with 40 KB for a page image. Keep the page image when its layout matters; test Markdown when text carries the information you need.

## Full Results

We tested four public [ViDoRe v3](https://huggingface.co/vidore) sets (HR, finance, industrial, and pharmaceuticals, 11,609 pages in total) with 200 English queries each. Each page is a multivector point in Qdrant, and every search scans all of its vectors, so only quantization changes between runs.

We measured ranking quality with normalized discounted cumulative gain at 10 (nDCG@10). Retained quality is the share of the exact float32 score kept with the same models, averaged over the four sets. The million-page sizes are projections from the per-page vector sizes, rather than a million-page search benchmark.

<details>
<summary>All Quantization Settings</summary>

The table compares vector size and retained retrieval quality for the 9b model on page images. Compressed sizes exclude the originals; rescoring uses 4x oversampling.

| Representation | KB per Page | Without Rescoring | With Rescoring |
| --- | ---: | ---: | ---: |
| Original float32 | 856 | 100% | N/A |
| 4-bit TurboQuant | 120 | 99.4% | 100% |
| 2-bit TurboQuant | 67 | 98.5% | 99.9% |
| 2-bit binary | 54 | 95.6% | 99.9% |
| 1-bit TurboQuant | 40 | 96.5% | 99.9% |
| 1-bit binary | 27 | 76.4% | 99.4% |

</details>

<details>
<summary>Index and Query Model Comparison</summary>

The table shows exact float32 nDCG@10 for each model pairing. Page results are averages over the four ViDoRe v3 sets; FiQA is a separate text retrieval test.

| Input | 0.6b Index and Queries | 9b Index, 0.6b Queries | 9b Index and Queries |
| --- | ---: | ---: | ---: |
| Page images | 0.666 | 0.670 | 0.681 |
| Page Markdown | 0.653 | 0.658 | 0.671 |
| FiQA text | 0.522 | 0.588 | 0.622 |

The gain over using the smaller model alone was modest on page images and larger on FiQA text retrieval. With 1-bit TurboQuant, the mixed setup kept 96.6% without rescoring and 100% with it, compared with the same pairing in float32.

</details>

Set up a [multivector collection](/documentation/manage-data/vectors/#multivectors) with [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) at 1 bit. Compare compressed search against an unquantized baseline on your own queries, with [rescoring explicitly disabled](/documentation/manage-data/quantization/#searching-with-quantization). Then turn rescoring on and check whether the quality gain is worth the extra reads from the original vectors.

We're grateful to the Perplexity team for making pplx-embed-v2 openly available.
