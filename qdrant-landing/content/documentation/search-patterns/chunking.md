---
title: "How to Choose a Chunking Strategy"
short_description: "This guide will look into best practices for chunking strategies and their usefulness in RAG systems"
description: "This guide will look into best practices for chunking strategies and their usefulness in RAG systems"
weight: 5
author: Andrei Cristea
date: 2026-10-19T00:00:00+00:00
draft: false
---

# How to Choose a Chunking Strategy
Chunking became the go-to way to split large collections of documents. Imagine a library of books stored in a vector search engine: to answer a question about one chapter, you need to reach that chapter, not the whole book. Chunking is mostly used in the retrieval step of a [RAG pipeline](/articles/what-is-rag-in-ai). But is it that useful?

Long context windows keep reviving the claim that RAG, and chunking with it, is no longer needed: just put the whole context into the LLM. Even Qdrant has asked the question ([RIP Chunking?](/blog/ultrabert-embed/)). When you read one of these takes, it's important to keep a cool head and think about what chunking does for your system.

From our perspective chunking is useful when: 
- The partial is more important than the whole - focused answers are more important than generic claims 
- The budget is limited - the LLM is small or local, every token costs money, or vector search is already part of the system

Two things decide how to chunk: how many tokens you can send per answer, which this guide calls the context budget, and how much a passage depends on the rest of its document, which it calls context dependency.

First, we will see when the "grep is all you need" scenario makes sense. Afterwards, we will go through three public datasets with human-labeled answer passages: SQuAD (Wikipedia articles), RepliQA (company policies, incident reports, and local news about made-up entities), and Qasper (NLP research papers). Their context dependency ranges from low in SQuAD to high in Qasper.

## Grep is all you need not chunking?

There are several ways to give an agent its context, and chunking is one of them:

| Approach                            | Needs before the first question         | Calls per answer | Tokens per answer                                      | Where it wins                                                                    |
| -------------------------------------| -----------------------------------------| ------------------| --------------------------------------------------------| ----------------------------------------------------------------------------------|
| Whole document in the prompt        | Knowing which document holds the answer | 1                | The whole document: 1,250 to 8,000 in our datasets     | Small documents you can pick by name                                             |
| Vector search over chunks           | An index                                | 1                | Your budget, for example 4,000                         | Many questions over a large collection, at a fixed cost per answer               |
| Agent with grep and file reading    | Nothing                                 | 3 to 4           | Median 4,000 to 8,500, mean up to 32,000               | Small collections, exact identifiers, questions worded differently from the text |
| Agent with vector search as a tool | An index                                | 3 to 4           | Mean 11,100 for single-hop and 23,900 for multi-hop questions | Questions that need facts from several passages                                  |

