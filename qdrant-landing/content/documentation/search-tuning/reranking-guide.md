---
title: "Reranking in Qdrant: When It Helps, What It Costs, and How to Tune It"
short_description: "Compare late interaction rescoring, MUVERA, and cross-encoders by what each one improves, what it costs, and how it behaves as candidate depth grows."
description: "Choose and tune a reranker in Qdrant: late interaction, MUVERA, or a cross-encoder, with measured quality, latency, and memory across depths."
preview_dir: /articles_data/reranking-guide/preview
social_preview_image: /articles_data/reranking-guide/preview/social_preview.jpg
weight: 155
author: Chadha Sridi
author_link: https://www.linkedin.com/in/chadha-sridi-456b4a224/
date: 2026-11-19T00:00:00+01:00
draft: false
keywords:
  - reranking
  - late interaction
  - ColBERT
  - MUVERA
  - cross-encoder reranker
guide_series: true
---

# Reranking in Qdrant: When It Helps, What It Costs, and How to Tune It

Retrieval models differ in when the query and the document meet. A dense embedding model encodes each document on its own, before any query exists. At search time, Qdrant encodes the query and compares its vector with the stored ones. Because the documents are already encoded, a search over a large collection costs one query encoding and a set of fast vector comparisons. BM25 is similar: the index stores term frequencies, document lengths, and collection statistics, and at search time it scores each document on the query terms it contains.

What this design gives up is detail. One vector summarizes the whole document, and the detail a particular query cares about may not stand out in that summary. Rerankers let the query and the document interact more closely. A late interaction model still encodes documents ahead of time, but it keeps one vector per token, so a query can be compared with each part of the document. A cross-encoder reads the query and the document together in one pass through the model, so nothing about the pair can be computed ahead of time. The [Multi-Vector Search course](/course/multi-vector-search/module-1/late-interaction-basics/) walks through these levels of interaction in more depth.

More interaction means more work per document. A cross-encoder over a collection of a million documents would need a million forward passes for every query. That's why rerankers run as a second stage: a fast first stage, which Qdrant runs as a prefetch, retrieves a pool of candidates, and the reranker reorders only that pool. The work it does per query grows with the number of candidates, not with the size of your collection. What it adds to storage depends on the method, and each method's section covers it.

{{< island path="content/documentation/headless/search-tuning/rerank-pipeline" ratio="9 / 5" title="Every reranker in this guide runs on a pool of N candidates from a first stage. Switch methods to see what each one searches, where its reranker runs, what Qdrant stores, and what grows with depth." >}}
![Pipeline diagram: a query goes to a dense or BM25 prefetch, which returns a pool of N candidates. MaxSim rescoring reorders the pool using the stored multivectors, and the top 10 return. A bracket marks the prefetch, the pool, and the rescoring as running inside Qdrant. With MUVERA, the first stage is an FDE prefetch instead. With a cross-encoder, the reranking step moves out of Qdrant into your application.](/articles_data/reranking-guide/rerank-pipeline.svg)
{{< /island >}}

This leaves two decisions: which reranker to use, and how many candidates to give it. The [candidate depth guide](/documentation/search-tuning/candidate-depth/) covers the second decision in general terms, including why a deeper pool raises the ceiling on what any reranker can reach. This guide covers two approaches to reranking with Qdrant: late interaction rescoring and cross-encoders. It also introduces MUVERA, which retrieves candidates with a single vector built from the multivectors and then rescores them with the multivectors themselves. For each one, it describes what the method is meant to improve, what it costs, and how it behaves as the pool grows. It also shows that adding a reranker doesn't guarantee better results, and can make them worse. If you only need a cross-encoder, [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) covers testing one on your data.

The evidence comes from a benchmark on five public datasets. We ran one model per method, so the numbers describe how each method behaves, not which method is best. A different model can change the outcome, and the late interaction results include one such case. Late interaction and MUVERA ran to depth 1,000, ColBERTv2 to depth 200, and the cross-encoder to depth 50.

## Late Interaction Rescoring: Token-Level Precision

