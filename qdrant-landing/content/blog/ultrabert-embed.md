---
title: "UltraBERT Fits 32K Tokens in One Vector. RIP Chunking?"
draft: false
slug: ultrabert-embed
short_description: "UltraBERT-Embed-150M embeds a 32K-token document in one vector. We tested in Qdrant whether that can replace chunking, from a few hundred documents to 200,000."
description: "UltraBERT-Embed-150M in Qdrant: whole-document vectors vs 512-token chunks on LongEmbed and 200,000 articles, with 1-bit TurboQuant."
preview_image: /blog/ultrabert-embed/hero.jpg
social_preview_image: /blog/ultrabert-embed/preview/social_preview.jpg
date: 2026-10-19
author: Dylan Couzon, Anush
author_profile: dylan-couzon
featured: true
weight: 0
tags:
  - embeddings
  - long context
  - chunking
  - quantization
  - TurboQuant
  - UltraBERT
---

Every retrieval pipeline starts with the same call: how big is a chunk? Too small, and a chunk loses its context. Too big, and the embedding model cuts it off.

DMIS Lab's [UltraBERT-Embed-150M](https://huggingface.co/dmis-lab/UltraBERT-Embed-150M) moves that cutoff to 32K tokens. It's a 151M-parameter dense embedding model built on [UltraBERT](https://huggingface.co/blog/dmis-lab/ultrabert), an English encoder trained for 32K-token inputs. Most documents fit in one pass, and you get back one 768-dimension vector.

So is chunking dead? We tested it in Qdrant: one vector per document against 512-token chunks, the two together, and both compressed.

## How We Tested

We used five tasks from [LongEmbed](https://huggingface.co/datasets/dwzhu/LongEmbed), a long-document benchmark. Its documents average 7,600 to 13,800 tokens. Each task asks a different kind of question:

- **[SummScreenFD](https://arxiv.org/abs/2104.07091):** the query summarizes a TV episode, and the right document is its transcript.
- **[2WikiMultihopQA](https://arxiv.org/abs/2011.01060):** multi-hop questions over Wikipedia passages.
- **[QMSum](https://arxiv.org/abs/2104.05938):** the query summarizes one part of a meeting transcript.
- **[Passkey](https://arxiv.org/abs/2305.16300):** each document hides a pass key in filler text, and the query asks for that key.
- **[Needle](https://github.com/gkamradt/needle-in-a-haystack):** each document is an essay with one unrelated sentence added, and the query asks about that sentence.

To test at scale, we also used [MLDR](https://huggingface.co/datasets/Shitao/MLDR): 200,000 English Wikipedia articles and 800 questions, each about one article.

We embedded every document in two ways:

- **Whole document:** one vector for the full text, up to 32K tokens.
- **512-token chunks:** one vector per chunk. A document scores by its best chunk.

The [full results](#full-results) are at the end.

## Chunks Still Find the Details

The whole-document vector really reads all 32K tokens. On Passkey, it ranked the right document first 99% of the time across all lengths, and every time at 32K tokens. But on most other tasks, chunks scored higher.

{{< chart id="ultrabert-embed/representations" caption="Passkey and Needle average all document lengths. SummScreen is SummScreenFD, and 2Wiki is 2WikiMultihopQA." >}}

Chunks won when the answer is in a few passages: on 2WikiMultihopQA, QMSum, and MLDR. The whole-document vector won only on SummScreenFD, where the query describes the whole episode.

Needle shows why chunks win. One vector can't hold every detail of a long document. At 256 tokens, the whole-document vector ranked the right essay first 84% of the time. At 32K tokens, it did so only 30% of the time. At the same length, 512-token chunks got 56%.

We also tried using both. In Qdrant, one point can hold two [named vectors](/documentation/manage-data/vectors/#named-vectors): the whole-document vector, and the chunk vectors as a [multivector](/documentation/manage-data/vectors/#multivectors). A [hybrid query](/documentation/search/hybrid-queries/) searches both and fuses the results. This helped a little on SummScreenFD and Needle, by up to 0.02 and 0.03 over chunks alone. On 2WikiMultihopQA, QMSum, and MLDR, it did worse than chunks alone, most of all on MLDR.

## Chunk Vectors for 200,000 Articles in About 140 MB

Chunks mean more vectors. MLDR's articles split into 7 chunks each on average, 1.43 million vectors in total. In float32, that's about 4 GB.

1-bit [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization) shrinks each vector from 3,072 bytes to 104. That's 30x smaller, and about 140 MB for all 200,000 articles. We stored each chunk as its own Qdrant point, and a [grouped search](/documentation/search/search/#search-groups) returns each article once.

Against exact search, the compressed vectors kept 95% of the quality, and 98% with rescoring. The uncompressed vectors in the same index kept 99%. Rescoring has a cost. In our setup, the original vectors were on disk. Reading them added 4 to 11 ms per query, or over 100 ms while the disk cache was cold.

{{< chart id="ultrabert-embed/storage" caption="MLDR, one Qdrant point per chunk. Sizes count only the vectors searched in RAM (1 KB = 1,024 bytes)." caption2="MLDR, one Qdrant point per chunk. Retained against exact float32 search." >}}

A whole-document vector compresses less well than chunk vectors. On MLDR, it kept 89% of its quality at 1 bit. At 2 bits, it scored the same as the uncompressed vector in the same index, so start it there, or keep rescoring on.

## So Is Chunking Dead?

Not just yet. In these tests, chunks still found details better. We'd keep them as the starting point for detail search, even when the whole document fits.

UltraBERT gives us room to try retrieval at different scales. We could search whole documents to find the right topic, then search their chunks for the answer. That's worth testing, especially since combining both searches didn't consistently help here.

Whole-document vectors still have a cost. Embedding SummScreenFD's transcripts whole took about 3x as long as embedding 512-token chunks on our NVIDIA L4.

For detail search, we'd start with 512-token chunks and test 256 for single facts. Compression makes the extra vectors more affordable, though quality and rescoring latency still need testing on your own queries.

The 32K-token window gives us more freedom over what each vector represents. The next question is how to use that freedom to find better answers.

## Full Results

<details>
<summary>Document Representations</summary>

Exact search. DBSF and RRF are the two ways a hybrid query fuses the whole-document and chunk searches. RRF ×1.5 weights the chunk search 1.5 times, a weight we picked on these tasks.

| Representation | SummScreenFD | 2WikiMultihopQA | QMSum | Passkey | Needle | MLDR (200K) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| *Metric* | *nDCG@10* | *nDCG@10* | *nDCG@10* | *recall@1* | *recall@1* | *nDCG@10* |
| Whole document | 0.974 | 0.929 | 0.536 | 0.993 | 0.660 | 0.509 |
| 512-token chunks | 0.954 | 0.991 | 0.712 | 1.000 | 0.713 | 0.683 |
| 256-token chunks | 0.929 | 0.993 | 0.703 | 1.000 | 0.858 | N/A |
| Whole + chunks, DBSF | 0.974 | 0.982 | 0.694 | 1.000 | 0.743 | 0.613 |
| Whole + chunks, RRF, chunks ×1.5 | 0.971 | 0.980 | 0.706 | 1.000 | 0.720 | 0.644 |

</details>

<details>
<summary>Quantization on MLDR</summary>

200,000 English Wikipedia articles and 800 questions, each about one article, searched with HNSW. Rescoring uses 2x oversampling. Sizes count only the vectors searched in RAM. 1 KB is 1,024 bytes.

| Representation | Storage | KB per Article | nDCG@10, No Rescoring | nDCG@10, With Rescoring |
| --- | --- | ---: | ---: | ---: |
| 512-token chunks | Original float32 | 21.4 | 0.675 | N/A |
| 512-token chunks | 1-bit TurboQuant | 0.724 | 0.651 | 0.670 |
| Whole document | Original float32 | 3.00 | 0.496 | N/A |
| Whole document | 1-bit TurboQuant | 0.102 | 0.455 | 0.496 |
| Whole document | 2-bit TurboQuant | 0.195 | 0.496 | 0.506 |

</details>

<details>
<summary>Short Passages (BEIR)</summary>

For comparison with long documents: short passages, one vector each, on five [BEIR](https://arxiv.org/abs/2104.08663) datasets (SciFact, NFCorpus, ArguAna, SCIDOCS, and FiQA), with HNSW. Score kept is against exact float32 search.

| Representation | Bytes per Vector | Score Kept, No Rescoring | Score Kept, With Rescoring |
| --- | ---: | ---: | ---: |
| Original float32 | 3,072 | 99.8% | N/A |
| int8 | 772 | 99.7% | 99.7% |
| 4-bit TurboQuant | 392 | 99.5% | 99.8% |
| 2-bit TurboQuant | 200 | 98.7% | 99.8% |
| 1-bit TurboQuant | 104 | 94.8% | 99.4% |
| 2-bit binary, 8-bit query | 192 | 96.9% | 99.8% |
| 1-bit binary, 8-bit query | 96 | 93.4% | 99.5% |

</details>

Thanks to DMIS Lab for UltraBERT-Embed, and for giving us a good reason to revisit chunking.