The vector-search agent figures come from a separate experiment, see [this notebook](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/sid_vs_baselines.ipynb). A fifth option stores one vector for the whole document and separate vectors for its chunks on the same point, as [named vectors](/documentation/manage-data/vectors/#named-vectors): the document vector finds the document, the chunk vectors find the answer. The UltraBERT post tests this pattern, and its answer to "RIP Chunking?" is not yet: chunk vectors still found details better.

Plain grep is the easiest to start with. On the original questions it found the answer within a 1,000-token budget for 75% of SQuAD questions and 86% of RepliQA questions. To test the realistic case, an LLM rewrote 300 questions per dataset in other words, keeping names and numbers, so the share of question words that also appear in the answer passage fell from about 60% to about 20%. The table shows recall at a 1,000-token budget for the same 300 questions in both wordings:

| Retrieval                       | SQuAD, original | SQuAD, reworded | RepliQA, original | RepliQA, reworded |
| ---------------------------------| -----------------| -----------------| -------------------| -------------------|
| Grep                            | 74%             | 30%             | 86%               | 29%               |
| Keyword search (BM25)           | 92%             | 54%             | 91%               | 50%               |
| Dense vectors, 256-token chunks | 88%             | 75%             | 73%               | 59%               |
| Dense vectors, 128-token chunks | 90%             | 81%             | 84%               | 68%               |
| Hybrid (dense and BM25), 256-token chunks | 95%             | 76%             | 92%               | 63%               |
| Hybrid (dense and BM25), 128-token chunks | 95%             | 78%             | 89%               | 69%               |

*When the wording changes, grep loses to semantic search.*

An agent can rephrase its searches, which makes a difference: it read the answer passage for almost every question. It pays for that in calls and tokens:

| Questions                | Answer passage read | Median tokens per answer | Mean tokens per answer | Steps |
| --------------------------| --------------| --------------------------| ------------------------| -------|
| SQuAD, original          | 99%          | 4,000                    | 14,100                 | 2.8   |
| SQuAD, reworded          | 96%          | 7,600                    | 26,800                 | 3.8   |
| RepliQA, original        | 98%          | 5,100                    | 8,000                  | 3.0   |
| RepliQA, reworded        | 94%          | 7,600                    | 31,900                 | 4.4   |
| Qasper, within the paper | 95%          | 8,500                    | 15,200                 | 4.1   |

*With DeepSeek v4.1 Flash. The most expensive 10% of questions used a third to three quarters of all tokens.*

A common argument says agents no longer need retrieval: store company knowledge as markdown files and grep over it. But one concept per file is chunking done by hand, and real pipelines are messy, with many file types and modalities. Each miss is another grep session, so the cost grows with every question.

## Start With Your Context Budget

Your context budget is how many tokens of retrieved text you can afford per answer, after your instructions and the question. The model's context window is the hard limit, but cost and latency usually set a much lower one.

### How This Guide Compares Setups

Every comparison gives each setup the same token budget, for example 1,000 tokens of retrieved text. That matches how you pay, and it keeps the comparison fair. Most published benchmarks send a fixed number of chunks instead, and five chunks of 510 tokens hold almost four times the text of five chunks of 128 tokens.

For each question, we add search results to the prompt in rank order until the next chunk would not fit, then check whether the passage that answers the question is in that text. The share of questions where it is, is **recall at a token budget**. A passage counts when at least 80% of it was sent. This measures whether the evidence reached the model, not whether the model answered correctly.

![Two 1,000-token prompts filled in rank order. Eight chunks of up to 128 tokens fit, and the answer, ranked fifth, is sent. Only one chunk of up to 510 tokens fits, and the answer, ranked second in a 530-token chunk, is not sent.](/articles_data/chunking-guide/budget-filling.svg)

*How a 1,000-token budget is filled, with illustrative chunk sizes.*

Two different token limits appear in this guide:

| Limit | What it caps | Value used in this guide |
|---|---|---|
| Embedding model input limit | One chunk, when the embedding model turns it into a vector | 512 tokens for bge-small-en-v1.5, including two special tokens, so every chunk is at most 510 tokens |
| Context budget | All retrieved text sent to the LLM in one prompt | 500, 1,000, 2,000, or 4,000 tokens. Tables use 1,000 unless they say otherwise |

### Chunk Size

A chunk size setting is a maximum: the splitter cuts at paragraph or line breaks, so most chunks are shorter. A 1,000-token budget usually holds seven or eight chunks of up to 128 tokens, four or five of up to 256, and one or two of up to 510.

| Maximum chunk size | SQuAD | RepliQA | Qasper | Tokens sent |
|---|---|---|---|---|
| 128 tokens | 88% | 84% | 46% | about 950 |
| 256 tokens | 86% | 77% | 51% | about 900 |
| 510 tokens | 65% | 59% | 40% | about 850 |

*Small chunks give the model more separate search results in the same space. On Qasper, where passages depend on their paper, 256 tokens beat 128.*

{{< chart id="chunking/recall-by-budget" caption="Small chunks lead at small budgets on SQuAD and RepliQA, and the gap closes as the budget grows. On Qasper, 256-token chunks lead at every budget." >}}

### Overlap

Overlap is the most common default advice, often 10% to 20%. With 64 tokens of overlap on 256-token chunks, recall at 1,000 tokens moved by less than two points on every dataset (86.3% to 86.5% on SQuAD, 76.9% to 77.5% on RepliQA, 50.8% to 52.2% on Qasper), within the noise. Overlap protects answers cut in half by a boundary, and a splitter that cuts at paragraph breaks rarely does that: only about 5% of RepliQA answer passages crossed one. Overlap may matter more with fixed-size windows that ignore structure.

### The Embedding Model's Input Limit

Many open embedding models stop reading at 512 tokens or fewer and drop the rest without warning: [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) reads 256 and [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) reads 512. Most splitters count characters by default, so measure chunks with the model's own tokenizer. Every chunk in this guide stayed within 512 tokens, including those with added context.

Long-context models such as [UltraBERT-Embed](/blog/ultrabert-embed/) read 32,000 tokens, but a higher limit is not a reason for bigger chunks: when the answer is a detail inside a long document, smaller chunks find it more often.

## Check How Much Context Your Documents Carry

A chunk depends on its document when it can't be understood on its own. It might refer back to something defined earlier ("the employee", "our model"), need the document's structure, or be ambiguous without the title ("revenue grew 3%" for which company?). These categories come from the [ConTEB benchmark](https://arxiv.org/abs/2505.24782).

Two LLMs, [DeepSeek v4.1 Flash](https://www.deepseek.com/en/news/deepseek-v4-1-flash/) and [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5), read the chunk that holds the answer for 100 random questions per dataset, without its document, and judged whether it made sense on its own. A person labeled 30 of these chunks and agreed with DeepSeek on 27 and with Claude Haiku on 23, so the table shows DeepSeek's rate first and Claude Haiku's in brackets. Thirty chunks is a small sample.

| Dataset | Self-contained answer chunks | With title and section prefix |
|---|---|---|
| SQuAD (Wikipedia) | 71% (82%) | 75% (91%) |
| RepliQA (policies, reports, news) | 60% (74%) | 71% (82%) |
| Qasper (research papers) | 10% (23%) | 22% (30%) |

*Most failures are references back to earlier text: 25% of SQuAD chunks, 35% of RepliQA chunks, and 90% of Qasper chunks.*

To test your own documents, read 20 random chunks without their documents and count how many you could answer a question from. If most fail, as with research papers or contracts, treat them as high dependency.

## Choose a Method

Chunking methods decide where to cut, add context to each chunk, or change how chunks are searched. Each chart and table in this section shows recall at a 1,000-token budget.

### Where to Cut

{{< chart id="chunking/methods-boundaries" caption="Fixed-size windows and 510-token chunks lose on every dataset. Section boundaries help only Qasper, the one dataset with headings. Semantic chunking and overlap stay within about three points of recursive splitting." >}}

Recursive splitting is the default in most libraries and a strong one. Section boundaries are worth adding when your documents have headings: on Qasper they raised recall from 51% to 56%. The semantic method tested here cuts where the distance between neighboring sentences is in a document's top 5%, the LangChain default. It needs an extra embedding pass over every sentence and gave nothing back, which matches [published results](https://arxiv.org/abs/2410.13070). Other semantic methods were not tested.

### Adding Context to Chunks

Context methods put information from the rest of the document into each chunk: a title and section prefix, an LLM-written summary of the document, or Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), where an LLM writes a short context for each chunk. The added text can go into the embedding only, so it helps search while the model receives the original chunk, or it can also be sent, where it uses budget. For Qasper, these runs used 100 papers.

![Two 1,000-token prompts. When added context goes into the embedding only, the prompt receives the original chunks and four fit. When the context is also sent, each chunk carries it into the prompt and only three fit.](/articles_data/chunking-guide/context-embedded-vs-sent.svg)

*Sending the added context uses budget, so fewer chunks reach the model. Sizes are illustrative.*

| Context method | SQuAD | RepliQA | Qasper (100 papers) |
|---|---|---|---|
| None | 86% | 77% | 53% |
| Title and section prefix, sent | 86% | 71% | 53% |
| Title and section prefix, embedded only | 86% | 74% | 55% |
| LLM summary of the document, sent | 84% | 75% | 43% |
| LLM summary of the document, embedded only | 86% | 77% | 47% |
| LLM context per chunk, sent | 84% | 76% | 50% |
| LLM context per chunk, embedded only | 86% | 79% | 58% |

Per-chunk context in the embedding only raised recall by 2.5 points on RepliQA and 5 on Qasper, and did nothing on SQuAD, whose chunks mostly stand alone. Sending it erased the gain. It is also the most expensive method to index: 26,527 LLM calls and about 60 million input tokens for our three datasets, about $11 with DeepSeek v4.1 Flash. A document summary costs one call per document but did not help.

Sending the chunks around each hit, or searching 128-token chunks and sending the 510-token chunk that contains each hit, lowered recall on most datasets because each hit uses more budget. Both can still help the model answer, which this guide does not measure.

### How Chunks Are Searched

{{< chart id="chunking/methods-search" caption="Hybrid search leads on all three datasets, most on Qasper when combined with section boundaries. Sending the neighbors of each hit lowers recall at a fixed budget, and sending the parent chunk helps only RepliQA." >}}

The search method moved recall more than any chunking choice. SQuAD and RepliQA questions reuse the wording of their passages, which favors keyword search: with reworded questions, BM25 fell to 50% to 54%. At the same 128-token chunk size, hybrid and dense search tied on reworded questions, while hybrid led by 5 points on the original wording. In Qdrant, BM25 is a sparse vector with the IDF modifier, and [hybrid search](/documentation/search/hybrid-queries/) combines it with dense vectors in one query through prefetch and Reciprocal Rank Fusion (RRF).

The last bar adds one rule: a chunk never crosses a section heading, so it never mixes the end of Method with the start of Results. Only Qasper has headings, and there the rule added 5 points.

## Recommendations

These starting points come from one embedding model (bge-small-en-v1.5), budgets of 500 to 4,000 tokens, and three English datasets. Check them on your own data.

| Your documents | Start with |
|---|---|
| Short, self-contained entries (FAQs, tickets, catalog items) | Recursive chunks of 128 to 256 tokens, hybrid search |
| Documents with headings (manuals, reports, papers) | Section boundaries, then recursive chunks of 256 tokens, hybrid search |
| Long documents where most chunks depend on context | The same, plus per-chunk LLM context in the embedding only, if the indexing cost fits |
| A small collection, rare questions, exact identifiers | An agent with grep may be enough |

When your budget grows, send more chunks rather than bigger ones. Picking the best setting from two datasets and testing it on the third landed within 5 points of the best in 11 of 12 cases.

## Check Your Own Setup

You need a folder of text files and 30 to 50 real questions, each with the passage that answers it. `check_chunking.py` in the [companion repository](https://github.com/qdrant-labs/chunking-guide-methods) reports recall and tokens sent for each chunk size and budget, checks the longest chunk against the embedding model's limit, and sorts the misses by cause:

```bash
./check_chunking.py docs/ questions.csv --sizes 128,256,510 --budgets 500,2000
```

On 291 RepliQA documents with 300 reworded questions, it printed:

```text
 max size  longest input   recall @500  tokens  recall @2000  tokens
      128            130           77%     454           87%    1949
      256            258           68%     417           83%    1899
      510            512           43%     362           77%    1795

Where to look: misses for 128-token chunks at a 500-token budget (69 of 300 questions)

    24  split: The answer is cut by a chunk boundary.
    24  reworded: The document was not found, and the question uses different words.
    18  wrong part: The right document was sent, but other parts of it ranked higher.
     3  not found: The document was not found, although the question shares words with it.

  30 of these are reached at a 2000-token budget, at 4.3x the tokens per answer.
```

Each cause comes with a suggestion: section-aware boundaries for split answers, hybrid search or a reranker for the wrong part, and a check of the embedding model for reworded questions.

## When to Adjust

Measure again when you add a new kind of document, when users ask different kinds of questions, when your budget changes, or when you switch embedding models. A new model always means re-embedding. Re-chunk only if its input limit or tokenizer changes your chunk sizes.

The same two questions apply beyond text. With audio and video, the budget is tighter and the order is given, but deciding where to cut is harder.

## How We Measured

- **Datasets:** SQuAD v1.1 validation (48 articles, 10,570 questions), RepliQA split 0 (3,591 documents, 14,083 questions), and Qasper validation and test (697 papers, 1,976 questions). SQuAD and RepliQA search the whole collection. Qasper searches within its own paper, because its questions assume the paper is open.
- **Setup:** bge-small-en-v1.5 through FastEmbed, Qdrant, and LangChain's recursive splitter sized in the model's tokens. Budgets are counted with the same tokenizer, so your LLM will count the same text slightly differently.
- **Noise:** differences of one or two points are meaningful for SQuAD and RepliQA, Qasper's confidence intervals are about 4 points wide, and results on 300 or 100 questions need differences over 5 points.
- **Not measured or covered:** answer correctness, other embedding models, reranking, parsing PDFs and tables, and [late chunking](https://arxiv.org/abs/2409.04701). [NVIDIA's benchmark](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/) measures answer accuracy on PDFs, where page-level chunks did well.

Code, notebooks, and all results are in the [companion repository](https://github.com/qdrant-labs/chunking-guide-methods).

## Related Reading

- [Text Chunking Strategies](/course/essentials/day-1/chunking-strategies/): the lesson with code for each strategy.
- [How to Choose an Embedding Model](/documentation/search-patterns/choose-embedding-model/): the model decides your chunk size limit.
- [Filtering in Vector Search](/documentation/search-patterns/vector-search-filtering/): which chunk payload fields to index.
- [UltraBERT Fits 32K Tokens in One Vector](/blog/ultrabert-embed/): whole-document vectors from a long-context model compared with 512-token chunks.
- [Data Management Integrations](/documentation/data-management/): chunking libraries that write to Qdrant.