A dense model builds a vector for every token internally, then pools them into one vector for the whole document. Pooling keeps the general topic and loses the details.

Late interaction models such as ColBERT skip the pooling step. They keep one contextualized vector per token, for both the query and the document, and defer the comparison until search time. The score is called MaxSim: for each query token, find the most similar document token, then sum those best matches. Different parts of the query can match different parts of the document, so the fine-grained detail survives. Document vectors are still computed once, which is what keeps late interaction much cheaper than a cross-encoder. The [Multi-Vector Search course](/course/multi-vector-search/module-1/late-interaction-basics/) covers the model side in depth.

### Why Multivectors Rerank Instead of Retrieve

MaxSim is a poor fit for HNSW because HNSW is designed around a similarity that gives the same score in both directions. MaxSim is asymmetric: it sums over query tokens and takes the maximum over document tokens, so swapping the two gives a different score. Building the graph also means scoring documents against each other with MaxSim, and each of those comparisons touches every pair of tokens. The [MaxSim lesson](/course/multi-vector-search/module-1/maxsim-distance/) covers the asymmetry in more detail.

Without a graph, finding the best MaxSim matches means scoring every document in the collection, and that cost grows with the collection. In a reranking pipeline, you don't need the graph. A cheap first stage, dense or BM25, retrieves the candidates, and Qdrant computes MaxSim exactly over that pool. Set `m=0` on the multivectors so Qdrant doesn't spend time and memory building an index you won't search:

{{< code-snippet path="/documentation/headless/snippets/search-tuning-reranking/" block="late-interaction-rescoring" >}}

### What It Costs: Query Encoding and Memory

