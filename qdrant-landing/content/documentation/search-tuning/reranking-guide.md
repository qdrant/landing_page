---
title: "Choosing and Sizing a Reranking Pipeline in Qdrant"
short_description: "Choose and size a reranking pipeline in Qdrant: what late interaction rescoring, MUVERA, and mean pooling add in quality, latency, and storage over the first stage alone."
description: "Choose and size a reranking pipeline in Qdrant with measured quality, latency, and storage for late interaction rescoring, MUVERA, and mean pooling, and the conditions that change the answer."
preview_dir: /articles_data/reranking-guide/preview
social_preview_image: /articles_data/reranking-guide/preview/social_preview.jpg
weight: 155
author: Chadha Sridi
author_link: https://www.linkedin.com/in/chadha-sridi/
date: 2026-11-27T00:00:00+01:00
draft: false
keywords:
  - reranking
  - late interaction
  - ColBERT
  - MUVERA
  - MaxSim
  - mean pooling
guide_series: true
---

# Choosing and Sizing a Reranking Pipeline in Qdrant

Retrieval models differ in when the query and the document meet. A dense embedding model encodes each document on its own, before any query exists, so a search over a large collection costs one query encoding and a set of fast vector comparisons. BM25 is similar: the index stores term statistics ahead of time and scores each document on the query terms it contains. What this design gives up is detail. One vector summarizes the whole document, and the detail a particular query cares about may not stand out in that summary.

Rerankers let the query and the document interact more closely. A late interaction model still encodes documents ahead of time, but it keeps one vector per token, so a query can be compared with each part of the document. A cross-encoder reads the query and the document together in one pass through the model, so nothing about the pair can be computed ahead of time. The [Multi-Vector Search course](/course/multi-vector-search/module-1/late-interaction-basics/) walks through these levels of interaction in more depth.

More interaction means more work per document. A cross-encoder over a collection of a million documents would need a million forward passes for every query. That's why rerankers run as a second stage: a fast first stage, which Qdrant runs as a prefetch, retrieves a pool of candidates, and the reranker reorders only that pool. The work it does per query grows with the number of candidates, not with the size of your collection. What it adds to latency and storage depends on the method.

{{< island path="content/documentation/headless/search-tuning/rerank-pipeline" ratio="2 / 1" title="Every reranker in this guide runs on a pool of N candidates from a first stage. Switch methods to see what each one searches, where its reranker runs, what Qdrant stores, and what grows with depth." >}}
![Pipeline diagram: a query goes to a dense or BM25 prefetch, which returns a pool of N candidates. MaxSim rescoring reorders the pool using the stored multivectors, and the top 10 return. A bracket marks the prefetch, the pool, and the rescoring as running inside Qdrant. With MUVERA, the first stage is an FDE prefetch instead. With a cross-encoder, the reranking step moves out of Qdrant into your application.](/articles_data/reranking-guide/rerank-pipeline.svg)
{{< /island >}}

Rerankers are usually described in one line: more precise, but more expensive. This guide puts numbers on both halves of that line, measured against the first stage alone, and shows where the first half doesn't hold: a reranker can add latency and storage without improving your results. The goal is to help you choose and size a reranking pipeline in Qdrant. It covers two approaches: late interaction and cross-encoders. It also introduces MUVERA and mean pooling, which compress each document's multivectors into one vector that can serve as the first stage. It answers three questions you'll face when you build a reranking pipeline: how the prefetch changes what rescoring adds, where to look when latency is too high, and what the extra vector storage buys. [What Decides Whether It Pays Off](#what-decides-whether-it-pays-off) answers them and shows what changed the answers in our runs. The [candidate depth guide](/documentation/search-tuning/candidate-depth/) covers how many candidates to retrieve, and [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) covers testing and choosing a cross-encoder.

The evidence comes from a benchmark on five BEIR datasets, from 3,633 to 522,931 documents, covering medical, scientific, financial, and duplicate-question search. It ran on Qdrant 1.20.0, on one shard, on a 16 vCPU machine with no GPU. Latencies are medians of one query at a time, so treat them as a lower bound: they don't reflect concurrent load or replicas. "Significant" means the difference passed a paired test on per-query nDCG@10, Bonferroni-corrected across all depths and pairs. We ran one model per method plus ColBERTv2 as a second late interaction model, so the numbers describe how each method behaves, not which method is best. Late interaction and MUVERA ran to depth 1,000, ColBERTv2 to depth 200, and the cross-encoder to depth 50.

