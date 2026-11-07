---
title: "Does a Code-Tuned Embedding Model Pay Off? papr-embed-code-1 in Qdrant"
draft: false
slug: papr-embed-code
short_description: "Papr fine-tuned Qwen3-Embedding for code search. We tested it in Qdrant on code it never saw, compressed to 1 bit, and on a million snippets."
description: "papr-embed-code-1 in Qdrant: code retrieval against its Qwen3-Embedding base, 1-bit TurboQuant, BM25 with the code tokenizer, and 1M filtered snippets."
preview_image: /blog/papr-embed-code/hero.jpg
social_preview_image: /blog/papr-embed-code/preview/social_preview.jpg
date: 2026-10-30
author: Dylan Couzon, Anush
author_profile: dylan-couzon
featured: true
weight: 0
tags:
  - embeddings
  - code search
  - quantization
  - TurboQuant
  - hybrid search
---

If you search code, you've probably asked this: is a code-specific embedding model worth it, or is a strong general one good enough?

Papr's [papr-embed-code-1](https://paprai.substack.com/p/introducing-papr-embed-schema-native) is a good test case. It's [Qwen3-Embedding](https://huggingface.co/Qwen/Qwen3-Embedding-4B) trained further on code retrieval, with open weights in two sizes: [0.6B](https://huggingface.co/papr-ai/papr-embed-code-1-0.6b) and [4B](https://huggingface.co/papr-ai/papr-embed-code-1-4b). Papr reports top scores on CoIR, a code retrieval benchmark. But it trained on CoIR's training data, and its model card says so.

So we asked a narrower question. Does it beat the model it started from on code it never saw? And what does it cost to run in Qdrant?

## How We Tested

We compared each papr-embed-code-1 model with the Qwen3-Embedding model it was trained from, with the same query instructions. The tasks come in three groups:

- **Code Papr didn't train on:** [HumanEval](https://huggingface.co/datasets/embedding-benchmark/HumanEval) and [MBPP](https://huggingface.co/datasets/embedding-benchmark/MBPP) match a task description to the Python function that solves it. [FreshStack](https://huggingface.co/datasets/embedding-benchmark/FreshStack_mteb) matches a Stack Overflow question to the files of the library it's about. [WikiSQL](https://huggingface.co/datasets/embedding-benchmark/WikiSQL_mteb) matches a question about a table to its SQL query.
- **Code Papr trained on:** three CoIR tasks. [APPS](https://huggingface.co/datasets/CoIR-Retrieval/apps) matches a programming problem to its solution. [CodeTransOcean Contest](https://huggingface.co/datasets/CoIR-Retrieval/codetrans-contest) matches a program to the same program in another language. [StackOverflowQA](https://huggingface.co/datasets/CoIR-Retrieval/stackoverflow-qa) matches a question to its answer.
- **Prose:** four BEIR datasets, [NFCorpus](https://huggingface.co/datasets/mteb/nfcorpus), [ArguAna](https://huggingface.co/datasets/mteb/arguana), [SCIDOCS](https://huggingface.co/datasets/mteb/scidocs), and [FiQA](https://huggingface.co/datasets/mteb/fiqa).

Where Papr publishes scores for these tasks, ours match to within 0.02 points. The [full results](#full-results) are at the end.

## Better on Code It Never Saw

On code Papr didn't train on, both sizes beat their base model. The 4B gained 3.4 points of nDCG@10 on average, and the 0.6B 2.6. On the CoIR tasks it trained on, the gains were similar.

{{< chart id="papr-embed-code/quality" caption="Mean over the tasks in each group. Papr trained on CoIR." >}}

The gain held on every one of those tasks, but its size varied a lot. On HumanEval, the 4B base model already scored 0.98, so there wasn't much left to gain. On WikiSQL, the 4B gained 7 points.

Prose went the other way. Both sizes scored a little lower than their base model, by 0.3 points for the 0.6B and 1.6 for the 4B. On TREC-COVID, a set of COVID-19 research papers, the 0.6B lost 6.5 points. If most of what you search is prose, keep the base model.

## Compressed to 1 Bit, the 4B Beats the 0.6B

Code search usually means a lot of vectors: a function, a file chunk, or a snippet each. The 4B's vectors have 2,560 dimensions, which is 10 KB per vector in float32.

They compress very well. With 1-bit [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), each vector takes 328 bytes, 31x less. On our seven code tasks, 1-bit TurboQuant kept 99.7% of the 4B's float32 score without rescoring, and all of it with rescoring at 2x oversampling.

That changes which model to pick. The 4B compressed to 1 bit scores higher than the 0.6B in float32, and takes 12x less RAM.

{{< chart id="papr-embed-code/storage" caption="Seven code tasks, HNSW. 1-bit vectors rescored with 2x oversampling." caption2="Seven code tasks, HNSW. Mean nDCG@10." >}}

The 4B still costs more to run, because it embeds about four times slower than the 0.6B on the same GPU. And WikiSQL is the exception, where the 0.6B scored higher.

## A Million Snippets in One Collection

Our other code tasks have at most 20,000 documents, which makes compression look easy. So we also loaded [CodeSearchNet-CC](https://huggingface.co/datasets/CoIR-Retrieval/CodeSearchNet-ccr) into one collection: about a million snippets in six languages, from Python to Ruby. Each query is the start of a function, and the right document is the rest of it. A [payload filter](/documentation/search/filtering/) keeps the search within the query's language.

Compression held up at this size. At `hnsw_ef` 128, 1-bit TurboQuant with rescoring kept 99.5% of exact search's score, against 99.7% for float32. It was faster too, at 1.0 ms per query against 1.8 ms, with the original vectors for rescoring already in memory.

The bigger lever was `hnsw_ef`, the number of candidates the search explores. Raising it from 128 to 256 added 0.2 to 0.4 points to every setup. That's enough for rescored 1-bit vectors at 256 to beat float32 at 128. At 256, float32, 2-bit, and rescored 1-bit vectors all kept 99.8% or more, and the 1-bit search took 1.4 ms against 2.9 ms for float32.

Dropping the filter and searching all six languages at once cost about half a point.

## What About BM25?

Code is full of exact names, so keyword search seems like a natural partner. Qdrant 1.20 added a [code tokenizer](/documentation/manage-data/indexing/#code) for full-text indexes. It splits `getUserName` and `get_user_name` into the same words. Qdrant can also [score full-text matches with BM25](/documentation/search/text-search/full-text-search/), so a [hybrid query](/documentation/search/hybrid-queries/) can fuse BM25 with the dense search.

On our tasks, BM25 on its own was far behind dense search. On APPS, where the queries are problem statements and the documents are bare solutions, it scored 0.01 nDCG@10. The two share almost no words.

Fusing BM25 with dense search at equal weight made every task worse, by 2 to 17 points for the 4B. Down-weighting BM25 helped, but only up to break-even. With BM25's [RRF weight](/documentation/search/hybrid-queries/#weighted-rrf) at 0.1, the 4B averaged 0.06 points below dense search alone, and its best gain on any task was 0.2.

Our queries were questions, descriptions, and code, and for those, dense search alone was the better choice.

## So, Does It Pay Off?

For code search, yes. On code it never saw, papr-embed-code-1 beat the model it started from at both sizes, by about 3 points of nDCG@10. On prose it did a little worse, so if most of your corpus is prose, stay with the base model.

The bigger choice is the size. Compressed to 1 bit, the 4B scored higher than the 0.6B in float32, in a twelfth of the RAM. If you can afford to embed with the 4B, we'd store it with 1-bit [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), keep rescoring on, and raise `hnsw_ef` before adding bits. Compare against an unquantized collection on your own queries, once with [rescoring disabled](/documentation/manage-data/quantization/#searching-with-quantization) and once with 2x oversampling. If you index several languages in one collection, filter by language.

We'd leave BM25 out to start. If your users search for exact identifiers, that's the case to test it on, with a low weight.

## Full Results

<details>
<summary>Exact Search</summary>

Every model got the same query instructions. † Many identical documents, so the score depends on how ties break. Left out of the averages. ‡ Papr trained on its train split.

| Task | Qwen3-Embedding-0.6B | papr-embed-code-1-0.6b | Qwen3-Embedding-4B | papr-embed-code-1-4b |
| --- | ---: | ---: | ---: | ---: |
| *Metric* | *nDCG@10* | *nDCG@10* | *nDCG@10* | *nDCG@10* |
| *Code, not trained on* | | | | |
| [HumanEval](https://huggingface.co/datasets/embedding-benchmark/HumanEval) | 0.942 | 0.975 | 0.983 | 0.992 |
| [MBPP](https://huggingface.co/datasets/embedding-benchmark/MBPP) | 0.881 | 0.908 | 0.914 | 0.936 |
| [DS-1000](https://huggingface.co/datasets/embedding-benchmark/DS1000) † | 0.606 | 0.638 | 0.640 | 0.679 |
| [FreshStack](https://huggingface.co/datasets/embedding-benchmark/FreshStack_mteb) | 0.378 | 0.386 | 0.433 | 0.470 |
| [WikiSQL](https://huggingface.co/datasets/embedding-benchmark/WikiSQL_mteb) | 0.925 | 0.961 | 0.848 | 0.918 |
| *Code, trained on* | | | | |
| [APPS](https://huggingface.co/datasets/CoIR-Retrieval/apps) | 0.752 | 0.793 | 0.891 | 0.925 |
| [CodeTransOcean Contest](https://huggingface.co/datasets/CoIR-Retrieval/codetrans-contest) | 0.864 | 0.909 | 0.918 | 0.930 |
| [CodeTransOcean DL](https://huggingface.co/datasets/CoIR-Retrieval/codetrans-dl) † | 0.320 | 0.345 | 0.344 | 0.350 |
| [CosQA](https://huggingface.co/datasets/CoIR-Retrieval/cosqa) † | 0.398 | 0.408 | 0.414 | 0.405 |
| [StackOverflowQA](https://huggingface.co/datasets/CoIR-Retrieval/stackoverflow-qa) | 0.900 | 0.936 | 0.940 | 0.967 |
| [SyntheticText2SQL](https://huggingface.co/datasets/CoIR-Retrieval/synthetic-text2sql) † | 0.619 | 0.625 | 0.644 | 0.650 |
| [CodeSearchNet-CC](https://huggingface.co/datasets/CoIR-Retrieval/CodeSearchNet-ccr) | N/A | 0.922 | N/A | N/A |
| *Prose* | | | | |
| [SciFact](https://huggingface.co/datasets/mteb/scifact) ‡ | 0.699 | 0.824 | 0.786 | 0.868 |
| [NFCorpus](https://huggingface.co/datasets/mteb/nfcorpus) | 0.363 | 0.375 | 0.410 | 0.421 |
| [ArguAna](https://huggingface.co/datasets/mteb/arguana) | 0.693 | 0.665 | 0.751 | 0.725 |
| [SCIDOCS](https://huggingface.co/datasets/mteb/scidocs) | 0.244 | 0.240 | 0.316 | 0.287 |
| [FiQA](https://huggingface.co/datasets/mteb/fiqa) | 0.472 | 0.478 | 0.622 | 0.600 |
| [TREC-COVID](https://huggingface.co/datasets/mteb/trec-covid) | 0.893 | 0.828 | N/A | N/A |

</details>

<details>
<summary>Quantization</summary>

Mean over seven code tasks (HumanEval, MBPP, FreshStack, WikiSQL, APPS, CodeTransOcean Contest, and StackOverflowQA), searched with HNSW. Rescoring uses 2x oversampling. Bytes count only the vectors searched in RAM.

| Storage | 0.6B Bytes | 0.6B, No Rescoring | 0.6B, With Rescoring | 4B Bytes | 4B, No Rescoring | 4B, With Rescoring |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| *Metric* | *per vector* | *nDCG@10* | *nDCG@10* | *per vector* | *nDCG@10* | *nDCG@10* |
| Original float32 | 4,096 | 0.838 | N/A | 10,240 | 0.877 | N/A |
| turbo8 datatype | 1,028 | 0.838 | N/A | 2,564 | 0.877 | N/A |
| int8 | 1,028 | 0.838 | 0.838 | 2,564 | 0.877 | 0.877 |
| 4-bit TurboQuant | 520 | 0.838 | 0.838 | 1,288 | 0.877 | 0.877 |
| 2-bit TurboQuant | 264 | 0.837 | 0.838 | 648 | 0.876 | 0.877 |
| 1-bit TurboQuant | 136 | 0.833 | 0.838 | 328 | 0.875 | 0.877 |
| 1-bit binary, 8-bit query | 128 | 0.831 | 0.838 | 320 | 0.874 | 0.877 |

</details>

<details>
<summary>A Million Snippets</summary>

papr-embed-code-1-0.6b on CodeSearchNet-CC, 1,005,474 snippets, each query filtered to its language. Exact search scores 0.923. Latency is Qdrant's server-side time.

| Storage | Bytes per Vector | hnsw_ef | nDCG@10 | p50 Latency (ms) |
| --- | ---: | ---: | ---: | ---: |
| Original float32 | 4,096 | 64 | 0.914 | 1.1 |
| Original float32 | 4,096 | 128 | 0.920 | 1.8 |
| Original float32 | 4,096 | 256 | 0.922 | 2.9 |
| turbo8 datatype | 1,028 | 64 | 0.913 | 0.7 |
| turbo8 datatype | 1,028 | 128 | 0.920 | 1.1 |
| turbo8 datatype | 1,028 | 256 | 0.922 | 1.7 |
| 2-bit TurboQuant | 264 | 64 | 0.910 | 0.7 |
| 2-bit TurboQuant | 264 | 128 | 0.918 | 0.9 |
| 2-bit TurboQuant | 264 | 256 | 0.921 | 1.4 |
| 1-bit TurboQuant | 136 | 64 | 0.905 | 0.6 |
| 1-bit TurboQuant | 136 | 128 | 0.913 | 0.9 |
| 1-bit TurboQuant | 136 | 256 | 0.917 | 1.3 |
| 1-bit TurboQuant, 2x rescoring | 136 | 64 | 0.910 | 1.3 |
| 1-bit TurboQuant, 2x rescoring | 136 | 128 | 0.918 | 1.0 |
| 1-bit TurboQuant, 2x rescoring | 136 | 256 | 0.922 | 1.4 |

</details>

<details>
<summary>BM25 Hybrid Search</summary>

papr-embed-code-1-4b. BM25 uses the code tokenizer. RRF uses Qdrant's default k.

| Task | Dense | BM25 | RRF | RRF, BM25 ×0.1 | DBSF |
| --- | ---: | ---: | ---: | ---: | ---: |
| *Metric* | *nDCG@10* | *nDCG@10* | *nDCG@10* | *nDCG@10* | *nDCG@10* |
| [HumanEval](https://huggingface.co/datasets/embedding-benchmark/HumanEval) | 0.992 | 0.393 | 0.884 | 0.992 | 0.888 |
| [MBPP](https://huggingface.co/datasets/embedding-benchmark/MBPP) | 0.936 | 0.385 | 0.847 | 0.936 | 0.805 |
| [FreshStack](https://huggingface.co/datasets/embedding-benchmark/FreshStack_mteb) | 0.470 | 0.264 | 0.418 | 0.472 | 0.406 |
| [WikiSQL](https://huggingface.co/datasets/embedding-benchmark/WikiSQL_mteb) | 0.918 | 0.513 | 0.805 | 0.917 | 0.831 |
| [APPS](https://huggingface.co/datasets/CoIR-Retrieval/apps) | 0.925 | 0.010 | 0.756 | 0.925 | 0.854 |
| [CodeTransOcean Contest](https://huggingface.co/datasets/CoIR-Retrieval/codetrans-contest) | 0.930 | 0.670 | 0.912 | 0.931 | 0.905 |
| [StackOverflowQA](https://huggingface.co/datasets/CoIR-Retrieval/stackoverflow-qa) | 0.967 | 0.635 | 0.902 | 0.967 | 0.897 |
| [SciFact](https://huggingface.co/datasets/mteb/scifact) | 0.868 | 0.668 | 0.811 | 0.868 | 0.792 |
| [NFCorpus](https://huggingface.co/datasets/mteb/nfcorpus) | 0.421 | 0.307 | 0.395 | 0.419 | 0.398 |
| [ArguAna](https://huggingface.co/datasets/mteb/arguana) | 0.728 | 0.411 | 0.623 | 0.726 | 0.633 |
| [SCIDOCS](https://huggingface.co/datasets/mteb/scidocs) | 0.287 | 0.151 | 0.238 | 0.283 | 0.223 |
| [FiQA](https://huggingface.co/datasets/mteb/fiqa) | 0.600 | 0.237 | 0.521 | 0.599 | 0.485 |

</details>

Thanks to Papr for releasing the code models with open weights, and for publishing exactly how they trained and evaluated them.