With a dense first stage, every query is encoded twice: once with the dense model for the prefetch, and once with the late interaction model for rescoring. In our runs, the dense model was [`BAAI/bge-small-en-v1.5`](https://huggingface.co/BAAI/bge-small-en-v1.5) and the late interaction model was [LateOn](https://huggingface.co/lightonai/LateOn). Encoding a query with LateOn took about 4 times as long as encoding it with `bge-small-en-v1.5` on every dataset. That ratio depends on the two models you pair.

MaxSim itself is cheap. With a dense first stage, going from 10 to 1,000 candidates, 100 times as many, made the Qdrant query only 3 to 6 times slower (2.8 to 6.2 times). The low end is Quora, whose multivectors were in the `cold` tier. As a result, query encoding dominates the end-to-end latency, measured from encoding the query to receiving the reranked results from Qdrant. It accounted for about 80% of that time at a depth of 10, and still more than half at a depth of 1,000:

{{< chart id="reranking/encoding-share" caption="Query encoding's share of end-to-end latency fell on every dataset as depth grew, from 78% to 87% at depth 10 to 52% to 58% at depth 1,000. All timings are medians, measured on CPU with one query at a time. Quora's multivectors were in the cold tier." >}}

The other cost is memory, because a multivector stores one vector per token. Its size follows the total number of tokens in your corpus, not the number of documents. Each of LateOn's 128-dimension token vectors takes 512 bytes as float32, but the measured cost including Qdrant's storage overhead was 555 to 904 bytes per token, higher on the smaller collections. This chart compares the multivectors' memory with the dense vectors, alongside the MUVERA vectors from the MUVERA section:

{{< chart id="reranking/memory" caption="Multivector memory follows the total number of tokens, so it falls from 116 times the dense vectors on NFCorpus to 5.8 times on Quora's one-line questions, measured on disk because Quora's multivectors were in the cold tier. MUVERA's FDE has a fixed size per document, so it stays at 22 to 26 times on every dataset." >}}

Since rescoring reads only the candidates' multivectors, you can put them in the `cold` [memory tier](/documentation/ops-configuration/memory-tiers/), where Qdrant reads them from disk on first access. We did that on Quora, and Qdrant query time grew 2.8 times between depth 10 and depth 1,000. The machine had enough RAM for the OS page cache to hold much of that data, so test the `cold` tier under your own memory pressure.

### The Gain Depends on the Model

Late interaction can deliver large gains. LateOn improved significantly over dense search on three of five datasets at every depth, and over BM25 on all five at every depth. On FiQA at depth 1,000, nDCG@10 was 36% higher than with dense search alone.

The same method with a different model made results worse. ColBERTv2, on the same dense first stage, scored lower than dense alone on three of four datasets at most depths. The deeper the pool, the more of the final order the reranker decides, so the results move toward the reranker's own ranking. On these datasets, ColBERTv2's [published BEIR scores](https://arxiv.org/abs/2112.01488) are below what `bge-small-en-v1.5` scored in our runs, so giving it more of the order lowered the score. [Reranking Doesn't Always Help](#reranking-doesnt-always-help) covers this in more detail. Treat any late interaction model as a candidate to test on your data, not as a guaranteed upgrade.

### Go Deeper While the Top 10 Keeps Improving

A deeper pool only helps if the reranker moves the extra relevant documents into the top 10, so track pool recall, the share of relevant documents that made it into the candidates, next to nDCG@10. On FiQA, both kept rising together all the way to depth 1,000, while on SCIDOCS pool recall doubled between depth 50 and depth 1,000 and nDCG@10 didn't change. To pick a starting depth, follow the [candidate depth guide](/documentation/search-tuning/candidate-depth/), and to decide how far to go once a reranker wins, see [Set Candidate Count After a Win](/documentation/search-tuning/when-a-reranker-is-worth-it/#set-candidate-count-after-a-win).

{{< chart id="reranking/depth" caption="On FiQA, nDCG@10 and pool recall kept rising together up to depth 1,000 for every first stage." caption2="On NFCorpus, nDCG@10 over dense candidates flattened after depth 200, while over BM25 candidates it kept rising to depth 1,000." caption3="On SciFact, the three pipelines converged by depth 200, once the dense pool already held more than 95% of the relevant documents." caption4="On SCIDOCS, pool recall doubled between depth 50 and depth 1,000 while nDCG@10 over dense candidates didn't change. MUVERA caught up only at depth 500." caption5="On Quora, the dense pool held 95% of the relevant documents at depth 10, so nDCG@10 barely moved past depth 25." >}}

The gain also depends on the first stage. A first stage that already ranks well leaves the reranker less to add, and one that misses more relevant documents leaves it more. BM25 often scores below a modern dense model, and in our runs it did on four of the five datasets. On those four, LateOn's gain at depth 50 was larger over BM25 than over dense, for example 69% against 27% on FiQA. BM25's top 10 also held fewer of the relevant documents, so reranking its candidates kept paying off at greater depths. On SCIDOCS and Quora, nDCG@10 over dense candidates stopped rising by depth 200, while over BM25 candidates it was still rising at depth 500 or 1,000.

## MUVERA: An Indexable Stand-In for Multivectors

[MUVERA](https://research.google/blog/muvera-making-multi-vector-retrieval-as-fast-as-single-vector-search/) attacks the indexing problem directly. It compresses a document's token vectors into one fixed-size vector, a Fixed Dimensional Encoding (FDE), built so that a simple dot product between a query FDE and a document FDE approximates MaxSim. HNSW can index that single vector. You retrieve candidates with the FDE, then rescore them with exact MaxSim on the real multivectors. This gives you a first stage built from the late interaction model itself, with no separate dense model to run. The [MUVERA lesson](/course/multi-vector-search/module-3/muvera/) explains the construction.

{{< code-snippet path="/documentation/headless/snippets/search-tuning-reranking/" block="muvera" >}}

The FDE has `r_reps * 2**k_sim * dim_proj` dimensions, 10,240 with these settings (the same size the [MUVERA paper](https://arxiv.org/abs/2405.19504) uses in its end-to-end experiments). LateOn's token vectors cluster in a narrow cone, which makes MUVERA's random-hyperplane bucket assignments less discriminative. [LightOn describes this effect](https://huggingface.co/blog/lightonai/lateon-regularization) and suggests centering the embeddings as a simple fix. In our NFCorpus tuning, subtracting the corpus mean from document and query tokens before FDE encoding raised the share of the exact MaxSim top 10 found within 500 candidates from 68% to 92%. We centered only the FDE inputs and rescored with the original token vectors. Test whether centering helps with your model.

### MUVERA Needs a Deep Pool

The FDE is an approximation, and at shallow depths the approximation shows. At depth 10, MUVERA scored significantly below dense search alone on NFCorpus, SCIDOCS, and FiQA, by 9%, 69%, and 21%. At depths 500 and 1,000, it scored significantly above dense search alone on the same three datasets, by 10% to 34% at depth 1,000. At that depth, it came within just 2% of the dense-prefetch pipeline's nDCG@10 on every dataset. Plan on a deep prefetch. This is a first-stage effect: a deeper FDE prefetch finds more of the documents exact MaxSim would pick. It doesn't contradict [When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/), where a deeper list doesn't rescue a reranker that loses at depth 10.

### Tune and Calibrate on Your Own Corpus

`k_sim`, `dim_proj`, and `r_reps` all set the FDE's size, and every document stores one FDE, so you choose its memory cost up front. We swept the three on NFCorpus and SciFact and kept the smallest FDE that passed the calibration check described next. If you have a memory budget, start from the settings that fit it and calibrate those.

How deep you need to go varies by corpus, and you can measure it before building the full pipeline. Take a set of held-out queries. For each one, compute exact MaxSim over the whole corpus and keep its top 10. Then rank the corpus by FDE similarity and check what share of those 10 documents falls within each depth. This tells you whether an FDE prefetch at that depth keeps the documents exact MaxSim would have picked. Average that share over the queries and set a target for it at the depth you plan to run. We required at least 80% at depth 500. This chart shows the share for four of our datasets:

{{< chart id="reranking/calibration" caption="NFCorpus, SciFact, and SCIDOCS cleared the 80% target at depth 500. FiQA reached 75% there and 87% at depth 1,000." >}}

Recall at depth 10 lined up with the quality loss at depth 10: SciFact lost the least and SCIDOCS the most. FiQA missed our 80% target at depth 500, so its MUVERA results come from an FDE that didn't meet the bar we set. A poor FDE doesn't raise an error. It returns worse results than you expect, which is why the check is worth running.

We ran this check with dot product, the similarity MUVERA's FDEs are designed around, and compared it with cosine on NFCorpus, SciFact, and SCIDOCS. Cosine recovered as much of the exact MaxSim top 10 as dot product or more at every depth, so our Qdrant collection stores the FDEs with cosine distance.

### What MUVERA Costs: Memory and Latency

You still need the multivectors for rescoring, so the FDE adds to your footprint rather than replacing anything. Every FDE has the same size, 40 KiB at 10,240 float32 dimensions, however long the document is. A 128-dimension multivector, by contrast, costs 512 bytes per token at raw size, and 555 to 904 bytes with the storage overhead we measured. So compared with the multivectors, the FDE is smaller when your documents average more than about 80 tokens at raw size, or about 45 to 75 tokens with the measured overhead, and larger when they're shorter. The [memory chart](#what-it-costs-query-encoding-and-memory) in the late interaction section compares the MUVERA vectors with the multivectors and with the dense vectors. On Quora's short questions, the FDEs also took 4.4 times the space of the multivectors they approximate.

We stored the FDEs uncompressed. To cut their memory, try [quantization](/documentation/manage-data/quantization/) and rerun the calibration check.

The FDE's size also costs search time. Inside Qdrant (search time without query encoding) the MUVERA query took 1.4 to 2.6 times as long as the dense pipeline at depth 10. Rescoring 10 candidates adds almost nothing in terms of latency: on every dataset, dense search followed by rescoring 10 candidates took no longer inside Qdrant than dense search alone. So the difference comes from the first stage: the FDE has 10,240 dimensions against the dense vector's 384, which makes every comparison in the HNSW search more expensive. At greater depths, rescoring takes up most of the time on the four smaller collections, and the gap closes. Quora, with more than half a million documents, is large enough for the FDE search to stay expensive: at depth 1,000, the MUVERA query took 6 times as long inside Qdrant as the dense pipeline at the same depth.

End to end, including query encoding, MUVERA was faster on the four smaller datasets, because it encodes each query with one model instead of two. On Quora, it took about as long as the dense pipeline end to end at depth 10 (1.08 times) and 2.45 times as long at depth 1,000. So a dense first stage costs less memory everywhere and less time inside Qdrant at shallow depths, while MUVERA saves you the dense query encoding.

### So When Is MUVERA Worth It?

On our text datasets, MUVERA matched the dense-prefetch pipeline's quality at depth 1,000, but it cost more memory, and more search time as the collection grows. So is it worth using at all? It is, when you don't have a good dense model for your data. We had one for all five datasets, so MUVERA had little to add. It earns its cost when your only model produces multivectors:

- **Visual document retrieval.** Models such as ColPali and ColQwen embed a page image as a grid of patch vectors: about 1,000 per page for ColPali, and a count that varies with page size for ColQwen. There's often no single-vector model that matches them on the same pages, so the first stage has to come from the multivectors themselves.
- **Late interaction models without a dense counterpart.** If you fine-tuned a late interaction model for your domain or language, an off-the-shelf dense model may not match it as a first stage.

Without a dense model, the simplest first stage is to pool each document's multivectors into one vector by averaging them. Qdrant's [PDF retrieval tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) takes a related approach for ColPali. We compared that with the FDE on three of our datasets, using the same calibration measure: the share of the exact MaxSim top 10 found within each depth.

{{< chart id="reranking/fde-pooling" caption="On all three datasets, the FDE reached a given share of the exact MaxSim top 10 at a shallower depth than mean pooling, for example 57% against 32% at depth 100 on SCIDOCS." >}}

The FDE found more of the exact top 10 at every depth we measured, so it reaches a given share with a shallower prefetch. The gap narrowed with depth, and at depth 1,000 it was 2 to 6 points. The FDE also takes 80 times the memory of a pooled 128-dimension vector. These numbers come from text and LateOn, not from page images, so run the calibration check on your own model and data before you choose between the two.

## Cross-Encoders: The Query and Document Read Together

[When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) walks through testing a cross-encoder on your data and choosing the model, and its [Set Candidate Count After a Win](/documentation/search-tuning/when-a-reranker-is-worth-it/#set-candidate-count-after-a-win) section covers how many candidates to rerank. A cross-encoder reads the query and a candidate's text together in one model pass, so nothing about the pair can be computed ahead of time. It runs in your application on the text payload Qdrant returns with the candidates, not inside Qdrant. In our runs, the cross-encoder was [`Alibaba-NLP/gte-reranker-modernbert-base`](https://huggingface.co/Alibaba-NLP/gte-reranker-modernbert-base).

On our CPU-only machine, the cross-encoder pipeline at depth 50 took 950 to 1,400 times as long as dense search alone, end to end, on the passage datasets, and about 75 times as long on Quora. A GPU or a smaller model changes these ratios, not the shape. A cross-encoder adds nothing to Qdrant's memory beyond the text payload you already store.

## Reranking Doesn't Always Help

A reranker replaces part of your first stage's ordering with its own. When it orders your data worse than the first stage did, or when the first stage already ranks well, reranking can make results worse.

### A Weaker Reranker Pulls Results Down, and Depth Makes It Worse

On the same dense first stage, the ColBERTv2 late interaction model mostly scored below dense alone, and on some datasets the loss grew with depth. This chart shows the change in nDCG@10 from ColBERTv2 rescoring, relative to dense alone:

{{< chart id="reranking/colbertv2" caption="On SCIDOCS, the loss grew from 2% at depth 10 to 17% at depth 200. On SciFact and FiQA it stayed within about 3%, and NFCorpus gained slightly. Only the SCIDOCS loss was significant, from depth 25 onward." >}}

The depth trend comes from how rescoring works. At depth 10, the reranker can only reorder the first stage's top 10, so the result stays close to the first stage. As depth grows, the reranker pulls in documents the first stage ranked lower, and the final list reflects more of the reranker's own judgment. If that ordering is worse than the first stage's, every extra candidate is another chance to promote the wrong document. To help, a reranker has to order the candidates better than the first stage did.

### A Strong First Stage Leaves Little to Gain

How much a reranker can add depends on how well the first stage already orders the candidates. Our cross-encoder improved significantly over BM25 on all five datasets at depths 10 and 25, but over dense search on only one of five. On four of the five datasets, BM25 alone scored below dense alone, so its candidates left more room to improve. To compare a reranker against fusion tuned on your own labels, see [Compare with the Best First Stage](/documentation/search-tuning/when-a-reranker-is-worth-it/#compare-with-the-best-first-stage).

Quora, a duplicate-question dataset, shows the far end of this. There, dense search alone already placed 95% of the relevant documents in its top 10. A reranker can only reorder candidates, so there was little left to improve. Our cross-encoder scored slightly below dense at every depth, and late interaction slightly above, with none of the differences significant.

Reading the losses shows how the cross-encoder disagreed. Quora asks whether two questions are the same question. The cross-encoder often promoted a question that was related but more specific. For "What do you understand by nested loop?", dense ranked the labeled duplicate "How do nested loops work?" first. The cross-encoder ranked "What is a nested loop in C++? What is the concept behind a nested loop?" first: relevant, but narrower than the question asked. Many of the losses we read came from this mismatch: the cross-encoder scores relevance, and Quora asks for equivalence.

### Even a Good Reranker Hurts Some Queries

An average gain hides the queries that got worse. Every reranker, on every dataset, made some queries worse than its own first stage. This table shows the share of queries that got worse at depth 50:

| Dataset | Late interaction over dense | Cross-encoder over dense | Late interaction over BM25 | Cross-encoder over BM25 |
|---|---:|---:|---:|---:|
| NFCorpus | 18% | 27% | 18% | 23% |
| SciFact | 12% | 14% | 5% | 7% |
| SCIDOCS | 27% | 29% | 15% | 18% |
| FiQA | 12% | 16% | 5% | 7% |
| Quora | 10% | 17% | 7% | 11% |

Even LateOn on FiQA, the largest gain over dense in the benchmark, made 12% of queries worse. If some queries matter more than others in your application, look at the losses, not only the average.

## What Holds Across Methods

These patterns held for every reranker we tested, and most follow from how the methods work. Check them against your own models:

- **The first stage sets the headroom.** Both rerankers gained more over BM25 than over dense wherever dense was the stronger first stage. The better the first stage ranks, the less a reranker has left to fix.
- **Where the reranker runs decides what depth costs.** Rescoring inside Qdrant took 3 to 7 times as long at depth 1,000 as at depth 10, across both first stages. A cross-encoder's cost grows in proportion to the number of candidates.
- **Each method's memory follows a different variable.** Multivectors grow with total tokens, MUVERA vectors with document count, and a cross-encoder adds nothing to Qdrant. Estimate each against your own corpus.
- **Deeper pools stop paying off.** Every reranker plateaued or dipped on at least one dataset. The [best possible score section of the candidate depth guide](/documentation/search-tuning/candidate-depth/#more-candidates-can-raise-the-best-possible-score) explains why the ceiling keeps rising while the measured score doesn't.

## How to Evaluate a Reranker on Your Data

[When Is a Reranker Worth It?](/documentation/search-tuning/when-a-reranker-is-worth-it/) covers the base workflow: a labeled baseline, held-out queries, candidate count, and throughput. ColBERTv2 and the Quora results both show that a reranker can make results worse. The only way to know is to measure on your own queries:

1. Look at the queries that got worse, not only the mean. Check whether they include queries that matter to your users, and read some of them: some will be real errors, others correct answers your labels missed.
2. Measure memory per named vector, and check whether the multivectors can go in the `cold` memory tier.
3. If you use MUVERA, calibrate the FDE on your corpus before you trust its results.