## Late Interaction Rescoring: Token-Level Precision

A dense model builds a vector for every token internally, then pools them into one vector for the whole document. Late interaction models such as ColBERT skip the pooling step. They keep one contextualized vector per token, for both the query and the document. The score is called MaxSim: for each query token, find the most similar document token, then sum those best matches. Different parts of the query can match different parts of the document, so fine-grained detail survives. The [Multi-Vector Search course](/course/multi-vector-search/module-1/late-interaction-basics/) covers the model side in depth.

### Why Multivectors Rerank Instead of Retrieve

MaxSim is a poor fit for HNSW because HNSW is designed around a similarity that gives the same score in both directions. [MaxSim is asymmetric](/course/multi-vector-search/module-1/maxsim-distance/): it sums over query tokens and takes the maximum over document tokens, so when building the graph scores two documents against each other, the result depends on which one plays the query.

Without a graph, finding the best MaxSim matches means scoring every document in the collection. In a reranking pipeline, you don't need the graph: a first stage retrieves the candidates, and Qdrant computes MaxSim exactly over that pool. Qdrant can retrieve candidates and rerank them with MaxSim in a single Query API request. If you already use dense search or BM25, start by testing MaxSim on the candidates that search returns. Set `m=0` on the multivectors so Qdrant doesn't build an index you won't search:

{{< code-snippet path="/documentation/headless/snippets/search-tuning-reranking/" block="late-interaction-rescoring" >}}

### Gain, Latency, and Storage at a Glance

