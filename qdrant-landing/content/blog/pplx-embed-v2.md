---
title: "Late Interaction at Scale: TurboQuant and pplx-embed-v2"
slug: pplx-embed-v2
short_description: "Late interaction models store one vector per token. TurboQuant in Qdrant brings a pplx-embed-v2 page image from 856 KB to 40 KB."
description: "Late interaction at scale with Perplexity's pplx-embed-v2 and Qdrant TurboQuant: a million page images fit in about 40 GB and keep 96.5% of retrieval quality, or 99.9% with rescoring."
preview_image: /blog/pplx-embed-v2/hero.jpg
social_preview_image: /blog/pplx-embed-v2/hero.jpg
date: 2026-10-12
author: Qdrant Team
featured: false
tags:
  - embeddings
  - quantization
  - multivector
  - late interaction
  - TurboQuant
  - Perplexity
---

Perplexity released [pplx-embed-v2-late](https://huggingface.co/collections/perplexity-ai/pplx-embed-v2), two late interaction models that search document pages as images. A page goes into the model as a picture, so its tables, charts, and layout reach the embedding as they appear on the page, with no OCR step in between.

Searching pages as images works well. On four ViDoRe v3 document sets, page images retrieve slightly better than the same pages converted to markdown, with nDCG@10 of 0.681 against 0.671 for the 9b model.

## The cost of a page image

Late interaction models keep one vector per token, not one per document. pplx-embed-v2-late turns each page image into about 1,700 vectors of 128 dimensions and scores queries against all of them with MaxSim. That's 856 KB per page in float32. A million pages would need over 800 GB for their vectors alone.

## TurboQuant brings a page down to 40 KB

[TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) stores each vector in a few bits. At 1 bit, a page image takes 40 KB instead of 856 KB, 21x less, and a million pages fit in about 40 GB.

{{< chart id="pplx-embed-v2/page-size-vs-retention" caption="Storage per page image counts the 1-bit codes only, not the original vectors kept for rescoring. Averaged over four ViDoRe v3 sets. Rescoring uses 4x oversampling." >}}

Without rescoring, search keeps 96.5% of the retrieval quality of the original vectors. Rescoring checks the top candidates against the original vectors and brings it to 99.9%. The full results add 2-bit and 4-bit TurboQuant and binary quantization. Every setting comes back to 99.4% or more with rescoring. Without it, TurboQuant keeps 96.5% or more at every bit width, while 1-bit binary quantization drops to 76.4%.

{{< chart id="pplx-embed-v2/quantization-settings" caption="pplx-embed-v2-late-9b on page images, averaged over four ViDoRe v3 sets. Storage per page image counts the quantized codes only. Rescoring uses 4x oversampling." >}}

<aside role="status">
We tested four public ViDoRe v3 sets (HR, finance, industrial, and pharmaceuticals, 11,609 pages in total) with 200 English queries each. Each page is a multivector point in Qdrant, and every search scans all of its vectors, so only quantization changes between runs. Percentages are the share of nDCG@10 kept compared with exact float32 search using the same models.
</aside>

## Index with the 9b, query with the 0.6b

The two models share one embedding space. You can index pages once with the 9b and embed queries with the 0.6b, which has about 20x fewer active parameters, so every query costs much less to embed.

{{< chart id="pplx-embed-v2/cross-model" caption="Searching the 9b index with 0.6b queries scores between the two single-model setups on every dataset, with the largest gain on FiQA." >}}

On page images, 0.6b queries against the 9b index score 0.670 nDCG@10, between the 0.6b alone at 0.666 and the 9b at 0.681. On FiQA text retrieval the gain is larger: 0.588, against 0.522 and 0.622. The mixed setup compresses just as well. With 1-bit TurboQuant it keeps 96.6% without rescoring and 100% with it.

## Try it

Set up a [multivector collection](/documentation/manage-data/vectors/#multivectors) with [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) at 1 bit and rescoring off, and compare the results with an unquantized collection on your own queries. Turn rescoring on when you need every last point.

## Thanks

We're grateful to the Perplexity team for making pplx-embed-v2 openly available.
