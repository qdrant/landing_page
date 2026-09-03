---
title: "SID-1 Agentic Search with Qdrant"
short_description: "Agentic search pays for itself on multi-hop questions and is redundant on single-hop ones. A tuned loop spends less and answers better, for a small tradeoff."
description: "How the agentic loop works, when it beats a single vector search, and how to tune a SID-1 agent that calls Qdrant search as its tools to cut tokens and latency"
preview_dir: /articles_data/agentic-search-sid/preview
social_preview_image: /articles_data/agentic-search-sid/preview/social_preview.jpg
author: Andrei Cristea
draft: false
date: 2026-09-02T00:00:00.000Z
category: rag-and-agents
keywords:
  - agentic search
  - multi-hop retrieval
  - query decomposition
  - search optimization
  - SID-1
  - RAG
weight: -211
---

Hybrid search returns a ranked list in a single pass: your query is embedded, sparse and dense retrievers each pull candidates, and RRF or DBSF fuses them. It's fast, cheap, and assumes a well-constructed query.

Agentic search doesn't assume that. **An agentic retriever runs a loop: read what comes back, decide what's still missing, issue a new sub-query, repeat**. The LLM in the loop can bridge entities across passages, reformulate underspecified queries, and stop when it either finds what it needs or exhausts its retries. That's why, in theory, it should beat hybrid search on multi-hop questions, where the answer requires stitching facts from two or three documents that no single query retrieves at once.