This table puts the three numbers side by side for a dense prefetch of 100 candidates from [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), rescored with [LateOn](https://huggingface.co/lightonai/LateOn), against dense search alone. Latency is end to end, from encoding the query to receiving the results. Storage is what each document takes on disk, including Qdrant's storage overhead.

| Dataset | nDCG@10: dense alone → rescored | End-to-end latency: dense alone → rescored | Stored per document: dense vector → plus multivectors |
|---|---|---|---|
| NFCorpus | 33.8 → 37.9 (+4.1) | 10.5 → 33.6 ms | 1.8 KiB → +210 KiB |
| SciFact | 73.1 → 76.5 (+3.4, not significant) | 15.2 → 56.3 ms | 1.7 KiB → +191 KiB |
| SCIDOCS | 19.8 → 21.7 (+1.9) | 13.7 → 47.1 ms | 1.6 KiB → +110 KiB |
| FiQA | 38.3 → 49.9 (+11.6) | 14.4 → 46.9 ms | 1.6 KiB → +72 KiB |
| Quora | 88.7 → 90.2 (+1.5, not significant) | 18.3 → 55.0 ms | 1.6 KiB → +9.1 KiB (`cold` tier) |

Rescoring made queries about 3 to 4 times slower end to end and added 6 to 116 times the dense vector's storage per document. In return, it raised nDCG@10 by 1.5 to 11.6 points. Three of the five gains were significant. The rest of this section explains what drives each column.

### The Gain Depends on the Model

LateOn improved significantly over dense search on three of five datasets at every depth, and over BM25 on all five at every depth. On FiQA at depth 1,000, nDCG@10 rose from 38.3 with dense search alone to 52.2.

The same method with a different model made results worse. ColBERTv2, on the same dense first stage, scored lower than dense alone on three of four datasets at most depths. The deeper the pool, the more of the final order the reranker decides, so the results move toward the reranker's own ranking. On these datasets, ColBERTv2's [published BEIR scores](https://arxiv.org/abs/2112.01488) are below what bge-small-en-v1.5 scored in our runs, so giving it more of the order lowered the score. [Reranking Doesn't Always Help](#reranking-doesnt-always-help) shows this in detail. Treat any late interaction model as a candidate to test on your data, not as a guaranteed upgrade.

### The Gain Depends on the First Stage

A first stage that already ranks well leaves the reranker less to add, and one that misses more relevant documents leaves it more. BM25 often scores below a modern dense model, and in our runs it did on four of the five datasets. On those four, LateOn's gain at depth 50 was larger over BM25 than over dense, for example 17.6 points against 10.3 on FiQA. BM25's top 10 also held fewer of the relevant documents, so reranking its candidates kept paying off at greater depths. On SCIDOCS and Quora, nDCG@10 over dense candidates stopped rising by depth 200, while over BM25 candidates it was still rising at depth 500 or 1,000.

A larger gain over BM25 doesn't make it the better first stage. What to compare depends on where you start. If you're designing a pipeline from scratch, compare whole pipelines on quality and cost: at depth 100, BM25 rescored with LateOn scored above dense alone on all five datasets, significantly on three, at 25 to 40 ms end to end against 10 to 18 ms. It also matched dense rescored with LateOn on four of five datasets and was 9 to 18 ms faster, because it encodes each query with one model instead of two. If you already run vector search, you won't redesign the pipeline: the question is whether a reranker on top of it pays off, and [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) walks through that test.

This table shows nDCG@10 and end-to-end latency for each pipeline at depth 100:

| Dataset | BM25 | Dense | BM25 + LateOn | Dense + LateOn |
|---|---|---|---|---|
| NFCorpus | 34.6 · 3.6 ms | 33.8 · 10.5 ms | 38.4 · 24.5 ms | 37.9 · 33.6 ms |
| SciFact | 68.3 · 4.6 ms | 73.1 · 15.2 ms | 76.3 · 39.8 ms | 76.5 · 56.3 ms |
| SCIDOCS | 15.8 · 5.2 ms | 19.8 · 13.7 ms | 21.4 · 35.7 ms | 21.7 · 47.1 ms |
| FiQA | 25.4 · 5.3 ms | 38.3 · 14.4 ms | 46.0 · 35.1 ms | 49.9 · 46.9 ms |
| Quora | 78.4 · 6.2 ms | 88.7 · 18.3 ms | 89.9 · 37.2 ms | 90.2 · 55.0 ms |

For storage, a dense prefetch needs its vectors, 1.5 to 1.8 KiB per document, plus an HNSW graph. A BM25 prefetch needs no vectors, only an inverted index over the text you already store as payload.

If you run hybrid search, note that our gains are over dense alone or BM25 alone. [Tuned fusion](/documentation/search-tuning/how-to-tune-hybrid-search/) is a stronger first stage, so expect a smaller gain over it. Qdrant can rescore fused candidates with MaxSim in the same Query API request.

### Go Deeper While the Top 10 Keeps Improving

A deeper pool only helps if the reranker moves the extra relevant documents into the top 10, so track pool recall, the share of relevant documents that made it into the candidates, next to nDCG@10. On FiQA, both kept rising together all the way to depth 1,000. On SCIDOCS, pool recall doubled between depth 50 and depth 1,000 while nDCG@10 didn't change. To pick a starting depth, follow the [candidate depth guide](/documentation/search-tuning/candidate-depth/), and to decide how far to go once a reranker wins, see [Set Candidate Count After a Win](/documentation/search-tuning/when-a-reranker-is-worth-it/#set-candidate-count-after-a-win).

{{< chart id="reranking/depth" caption="On FiQA, nDCG@10 and pool recall kept rising together up to depth 1,000 for every first stage." caption2="On NFCorpus, nDCG@10 over dense candidates flattened after depth 200, while over BM25 candidates it kept rising to depth 1,000." caption3="On SciFact, the two pipelines converged by depth 200, once the dense pool already held more than 95% of the relevant documents." caption4="On SCIDOCS, pool recall doubled between depth 50 and depth 1,000 while nDCG@10 over dense candidates didn't change." caption5="On Quora, the dense pool held 95% of the relevant documents at depth 10, so nDCG@10 barely moved past depth 25." >}}

### Where the Latency Goes

With a dense first stage, every query is encoded twice: once with the dense model for the prefetch, and once with the late interaction model for rescoring. LateOn took 19 to 34 ms to encode a query, about 4 times as long as bge-small-en-v1.5 at 5 to 9 ms. That ratio depends on the two models you pair.

MaxSim itself is cheap. Inside Qdrant, a query took 4 to 8 ms at depth 10 and 21 to 32 ms at depth 1,000. Query encoding therefore made up most of the end-to-end time: about 80% at depth 10, and still more than half at depth 1,000. If latency is too high, look at the second model before you look at depth.

{{< chart id="reranking/latency" caption="End to end, LateOn rescoring over a dense prefetch took 31 to 52 ms at depth 10 and 47 to 79 ms at depth 1,000, against 10.5 to 18.3 ms for dense search alone. Inside Qdrant, it took 4 to 8 ms at depth 10 and 21 to 32 ms at depth 1,000. Medians on CPU with one query at a time, so treat them as a lower bound under real load." >}}

### Multivector Storage Follows Tokens

A multivector stores one vector per token, so its size follows the total number of tokens in your corpus, not the number of documents. Quora has 9 times as many documents as FiQA but only 7% more tokens, so its multivectors took about the same space on disk: 4.5 GiB against 4.0 GiB. Each of LateOn's 128-dimension token vectors takes 512 bytes as float32, and the measured cost including Qdrant's storage overhead was 555 to 904 bytes per token, higher on the smaller collections. At FiQA's 134 tokens per document, that's about 72 KiB per document, or roughly 69 GiB per million documents, against about 1.5 GiB for the dense vectors.

{{< chart id="reranking/storage" caption="Per document, the dense vector took 1.6 to 1.8 KiB. Multivectors followed document length: 9 KiB on Quora's 16-token questions, 72 KiB on FiQA (134 tokens), 110 KiB on SCIDOCS (188), 191 KiB on SciFact (230), and 210 KiB on NFCorpus (237)." >}}

Since storage follows the number of token vectors, pooling them cuts it directly. Token pooling merges similar token vectors within each document, so each document keeps fewer of them. The [Pooling Techniques lesson](/course/multi-vector-search/module-3/pooling-techniques/) shows how. We didn't measure pooling's effect on quality here, so compare nDCG@10 before and after on your own data.

Since rescoring reads only the candidates' multivectors, you can put them in the `cold` [memory tier](/documentation/ops-configuration/memory-tiers/), where Qdrant reads them from disk on first access. We did that on Quora, and Qdrant query time grew from 8.4 ms at depth 10 to 23.5 ms at depth 1,000. The machine had enough RAM for the OS page cache to hold much of that data, so test the `cold` tier under your own memory pressure.

## MUVERA and Pooling: A First Stage From the Multivectors

You can also build the first stage from the multivectors themselves, by compressing each document's token vectors into one vector that HNSW can index. Mean pooling averages them, which takes about 0.5 KiB per document. MUVERA builds a larger vector, about 40 KiB, that approximates MaxSim more closely. This section covers MUVERA first, then compares the two.

[MUVERA](https://research.google/blog/muvera-making-multi-vector-retrieval-as-fast-as-single-vector-search/) attacks the indexing problem directly. It compresses a document's token vectors into one fixed-size vector, a Fixed Dimensional Encoding (FDE), built so that a dot product between a query FDE and a document FDE approximates MaxSim. HNSW can index that single vector. You retrieve candidates with the FDE, then rescore them with exact MaxSim on the real multivectors. This gives you a first stage built from the late interaction model itself, with no separate dense model to run. The [MUVERA lesson](/course/multi-vector-search/module-3/muvera/) explains the construction.

{{< code-snippet path="/documentation/headless/snippets/search-tuning-reranking/" block="muvera" >}}

The FDE has `r_reps * 2**k_sim * dim_proj` dimensions, 10,240 with these settings (the same size the [MUVERA paper](https://arxiv.org/abs/2405.19504) uses in its end-to-end experiments). LateOn's token vectors cluster in a narrow cone, which makes MUVERA's random-hyperplane bucket assignments less discriminative. [LightOn describes this effect](https://huggingface.co/blog/lightonai/lateon-regularization) and suggests centering the embeddings as a simple fix. In our NFCorpus tuning, subtracting the corpus mean from document and query tokens before FDE encoding raised the share of the exact MaxSim top 10 found within 500 candidates from 68% to 92%. We centered only the FDE inputs and rescored with the original token vectors. Test whether centering helps with your model.

### MUVERA Needs a Deep Pool

The FDE is an approximation, and at shallow depths the approximation shows. At depth 10, MUVERA scored significantly below dense search alone on NFCorpus, SCIDOCS, and FiQA, by 3.1, 13.8, and 8.1 points. At depths 500 and 1,000, it scored significantly above dense search alone on the same three datasets, by 2.0 to 12.9 points at depth 1,000. At that depth, it came within about 1 point of the dense-prefetch pipeline's nDCG@10 on every dataset. Plan on a deep prefetch.

{{< chart id="reranking/depth-muvera" caption="On FiQA, MUVERA rose from 30.2 at depth 10 to 51.2 at depth 1,000, within about 1 point of the dense pipeline." caption2="On NFCorpus, MUVERA rose from 30.7 at depth 10 to 38.2 at depth 1,000, the same as the dense pipeline." caption3="On SciFact, MUVERA started 3.5 points below the dense pipeline at depth 10 and caught up by depth 100." caption4="On SCIDOCS, MUVERA started at 6.0 at depth 10 and caught up only at depth 500, as its pool recall rose from 4.8% to 51.5%." caption5="On Quora, MUVERA stayed within 2 points of the dense pipeline at every depth." >}}

### Tune and Calibrate on Your Own Corpus

`k_sim`, `dim_proj`, and `r_reps` all set the FDE's size, and every document stores one FDE, so you choose its memory cost up front. We swept the three on NFCorpus and SciFact and kept the smallest FDE that passed the calibration check described next. If you have a memory budget, start from the settings that fit it and calibrate those.

How deep you need to go varies by corpus, and you can measure it before building the full pipeline. Take a set of held-out queries. For each one, compute exact MaxSim over the whole corpus and keep its top 10. Then rank the corpus by FDE similarity and check what share of those 10 documents falls within each depth. This tells you whether an FDE prefetch at that depth keeps the documents exact MaxSim would have picked. Average that share over the queries and set a target for it at the depth you plan to run. We required at least 80% at depth 500. This chart shows the share for four of our datasets:

{{< chart id="reranking/calibration" caption="NFCorpus, SciFact, and SCIDOCS cleared the 80% target at depth 500. FiQA reached 75% there and 87% at depth 1,000." >}}

The share at depth 10 lined up with the quality loss at depth 10: SciFact lost the least and SCIDOCS the most. FiQA missed our 80% target at depth 500, so its MUVERA results come from an FDE that didn't meet the bar we set. A poor FDE doesn't raise an error. It returns worse results than you expect, which is why the check is worth running. When an FDE falls short, center its inputs first, since that costs nothing. Then tune the settings within your storage budget, a one-time cost, before you prefetch deeper, which costs time on every query.

We ran this check with dot product, the similarity MUVERA's FDEs are designed around, and compared it with cosine on NFCorpus, SciFact, and SCIDOCS. Cosine recovered as much of the exact MaxSim top 10 as dot product or more at every depth, so our Qdrant collection stores the FDEs with cosine distance.

### What MUVERA Costs

You still need the multivectors for rescoring, so the FDE adds to your footprint rather than replacing anything. Every FDE takes about 40 KiB, however long the document is, against 1.6 to 1.8 KiB for a 384-dimension dense vector. That's about 38 GiB per million documents. Compared with the multivectors, the FDE is smaller when your documents average more than about 80 tokens and larger when they're shorter. On Quora's 16-token questions, the FDEs took 4.4 times the space of the multivectors they approximate, so for short documents, try mean pooling instead. We stored the FDEs uncompressed. To cut their memory, try [quantization](/documentation/manage-data/quantization/) and rerun the calibration check.

{{< chart id="reranking/storage-muvera" caption="Every FDE took about 40 KiB per document, however long the document. That was less than the multivectors on the four passage datasets and 4.4 times as much on Quora's 16-token questions." >}}

The FDE's size also costs search time. At depth 10, an FDE prefetch with MaxSim rescoring took 6.8 to 21.4 ms inside Qdrant, against 4.4 to 8.4 ms for a dense prefetch with the same rescoring. Rescoring 10 candidates adds almost nothing: on every dataset, dense search followed by rescoring 10 candidates took no longer inside Qdrant than dense search alone. So the difference comes from the first stage, where the FDE's 10,240 dimensions against the dense vector's 384 make every comparison in the HNSW search more expensive. At greater depths, rescoring takes up most of the time on the four smaller collections, and the gap closes. Quora, with more than half a million documents, is large enough for the FDE search to stay expensive: at depth 1,000, the FDE prefetch with rescoring took 142 ms inside Qdrant, against 23.5 ms with a dense prefetch.

End to end, MUVERA was faster on the four smaller datasets, because it encodes each query with one model instead of two: 28 to 43 ms at depth 10, against 31 to 50 ms with a dense prefetch and the same rescoring. On Quora, it took about as long at depth 10 (56 against 52 ms) and 2.45 times as long at depth 1,000 (176 against 72 ms).

### MUVERA or Mean Pooling

On our text datasets, MUVERA matched the dense-prefetch pipeline's quality at depth 1,000, but it cost more storage, and more search time as the collection grows. Building the first stage from the multivectors, with MUVERA or with pooling, is worth it when you don't have a good dense model for your data, and your only model produces multivectors:

- **Visual document retrieval.** Models such as ColPali and ColQwen embed a page image as a grid of patch vectors: about 1,000 per page for ColPali, and a count that varies with page size for ColQwen. There's often no single-vector model that matches them on the same pages, so the first stage has to come from the multivectors themselves.
- **Late interaction models without a dense counterpart.** If you fine-tuned a late interaction model for your domain or language, an off-the-shelf dense model may not match it as a first stage.

Pooling combines a document's token vectors into fewer vectors. It can average all of them into one, average fixed groups of them, such as the rows or columns of a page's patch grid, or cluster similar tokens and average each cluster. The [Pooling Techniques lesson](/course/multi-vector-search/module-3/pooling-techniques/) covers these methods. We averaged each document's LateOn token vectors into one 128-dimension vector, pooled each query the same way, and scored with cosine. Qdrant's [PDF retrieval tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) averages the rows and columns of ColPali's patch grid instead, which gives 32 vectors per page, indexes those as the first stage, and reranks with the original multivectors. On 50 held-out queries per dataset, we measured the share of the exact MaxSim top 10 that the FDE and mean pooling each found within each depth, ranking the whole corpus without HNSW:

{{< chart id="reranking/fde-pooling" caption="On NFCorpus, the FDE found 77% of the exact top 10 within 100 candidates, against 57% for mean pooling. At depth 1,000, the two found 97% and 93%." caption2="On SciFact, the FDE found 82% of the exact top 10 within 100 candidates, against 69% for mean pooling. At depth 1,000, the two found 98% and 96%." caption3="On SCIDOCS, the FDE found 57% of the exact top 10 within 100 candidates, against 32% for mean pooling. At depth 1,000, the two found 99% and 93%." >}}

The FDE found more of the exact top 10 at every depth we measured. The gap was widest between 25 and 200 candidates and narrowed to 2 to 6 points by depth 1,000. Mean pooling still cleared our 80% target at depth 500 on all three datasets, at 85% to 89%, with 80 times less storage.

If your model produces multivectors and you need a first-stage retriever, compare mean pooling with MUVERA. MUVERA can recover more of MaxSim's top results at a shallower candidate depth, but its vectors take more space to store. Start with mean pooling and run the [calibration check](#tune-and-calibrate-on-your-own-corpus) on it at the depth you plan to serve: if it meets your target there, the FDE's extra 40 KiB per document buys you little. These numbers come from LateOn on text and measure agreement with exact MaxSim, not final nDCG@10, so check your own model and data.

{{< code-snippet path="/documentation/headless/snippets/search-tuning-reranking/" block="mean-pooling" >}}

## Reranking Outside Qdrant: Cross-Encoders

A cross-encoder reads the query and a candidate's text together in one model pass, so nothing about the pair can be computed ahead of time. It runs in your application on the text payload Qdrant returns with the candidates, not inside Qdrant, so it adds nothing to Qdrant's storage. In our runs, the cross-encoder was [Alibaba-NLP/gte-reranker-modernbert-base](https://huggingface.co/Alibaba-NLP/gte-reranker-modernbert-base). On our CPU-only machine, reranking 50 candidates took 13 to 15 seconds per query end to end on the passage datasets and about 1.4 seconds on Quora, 950 to 1,400 and 75 times as long as dense search alone. A GPU or a smaller model changes these numbers, not the shape. [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) walks through testing a cross-encoder, choosing the model, and [sizing it for production](/documentation/search-tuning/when-a-reranker-is-worth-it/#size-reranking-for-production).

## Reranking Doesn't Always Help

A reranker replaces part of your first stage's ordering with its own. When it orders your data worse than the first stage did, or when the first stage already ranks well, reranking can make results worse.

### A Weaker Reranker Pulls Results Down, and Depth Makes It Worse

On the same dense first stage, the ColBERTv2 late interaction model mostly scored below dense alone, and on some datasets the loss grew with depth:

{{< chart id="reranking/colbertv2" caption="On SCIDOCS, ColBERTv2 rescoring fell from 19.4 at depth 10 to 16.5 at depth 200, against 19.8 for dense alone. The loss was significant from depth 25 onward." caption2="On SciFact, ColBERTv2 rescoring stayed below dense alone at every depth, falling from 72.5 to 70.7 against 73.1. The difference wasn't significant." caption3="On FiQA, ColBERTv2 rescoring stayed within 1 point of dense alone at every depth, slightly above it only at depth 25. The difference wasn't significant." caption4="On NFCorpus, ColBERTv2 rescoring scored slightly above dense alone at every depth, 34.7 to 35.5 against 34.0. The difference wasn't significant." >}}

The depth trend comes from how rescoring works. At depth 10, the reranker can only reorder the first stage's top 10, so the result stays close to the first stage. As depth grows, the reranker pulls in documents the first stage ranked lower, and the final list reflects more of the reranker's own judgment. If that ordering is worse than the first stage's, every extra candidate is another chance to promote the wrong document. To help, a reranker has to order the candidates better than the first stage did.

### A Strong First Stage Leaves Little to Gain

How much a reranker can add depends on how well the first stage already orders the candidates. Our cross-encoder improved significantly over BM25 on all five datasets at depths 10 and 25, but over dense search on only one of five. On four of the five datasets, BM25 alone scored below dense alone, so its candidates left more room to improve.

Before you add a reranker, check how many relevant documents your first stage already places in its top 10: on Quora, dense search placed 95% there, and no reranker gained significantly.

### Even a Good Reranker Hurts Some Queries

An average gain hides the queries that got worse. Every reranker, on every dataset, made some queries worse than its own first stage. This table shows the share of queries that got worse at depth 50:

| Dataset | Late interaction over dense | Cross-encoder over dense | Late interaction over BM25 | Cross-encoder over BM25 |
|---|---:|---:|---:|---:|
| NFCorpus | 18% | 27% | 18% | 23% |
| SciFact | 12% | 14% | 5% | 7% |
| SCIDOCS | 27% | 29% | 15% | 18% |
| FiQA | 12% | 16% | 5% | 7% |
| Quora | 10% | 17% | 7% | 11% |

Even LateOn on FiQA, the largest gain over dense in the benchmark, made 12% of queries worse. If some queries matter more than others in your application, look at the losses, not only the average. Read some of them: some will be real errors, others correct answers your labels missed.

## What Decides Whether It Pays Off

These are the answers our runs gave to the three questions, and the conditions that changed them. Measure each one on your own labeled queries before you add a rescoring stage: [Test a Reranker in Three Steps](/documentation/search-tuning/when-a-reranker-is-worth-it/#test-a-reranker-in-three-steps) shows how, and [Make Sure Your Labels Can Detect a Gain](/documentation/search-tuning/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) covers how many queries you need.

- **How the prefetch changes what rescoring adds.** The stronger the first stage, the less a reranker adds. Choose the first stage for your queries, such as dense search for meaning, BM25 for exact keywords, or [hybrid search](/documentation/search-tuning/how-to-tune-hybrid-search/) for both, then compare the pipeline with and without rescoring on quality and cost. Once you rescore, the prefetch mainly has to get relevant documents into the pool, so a cheaper one may be enough: BM25 under LateOn matched a dense prefetch on four of five datasets and was 9 to 18 ms faster. If your model produces only multivectors, start with mean pooling as the first stage, and move to MUVERA only if pooling misses your calibration target.
- **Where to look when latency is too high.** Look at the second query encoding before you look at depth. It took about 80% of end-to-end time at depth 10, while 100 times the candidates took only 3 to 6 times the query time inside Qdrant, so a deep sweep is affordable here, unlike with a cross-encoder. On a large collection, also look at the FDE search.
- **What the extra vector storage buys.** Multivector storage follows tokens, not documents: from 9 KiB per document at 16 tokens to 210 KiB at 237, against under 2 KiB for a dense vector. At depth 100, it bought 1.5 to 11.6 points of nDCG@10, significant on three of five datasets. The FDE's 40 KiB per document finds the same share of MaxSim's top results at a shallower depth than a mean-pooled vector, which takes 80 times less storage. A gain that justifies the storage today may not at next year's size, so estimate the multivectors from your corpus's token count after 12 months of expected growth, and check the total with the [Qdrant sizing calculator](https://sizing.qdrant.tech/).

## What to Tune Next

If multivector memory is the constraint, [measure what memory placement and rescoring add to query latency](/documentation/search-tuning/when-your-collection-outgrows-ram/).
