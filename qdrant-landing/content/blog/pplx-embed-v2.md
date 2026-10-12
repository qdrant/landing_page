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

Perplexity released [pplx-embed-v2-late](https://huggingface.co/collections/perplexity-ai/pplx-embed-v2), two late interaction models that search document pages as images, with no OCR step. We tested how far we could shrink their page vectors in Qdrant while keeping retrieval quality.

A page image starts at 856 KB of vectors. With 1-bit TurboQuant it takes 40 KB, 21x less, and keeps 96.5% of its retrieval quality without rescoring. With rescoring, it keeps 99.9%.

{{< chart id="pplx-embed-v2/page-size-vs-retention" caption="Storage per page image counts the quantized token vectors only, not original vectors kept for rescoring. Averaged over four ViDoRe v3 sets. Rescoring uses 4x oversampling." >}}

## Two models, one embedding space

The release has two models, `pplx-embed-v2-late-0.6b` and `pplx-embed-v2-late-9b`. Both read text and page images and produce one 128-dimension vector per token, scored with MaxSim. A page image becomes about 1,700 vectors, 856 KB in float32. A million pages would need over 800 GB.

The two models share one embedding space, so the 0.6b model can search an index built with the 9b.

## How we tested it

We used four public [ViDoRe v3](https://huggingface.co/vidore) sets (HR, finance, industrial, and pharmaceuticals, 11,609 pages in total) with 200 English queries each, and indexed every page as its rendered image. Each page is a [multivector](/documentation/manage-data/vectors/#multivectors) point in Qdrant, and every search scans all of its vectors, so the only thing that changes between runs is quantization. Every percentage in this post is the share of nDCG@10 a configuration keeps, compared with exact float32 search using the same models.

## A million pages in 40 GB

The storage chart shows late-9b on page images, averaged over the four sets. At 4 bits, [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) keeps 99.4% of the quality in 7x less space, with no rescoring. At 1 bit, a million pages fit in about 40 GB and keep 96.5%. Rescoring with 4x oversampling brings every TurboQuant setting to 99.9% or higher.

For token vectors, TurboQuant beats binary quantization. At 1 bit without rescoring, TurboQuant keeps 96.5% and binary quantization keeps 76.4%. If you use binary quantization, turn on rescoring.

## Index with the 9b, query with the 0.6b

Index pages once with the 9b and embed queries with the 0.6b, which has about 20x fewer active parameters.

{{< chart id="pplx-embed-v2/cross-model" caption="Searching the 9b index with 0.6b queries scores between the two single-model setups on every dataset, with the largest gain on FiQA." >}}

With 1-bit TurboQuant, the mixed setup keeps 96.6% without rescoring and 100% with it. On text retrieval the gain from the 9b index is larger: on FiQA, 0.6b queries against the 9b index score 0.588, against 0.522 for the 0.6b model alone and 0.622 for the 9b.

## Images or markdown?

We also indexed every page as markdown. Page images score a little higher (0.681 against 0.671 with late-9b) and use 2 to 5.5x more vectors. With 1-bit TurboQuant, a markdown page takes 14 KB and a page image 40 KB.

## Set up a late interaction collection

Start with 1-bit TurboQuant and rescoring off, and compare the results with an unquantized collection on your own queries. That gives you 21x less vector memory and keeps 96.5% of the model's retrieval quality. Turn rescoring on when you need every last point.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")
client.create_collection(
    "pages",
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        multivector_config=models.MultiVectorConfig(comparator=models.MultiVectorComparator.MAX_SIM),
    ),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(bits=models.TurboQuantBitSize.BITS1, always_ram=True)
    ),
)
```

## Thanks

We're grateful to the Perplexity team for making pplx-embed-v2 openly available.