This article measures whether the theory holds up on Qdrant. We put [SID-1](https://www.sid.ai/research/sid-1), a 14B model trained specifically for agentic retrieval, head-to-head with a well-configured hybrid setup on the MuSiQue multi-hop QA benchmark. The answer isn't "agentic search wins," and it isn't "hybrid is enough." It's to use both in a routing fashion, sending each query to whichever retriever fits.

## Evaluation Setup 

We use MuSiQue, a multi-hop QA benchmark with gold-labeled passages and answerable/unanswerable splits. The answerable split gives us 120 single-hop questions and 60 multi-hop questions. Two main configurations of the dataset will be used in this article on [MuSiQue](https://github.com/stonybrooknlp/musique): 
- Original dataset with 22K corpus 
- An enhanced dataset with a 1M corpus that was mined by streaming and deduplicating distribution-matched Wikipedia passages, similar to the ones in the original dataset

**Note**: all numbers in the next two sections use the 22K corpus; usage of 1M will be noted

We will use both later when exploring how the retrieval size affects the quality of agentic search. 

We used three retrievers, all reading the same Qdrant collection:

- **Hybrid**: bge-base dense embeddings + miniCOIL sparse, fused with RRF at query time.
- **Reranker**: ColBERT late-interaction rerank over a top-K dense prefetch from bge-base.
- **SID-1**: a 14B model trained for agentic retrieval, running its own multi-turn loop with three tools (search, text_search, read) that all delegate to the same collection. 
 
**Note**: All SID-1 numbers in this article use a single rollout, the vendor's more conservative configuration. SID's published headline uses four fused rollouts for higher recall at proportionally higher cost.


The following metrics were used, all evaluated inside the top-three window:

- `coverage@3`: fraction of the gold documents that landed in the top three, averaged across queries.
- `full_gold@3`: one if all gold documents landed in the top three, else zero; averaged across queries.
- `mrr@3`: one over the rank of the first gold document if it appears in the top three, else zero; averaged across queries.

We will use also more common metrics like latency and token usage as well.

<aside role="status"><strong>Noise floor:</strong> Running the same configuration twice on these same 60 multi-hop questions shifts coverage@3 by up to 0.0375 points. That is the measurement noise. Any delta smaller than that is indistinguishable from a re-run, and we will say so when it comes up.</aside>

For background on hybrid retrieval and rerankers, see [Hybrid Search in Qdrant](https://qdrant.tech/articles/hybrid-search/). For a better understanding of SID, check [their technical report](https://www.sid.ai/research/sid-1-technical-report). The setup is minimal: build an agentic loop from SID's documentation, wrap your Qdrant search methods as tools, and hand them to SID via its API.

The Qdrant collection and question split were forked and adapted from [Predicting Weak Retrieval article](https://qdrant.tech/articles/predicting-weak-retrieval/?selector=aHRtbCA%2BIGJvZHkgPiBtYWluID4gc2VjdGlvbiA%2BIGRpdiA%2BIGRpdiA%2BIGRpdjpudGgtb2YtdHlwZSgyKSA%2BIGRpdiA%2BIGRpdjpudGgtb2YtdHlwZSgxKSA%2BIGFydGljbGUgPiBkaXY6bnRoLW9mLXR5cGUoMSkgPiBoMQ%3D%3D&q=Predicting+Weak+Retrieval). This article does not reproduce the self-correction ladder covered there.

## A Closer Look at Agentic Loop

![System map of the SID-1 agentic retrieval loop: the application delegates tool selection to SID-1, while Qdrant provides hybrid search, text search, and read-by-ID tools.](/articles_data/agentic-search-sid/agentic-retrieval-system.png)

*Takeaway: SID-1 chooses among a small set of Qdrant retrieval operations, rather than relying on a single search pass.*

**An agent combines an LLM with instructions, conversation state, and tools**. On each turn, the model examines the original question and previous tool results, decides what to do next, and continues until it produces a result or reaches its turn limit.

A search agent follows the same pattern, but its task is retrieval: find and rank the passages most useful for answering a question. Unlike a one-shot retriever, it can inspect the initial results, identify missing information, reformulate the query, and search again.


The tool interface and output format are configurable, but the model’s behavior is not completely arbitrary. A model trained around particular retrieval tools may ignore or misuse unfamiliar capabilities. For this integration, we therefore give SID a small set of operations that map naturally onto Qdrant: hybrid search, sparse text search, and document lookup.

Here is what our tools look like:
- `search` - runs hybrid retrieval using dense and miniCOIL sparse vectors, fused with RRF.
- `text_search` - runs miniCOIL sparse retrieval for exact entities, names, and terminology.
- `read` - retrieves a passage by an ID returned by an earlier search.
- `report_helpful_ids` ends the loop and returns the final document ranking

**Note**: You can find more information about how to configure SID on their [official documentation page](https://platform.sid.ai/docs/build).

### Exotic Tools & Configurations 

Can we add custom tools or configurations? That was a question we were interested in too. 

Configuration, as it turns out, the agent never needs to see. It doesn't have to tell RRF from DBSF: you set the fusion method server-side, and it changes what search returns without a word in the prompt. We handed the decision over anyway, adding fusion and prefetch depth as arguments to search - listed with their defaults, their semantics explained, and a worked example call showing both in use. Across 118 runs and 1,002 search calls, SID passed either one exactly zero times, and that count is generous: it credits passing the documented defaults as adoption.

<aside role="status">SID works well out of the box. It was trained for the retrieval task and query generation.</aside>

Configuration notebooks: [22K](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/experimental/stand1_configuration_100K.ipynb) & [1M](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/experimental/stand1_configuration_1M.ipynb). Custom tool experiments: [Exotic Tools](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/stand2_exotic_tools.ipynb). 

<!-- TODO: have a better status  -->


## Agentic Search Can Be Overkill for Single-Hop

Two examples of single-hop questions from the split:

**Kurt Frederick.** The question asks, “Of what country is Kurt Frederick a citizen?” The answer, **Saint Lucia**, appears directly in the *Kurt Frederick* passage: “an international soccer player from Saint Lucia.”

**Puerto Rico.** The question asks, “What territory has been suggested as a new addition to the United States?” The answer, **Puerto Rico**, appears directly in the *51st state* passage, which describes Puerto Rico as a potential 51st state.

The answer sits in one passage. No reasoning chain, no bridge entity to resolve. Here's how the three arms perform across all 120 single-hop questions, with cost columns reported as per-query averages:

![Single-hop retrieval quality and per-query cost: SID-1 slightly exceeds hybrid coverage@3 but has much higher latency and token use.](/articles_data/agentic-search-sid/single-hop-quality-vs-cost.png)

*Takeaway: SID-1 gains 0.008 coverage@3 over hybrid, but costs 35× more latency and about 11K tokens per query.*

| arm            | coverage@3 | full_gold@3 | mrr@3 | qdrant_calls | llm_calls | tokens  | latency_s |
| ----------------| ------------| -------------| -------| --------------| -----------| ---------| -----------|
| hybrid         | 0.975      | 0.975       | 0.889 | 1.00         | 0.00      | 0       | 0.099     |
| colbert-rerank | 0.900      | 0.900       | 0.876 | 1.00         | 0.00      | 0       | 0.320     |
| sid-1          | 0.983      | 0.983       | 0.957 | 5.24         | 3.13      | 11,128 | 3.510     |

SID-1 matches hybrid within noise (0.983 vs 0.975 `coverage@3`). It also uses about 11K tokens per query and 35x the latency to do it. That's trivial for a single run, but at millions of queries a day it adds up to an expensive bill for a result hybrid already gave you.

**One thing SID does that a `fixed-K` retriever cannot: it self-regulates how many documents it returns**. On single-hop, SID reports 2.5 documents on average. Hybrid always returns 10, because that is what it was asked for. SID returns fewer because it knows when it is done.

ColBERT rerank actually degrades single-hop (0.900 vs 0.975). A reranker helps only when the base ranking is noisy enough to benefit; on questions where the answer sits in one passage, it's more likely to demote the right document than promote it.

The ordering is stable as sample size grows: hybrid and SID-1 stay ahead of ColBERT across every population we tested.

On single-hop, agentic search buys nothing over hybrid, and costs 35x the latency and 11K tokens per query to try.

Single-hop notebook: [SID Baseline Runs](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/sid_vs_baselines.ipynb).


## Multi-Hop: Where Agentic Search Pays Off

Two more examples, this time multi-hop:

**Carlos Leon and Madonna.** The question asks when Carlos Leon's relationship with the performer behind “Vogue” ended. One passage establishes the bridge fact: that performer was **Madonna**. A second passage about Madonna and Carlos Leon supplies the answer: **May 1997**.

**Clementino and Kanye West.** The question asks what shift away from Clementino's genre Kanye West is credited with. One passage establishes that Clementino is associated with **rap**; a second passage about Kanye supplies the answer: **gangsta rap**.

Multi-hop queries can't be answered in one pass. Take the first example: we need to know who sang "Vogue". The answer: Madonna. Then the next question: when did Madonna and Carlos Leon break up? The second hop gives us the answer.

Multi-hop queries also mirror how people actually ask questions. Users skip context, reference things vaguely, and expect the system to fill in what they left out. Here's how the three arms compare across all 60 multi-hop questions:

![Multi-hop retrieval quality and per-query cost: SID-1 has the highest coverage@3, with substantially higher latency and token use.](/articles_data/agentic-search-sid/multi-hop-quality-vs-cost.png)

*Takeaway: SID-1 reaches 0.743 coverage@3, compared with 0.500 for hybrid and 0.479 for ColBERT rerank.*

| arm            | coverage@3 | full_gold@3 | mrr@3 | qdrant_calls | llm_calls | tokens  | latency_s |
| ----------------| ------------| -------------| -------| --------------| -----------| ---------| -----------|
| hybrid         | 0.500      | 0.15        | 0.811 | 1.00         | 0.00      | 0       | 0.056     |
| colbert-rerank | 0.479      | 0.15        | 0.769 | 1.00         | 0.00      | 0       | 0.157     |
| sid-1          | 0.743      | 0.55        | 0.883 | 8.75         | 4.35      | 23,947 | 5.749     |

SID-1 finds every gold passage for 55% of multi-hop questions. Hybrid finds every gold passage for 15%. That gap is the case for agentic search on multi-hop, and it's larger than the `coverage@3` gap (0.743 vs 0.500).

SID's win costs over 100x the latency of hybrid (5.7s vs 0.056s) and about 24K tokens per query. On multi-hop, that trade buys a real result.

On the quality-vs-cost graph, SID-1 lands near the top of the multi-hop coverage frontier. A better prompt or a larger loop budget might close some of the remaining gap, though the incremental win would be small.

The ordering is stable across sample sizes: SID-1 leads hybrid and ColBERT across every population from `n=20` to `n=60`.

On multi-hop, an agentic loop costs something real. It carries context between retrievals, synthesizes a follow-up query using that context, and stops when it has enough. A single-pass retriever, hybrid or reranked, can't do any of that.


Multi-hop notebook: [SID Loop Runs](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/sid_vs_loops.ipynb).


## Can We Optimize It?

### Late Searches Find Nothing New

The question is: while **0.743** looks impressive, how do results look in practice - and, more importantly, **when does SID retrieve the gold documents**?

Across the 60 multi-hop questions, we find a noticeable discrepancy between SID runs. **More importantly, retrieval quality does not keep improving indefinitely as the agent continues searching**. Instead, there is a clear ceiling: after a certain point, additional search steps stop producing meaningful gains in gold-document retrieval.

![Marginal number of new gold documents discovered per search turn.](/articles_data/agentic-search-sid/marginal-new-gold-per-search.png)

*Takeaway: The first few searches uncover most new gold documents; later searches add little.*

![Cumulative number of gold documents discovered over search turns.](/articles_data/agentic-search-sid/cumulative-gold-discovered.png)

*Takeaway: Gold-document discovery plateaus after the early search turns.*

Most of the gain we get is due to the first several runs. This is true for both the 22K dataset and the 1M dataset. Moreover, further analysis shows us that the agent retrieves most of the gold results at some point in time; it just does not rank them well:

![Comparison of gold documents retrieved during the search loop and gold documents surfaced in the final ranking.](/articles_data/agentic-search-sid/retrieved-but-not-surfaced.png)

*Takeaway: SID often retrieves gold documents that its final ranking does not surface.*

The conclusion from the first finding is easy to apply - we can just use the first N retrievals, and then push the model to make a final decision. 

The analysis shows that capping at four searches would be nearly free: coverage barely moving, tokens down to about a quarter, seconds down by half. Those are estimates, taken by truncating full-budget traces at search four, so they score a ranking the model produced after seeing the searches we removed. So we built a real search budget and ran it with the budget held at exactly four searches on every single run.

| Dataset              | Budget       | Cov   | Cost (tokens) | Latency   |
| ----------------------| --------------| -------| ---------------| -----------|
| 22K original MuSiQue | full budget  | 0.757 | 23,740       | 3.03s     |
|                      | @4 estimated | 0.717 | 6,740        | ~2.9-3.8s |
|                      | @4 measured  | 0.718 | 9,746        | 2.21s     |
| 1M minted MuSiQue    | full budget  | 0.646 | 24,090       | 3.09s     |
|                      | @4 measured  | 0.604 | 8,982        | 1.95s     |

Every row here is the same script on the same day, and SID's seconds are service time. Its pilot endpoint takes two requests in flight while our harness runs six, so raw wall clock there measures our own thread pool as much as it measures SID. The baseline table above reports 0.743 and 5.749s for the same configuration, measured four weeks earlier, when the same loop was taking twice as long per turn.

The 1M corpus has no `@4 estimated` row. Those runs were recorded without traces, so there were no per-search observations to truncate, and we measured the cap there directly instead.

The capped loop still finds about 44% more gold than Qdrant's primitives on their own, and it does it on 59% to 63% fewer tokens than the uncapped agent. What it gives up is 0.039 coverage at 22K and 0.042 at 1M, both sitting within a hair of our 0.0375 noise floor, so the cap is close to free at either size.

**But more importantly, both corpora then answer in about two seconds: 2.21s at 22,808 documents and 1.95s at 1,022,808.**

That is the number that reaches the user. Nobody ever experiences a system's deployment cost. They experience the wait and whether the answer is right.


### Reranking Does Not Fix SID's Ranking; Only a Larger Window Does

The conclusion for the second finding is more interesting: can we improve the ranking that is already quite good for SID? The immediate idea is to use a reranker for the given result; however, all our attempts were unsuccessful. 

| Ranking                      | Cov@3 |
| ------------------------------| -------|
| control (no rerank)          | 0.765 |
| ColBERT reranks every search | 0.749 |
| LLM reranks every search     | 0.764 |

All three rows are the same 60 questions run twice, `n=120`. Both rerankers land slightly below the control, and both deltas fall within our 0.0375 noise floor. In the end, the most effective way to improve the coverage is to use more than three items as the result. All SID rows below are the full-budget configuration:

| Window Size | SID (22K) | SID (1.02M) | Hybrid (22K) | Hybrid (1.02M) |
| -------------| -----------| -------------| --------------| ----------------|
| 3           | 0.729     | 0.665       | 0.500        | 0.417          |
| 4           | 0.769     | 0.694       | 0.554        | 0.431          |
| 5           | 0.789     | 0.705       | 0.590        | 0.431          |
| 6           | 0.799     | 0.707       | 0.610        | 0.457          |
| 10          | 0.812     | 0.719       | 0.651        | 0.515          |


An oracle selecting the best three from SID's reported list (about five documents on average) would score 0.808 coverage@3. **Simply returning SID's full reported list scores 0.812.** Widening the answer window beats a perfect reranker at zero compute.

Capping the loop at four searches and handing the answerer the whole reported list gets 0.776 coverage@3 on about a quarter of the full-budget tokens. That beats the uncapped agent reading into three slots, which scores 0.729. Both changes are configuration.

SID forensics: [notebook](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/experimental/sid_forensics.ipynb).


## Wrap-Up: Send Each Query to the Retriever That Fits

The rule from these numbers: hybrid handles single-hop, SID handles multi-hop, and a router picks between them.

On single-hop, agentic search matches hybrid within noise (0.983 vs 0.975 coverage@3) at 35x the latency and 11K tokens per query. On multi-hop, the trade flips: SID lands every gold passage 3.7x more often than hybrid (0.55 vs 0.15 full_gold@3) for about 100x the latency and 24K tokens. There is no workload where the same retriever is the right answer for every query.

A cheap classifier catches most of the multi-hop cases: if the query mentions two or more named entities that need linking, or if the answer requires a bridge fact, route to SID. Otherwise, stay on hybrid. For a signal-based router that decides on retrieval confidence rather than query shape, see [Predicting Weak Retrieval](https://qdrant.tech/articles/predicting-weak-retrieval/?selector=aHRtbCA%2BIGJvZHkgPiBtYWluID4gc2VjdGlvbiA%2BIGRpdiA%2BIGRpdiA%2BIGRpdjpudGgtb2YtdHlwZSgyKSA%2BIGRpdiA%2BIGRpdjpudGgtb2YtdHlwZSgxKSA%2BIGFydGljbGUgPiBkaXY6bnRoLW9mLXR5cGUoMSkgPiBoMQ%3D%3D&q=Predicting+Weak+Retrieval).

To try SID on your own Qdrant collection, check [SID's documentation](https://platform.sid.ai/docs/quickstart) to build a minimal agentic loop, wrap your Qdrant search methods as tools, and pass them via SID's API. Full code for this benchmark is in the [repo](https://github.com/qdrant-labs/agentic-sid-multihop-musique/tree/main). For more on agentic retrieval on Qdrant, see [Building Performant, Scaled Agentic Vector Search](https://qdrant.tech/articles/agentic-builders-guide/?q=Building+Performant%2C+Scaled+Agentic+Vector+Search).
