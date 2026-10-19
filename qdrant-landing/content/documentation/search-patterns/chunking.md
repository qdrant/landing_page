---
title: "How To Choose Chunking Strategy"
short_description: "This guide will look into best practices for chunking strategies and their usefulnes in RAG systems"
description: "This guide will look into best practices for chunking strategies and their usefulnes in RAG systems"
weight: 5
author: Andrei Cristea
date: 2026-10-19T00:00:00+00:00
draft: false
---

# How To Choose Chunking Strategy
Chunking became the go-to way to split large collections of documents. Imagine a library of books stored in a vector search engine: to answer a question about one chapter, you need to reach that chapter, not the whole book. Chunking helps plain semantic search too, but it is mostly used in the retrieval step of a [RAG pipeline](/articles/what-is-rag-in-ai). But is it that useful?

Every half a second another linkedin post will claim that RAG is not needed anymore (chunking correspondingly), and that we can throw the whole context into the LLM. In such scenarios, its important to keep your head cold and think about what makes chunking so important for **your system**. 

From our perspective chunking is useful when: 
- The partial is more important than the whole - focused answers are more important than generic claims 
- The budget is limited - the LLM is small/local or lightweight, the budget is limited, or vector search is already part of the system
- If the a passage depends on the rest of its document to make sense, which this guide calls context dependency 

Budgetting recently became a new trend, with decline of tokenmaxxing and introduction of system one thinking. So the question always lies how does the system benefit for chunking and what are the tradeoffs?

In this guide we will check all the options. First, we will see when is how "grep is all you need" scenario makes sense. Afterwards, we wil through 3 public datasets with human-labeled answer passages: SQuAD (Wikipedia articles), RepliQA (company policies, incident reports, and local news about made-up entities), and Qasper (NLP research papers). Each of them has different in document context-dependency (SQuAD lowest, Qasper highest) and we will see how each chunking method can perform inside those constraints.

## Grep is all you need not chunking?

There are several ways to communicate to the agents its context, and chunking is one of them: 

| Approach                            | Needs before the first question         | Calls per answer | Tokens per answer                                      | Where it wins                                                                    |
| -------------------------------------| -----------------------------------------| ------------------| --------------------------------------------------------| ----------------------------------------------------------------------------------|
| Whole document in the prompt        | Knowing which document holds the answer | 1                | The whole document: 1,250 to 8,000 in our datasets     | Small documents you can pick by name                                             |
| Vector search over chunks           | An index                                | 1                | Your budget, for example 4,000                         | Many questions over a large collection, at a fixed cost per answer               |
| Agent with grep and file reading    | Nothing                                 | 3 to 4           | Median 4,000 to 8,500, mean up to 32,000               | Small collections, exact identifiers, questions worded differently from the text |
| Agent with vector search as a tool | An index                                | 3 to 4           | Mean 11,100 for single-hop and 23,900 for multi-hop questions | Questions that need facts from several passages                                  |

The vector-search agent figures come from a separate experiment, and you can find the proofs in [this notebook](https://github.com/qdrant-labs/agentic-sid-multihop-musique/blob/main/notebooks/sid_vs_baselines.ipynb).

As per usual the most out-of-box solutions like grep are easiest to use and most expensive to maintain. If we check its performance inside original datasets questions, plain grep found the answer within a 1,000-token budget for 75% of SQuAD questions and 86% of RepliQA questions (we use only those since they are less likely to be known by LLMs). To test the realistic case, an LLM rewrote 300 questions per dataset in other words, keeping names and numbers. The share of question words that also appear in the answer passage fell from about 60% to about 20%.

The table shows the share of answers found within 1,000 tokens, for the same 300 questions in both wordings:

| Retrieval                       | SQuAD, original | SQuAD, reworded | RepliQA, original | RepliQA, reworded |
| ---------------------------------| -----------------| -----------------| -------------------| -------------------|
| Grep                            | 74%             | 30%             | 86%               | 29%               |
| Keyword search (BM25)           | 92%             | 54%             | 91%               | 50%               |
| Dense vectors, 256-token chunks | 88%             | 75%             | 73%               | 59%               |
| Dense vectors, 128-token chunks | 90%             | 81%             | 84%               | 68%               |
| Hybrid (dense and BM25)         | 95%             | 76%             | 92%               | 63%               |

*When the context changes, GREP, being the most straighfoward choise looses to semantic search in recall at 1000 token budget*

Grep finds the answer when the user repeats the document's words, and misses it most of the time when they do not. An agent, can rephase the searches, which indeed makes change - all the answers are within found documents. However, for agents it takes several takes and makes them slower and more expensive to handle. 

| Questions                | Answer passage read | Median tokens per answer | Mean tokens per answer | Steps |
| --------------------------| --------------| --------------------------| ------------------------| -------|
| SQuAD, original          | 99%          | 4,000                    | 14,100                 | 2.8   |
| SQuAD, reworded          | 96%          | 7,600                    | 26,800                 | 3.8   |
| RepliQA, original        | 98%          | 5,100                    | 8,000                  | 3.0   |
| RepliQA, reworded        | 94%          | 7,600                    | 31,900                 | 4.4   |
| Qasper, within the paper | 95%          | 8,500                    | 15,200                 | 4.1   |

*With DeepSeek v4.1 Flash, the agent read the answer passage for 94% to 99% of questions, using three to four model calls on average. Cost is uneven: the most expensive 10% of questions used between a third and three quarters of all tokens, and the hardest single question used about 300,000 tokens against a median of 4,000 to 8,500.*

A common argument says that agents no longer need retrieval: store companies knowledge as markdown files and run grep over it. However, in real production systems bottlenecks are different: you want fast, cheap and reliable systems. Moreover, organization of such file system is a burden that will result in manual chunking: one concept per file is a clean lab outcome. Usual pipelines are messy: it can have many modalities, different file types etc. The overall cost is also increasing - each miss is another grep session that might result in the context bloat. 

## Start With Your Context Budget

Every answer your system gives costs tokens, and most of them are the retrieved text you put in the prompt. Your context budget is how many tokens of retrieved text you can afford per answer. The model's context window is the hard limit, but cost and latency usually set a much lower one. The budget is what is left after your instructions, the question, and any tool output.

### How This Guide Compares Setups

Every comparison in this guide gives each setup the same token budget, for example 1,000 tokens of retrieved text. There are two reasons:

1. It matches how you pay. Tokens set the bill and the latency, so a fixed budget means a fixed cost per answer, whatever chunk size you pick.
2. It keeps the comparison fair. Most published chunking benchmarks send a fixed number of chunks instead, such as the top five. Five chunks of 128 tokens are about 600 tokens, and five chunks of 510 tokens are about 2,200. Large chunks then win because the model got almost four times more text, not because they were better chunks.

For each question, we search, then add the results to the prompt one by one in rank order, best match first. Chunks go in whole, so we stop when the next one would not fit, and a little space is left unused. Then we check one thing: is the passage that answers the question in the text we sent?

The share of questions where it is, is **recall at a token budget**. It is the ceiling for your system: if the answer never reaches the model, no prompt or model can recover it.

Two different token limits appear in this guide, and they cap different things:

| Limit | What it caps | Value used in this guide |
|---|---|---|
| Embedding model input limit | One chunk, when the embedding model turns it into a vector | 512 tokens for bge-small-en-v1.5, including two special tokens, so every chunk is at most 510 tokens |
| Context budget | All retrieved text sent to the LLM in one prompt, several chunks together | 500, 1,000, 2,000, or 4,000 tokens. Tables use 1,000 unless they say otherwise |

The embedding model never sees the whole budget: it reads one chunk at a time. The context budget counts only retrieved text. Your instructions and the question come on top of it and are not counted here.

### Chunk Size

A chunk size setting is a maximum. The splitter cuts at the nearest paragraph or line break, so most chunks are shorter, and a 1,000-token budget usually holds seven or eight chunks of up to 128 tokens, four or five of up to 256, and one or two of up to 510. The choice is between more small chunks and fewer large ones. The table shows recall at a 1,000-token budget, and the tokens each setup sent on average:

| Maximum chunk size | SQuAD | RepliQA | Qasper | Tokens sent |
|---|---|---|---|---|
| 128 tokens | 88% | 84% | 46% | about 950 |
| 256 tokens | 86% | 77% | 51% | about 900 |
| 510 tokens | 65% | 59% | 40% | about 850 |

*Small chunks give the model more separate search results in the same space. Large chunks spend it on text around one or two hits, and an extra large chunk often does not fit at all. On Qasper, where passages depend on their paper, 256 tokens beat 128.*

### Overlap

<!-- TODO: these overlap numbers are invalid. A bug left 10% to 21% of overlap chunks empty. Rerun overlap_64 with the fix and replace this paragraph. -->

Overlap between neighboring chunks is the most common default advice, often stated as 10% to 20%. At an equal budget, it lowered recall on every dataset. With 64 tokens of overlap on 256-token chunks, recall at 1,000 tokens fell from 86% to 84% on SQuAD, from 77% to 68% on RepliQA, and from 51% to 45% on Qasper. Overlap repeats text the model has already seen, and the repeats take budget away from new chunks.

### The Embedding Model's Input Limit

Check one more limit before you choose a size: the embedding model's input length. This limit is per chunk, and it is separate from the context budget. Many open embedding models stop reading at 512 tokens or fewer and drop the rest without warning. For example, [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) reads 256 tokens and [bge-small-en-v1.5](https://huggingface.co/unsloth/bge-small-en-v1.5) reads 512, including two special tokens. Most text splitters count characters by default, so measure chunk sizes with the embedding model's own tokenizer and compare your largest chunk with the model's limit.

This guide follows that rule. Every chunk was measured with bge-small-en-v1.5's tokenizer. The largest setting, 510 tokens, gives inputs of exactly 512 with the two special tokens. Chunks with an added title, summary, or LLM-written context stayed under 512 as well, the longest being 457 tokens.

## Check How Much Context Your Documents Carry

A chunk depends on its document when it can't be understood on its own. It might refer back to something defined earlier ("the employee", "our model"), need the document's structure (which section, which table), or be ambiguous without the title ("revenue grew 3%" for which company?). These categories come from the [ConTEB benchmark](https://arxiv.org/abs/2505.24782).

To measure dependency, two LLMs from different families, [DeepSeek v4.1 Flash](https://www.deepseek.com/en/news/deepseek-v4-1-flash/) and [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5), read the chunk that holds the answer for 100 random questions per dataset, without its document, and judged whether it made sense on its own. We use Deepseeks answers since those aligned more with human labels.

| Dataset | Self-contained answer chunks | With title and section prefix |
|---|---|---|
| SQuAD (Wikipedia) | 71% (82%) | 75% (91%) |
| RepliQA (policies, reports, news) | 60% (74%) | 71% (82%) |
| Qasper (research papers) | 10% (23%) | 22% (30%) |

*Most failures are references back to earlier text: 25% of SQuAD chunks, 35% of RepliQA chunks, and 90% of Qasper chunks.*

You can run the same test on your own documents. Pick 20 random chunks, read each one without its document, and count how many you could answer a question from. If most pass, your documents have low dependency. If most fail, as with research papers or contracts, treat them as high dependency.

## Choose a Method

Chunking methods do one of three jobs: they decide where to cut, they add context to each chunk, or they change how chunks are searched. Each table in this section shows recall at a 1,000-token budget.

### Where to Cut

| Boundary method | SQuAD | RepliQA | Qasper |
|---|---|---|---|
| Recursive (paragraphs, then lines, then words), 256 tokens | 86% | 77% | 51% |
| Fixed-size token windows | 69% | 63% | 37% |
| Section boundaries, then recursive | 86% | 77% | 56% |
| Semantic (cut where meaning shifts between sentences) | 86% | 74% | 48% |

*Semantic chunking did not beat recursive splitting on any dataset. Section boundaries only differ where documents have headings, and there they helped.*

Recursive splitting is the default in most libraries and a strong one. Fixed-size windows cut through sentences and lost on every dataset. Section boundaries are worth adding when your documents have headings: on Qasper they raised recall from 51% to 56%. Semantic chunking needs an extra embedding pass over every sentence and gave nothing back, which matches [published results](https://arxiv.org/abs/2410.13070) on real documents.

### Adding Context to Chunks

Context methods address dependency: they put information from the rest of the document into each chunk. The cheapest is a title and section prefix. Two use an LLM: a one-sentence summary of the document added to every chunk, and Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), where an LLM writes a short context for each chunk with the whole document in view.

Each method can be used in two ways. The added text can go into the embedding only, so it helps search, while the model receives the original chunk. Or the added text is also sent to the model, where it uses budget. For Qasper, these runs used 100 papers to keep the per-chunk LLM calls affordable.

| Context method | SQuAD | RepliQA | Qasper (100 papers) |
|---|---|---|---|
| None | 86% | 77% | 53% |
| Title and section prefix, sent | 86% | 71% | 53% |
| Title and section prefix, embedded only | 86% | 74% | 55% |
| LLM summary of the document, sent | 84% | 75% | 43% |
| LLM summary of the document, embedded only | 86% | 77% | 47% |
| LLM context per chunk, sent | 84% | 76% | 50% |
| LLM context per chunk, embedded only | 86% | 79% | 58% |

*Per-chunk LLM context helps search on documents that depend on context, but only when the model receives the original chunk.*

Per-chunk context raised recall by 2.5 points on RepliQA and 5 points on Qasper, and did nothing on SQuAD, whose chunks mostly stand alone. Sending the added context to the model erased the gain, because it used budget that would otherwise hold more chunks. It is also the most expensive method to index: our three datasets took 26,527 LLM calls and about 60 million input tokens, about $11 with DeepSeek v4.1 Flash. A document summary costs one call per document but did not help.

Two methods expand what is sent instead: sending the chunks before and after each hit, and searching 128-token chunks but sending the 510-token chunk that contains each hit. Both lowered recall at a fixed budget on most datasets (neighbors: 73%, 68%, 38%; parent: 81%, 83%, 45%), because each hit uses more of the budget.

### How Chunks Are Searched

| Search | SQuAD | RepliQA | Qasper |
|---|---|---|---|
| Dense vectors | 86% | 77% | 51% |
| Keyword search (BM25) | 93% | 91% | 51% |
| [Hybrid](/documentation/search/hybrid-queries/) (dense and BM25) | 95% | 93% | 55% |
| Hybrid with section boundaries | 95% | 93% | 60% |

*Hybrid search with section boundaries was the best setup on all three datasets.*

The search method moved recall more than any chunking choice. Keep in mind that SQuAD and RepliQA questions reuse the wording of their passages, which favors keyword search. With reworded questions, BM25 fell to 50% to 54% while hybrid stayed at 63% to 76% (see the earlier table). In Qdrant, BM25 is a sparse vector with the IDF modifier, and hybrid search combines it with dense vectors in one query through prefetch and Reciprocal Rank Fusion (RRF).

The last row adds one rule to hybrid search: a chunk never crosses a section heading. A paper is split into Introduction, Method, Results, and so on first, and only then into 256-token chunks. Without the rule, one chunk can hold the end of Method and the start of Results, which makes it a weaker match for questions about either. Only Qasper has headings, so the rule changed nothing on SQuAD and RepliQA and added 5 points on Qasper.

## Recommendations

| Your documents | Start with |
|---|---|
| Short, self-contained entries (FAQs, tickets, catalog items) | Recursive chunks of 128 to 256 tokens, hybrid search, no overlap |
| Documents with headings (manuals, reports, papers) | Section boundaries, then recursive chunks of 256 tokens, hybrid search |
| Long documents where most chunks depend on context | The same, plus per-chunk LLM context in the embedding only, if the indexing cost fits |
| A small collection, rare questions, exact identifiers | An agent with grep may be enough |

When your budget grows, send more chunks rather than bigger ones. Skip overlap and semantic chunking unless you measure a gain on your own data.

To check that these picks carry over to new documents, we picked the best setting at each budget from two datasets and tested it on the third. In 11 of 12 cases, the pick landed within 5 points of the best setting for the held-out dataset. The one miss was Qasper at 500 tokens, where section boundaries beat the pick by 7.6 points.

## Check Your Own Setup

Your documents and questions decide the right setup, and the measurement takes a few minutes. You need a folder of text files and a short list of real questions, each with the passage from your documents that answers it. Thirty to fifty questions are enough to see large differences.

`check_chunking.py` in the [companion repository](TODO-link) reports recall at your token budgets and the tokens sent per answer for each chunk size, and prints the longest chunk for the truncation check:

```bash
./check_chunking.py docs/ questions.csv --sizes 128,256,512 --budgets 1000,4000
```

On 40 RepliQA documents, it printed:

```text
  size  longest   found @1000  tokens   found @4000  tokens
   128      130           98%     949          100%    3955
   256      258           95%     897           99%    3894
   512      512           91%     864          100%    3794
```

If recall is low, look at the questions it misses. A passage split across two chunks points to boundaries. The right document but the wrong chunk points to chunk size. Questions that use different words from the passage point to hybrid search.

## When to Adjust

Measure again when you add a new kind of document, when users start asking different kinds of questions, when your budget changes, or when you switch embedding models. A new embedding model means re-chunking and re-embedding, because its input limit and tokenizer may differ.

The same two questions apply beyond text. With audio and video, the budget is tighter and the order is given, but deciding where to cut is harder.

## How We Measured

- **Datasets:** SQuAD v1.1 validation (48 Wikipedia articles, 10,570 questions), RepliQA split 0 (3,591 documents, 14,083 answerable questions), and Qasper validation and test (697 papers, 1,976 questions with text evidence). Each question has a human-labeled answer passage. SQuAD and RepliQA search the whole collection. Qasper searches within its own paper, because its questions were written as if the paper were already open.
- **Setup:** bge-small-en-v1.5 embeddings through FastEmbed, Qdrant, and LangChain's recursive splitter sized in the embedding model's tokens. BM25 uses Qdrant sparse vectors with the IDF modifier.
- **Limits:** chunks of at most 128, 256, or 510 tokens, counted with the bge-small-en-v1.5 tokenizer, so no embedding input exceeded the model's 512-token limit. Context budgets of 500, 1,000, 2,000, and 4,000 tokens of retrieved text, not counting instructions or the question.
- **Recall at a token budget:** search results are added in rank order until the next one would exceed the budget. A passage counts as reached when at least 80% of its characters are in the sent text, a threshold set before any run.
- **Noise:** with about 10,000 questions, differences of one or two points are meaningful for SQuAD and RepliQA. Qasper has about 2,000 questions, so its 95% confidence intervals are about 4 points wide. The reworded-question and agent results use 300 and 100 questions, so treat differences under 5 points as noise.
- **Not measured:** answer correctness, and embedding models other than bge-small-en-v1.5.

Code, notebooks, and all results are in the [companion repository](TODO-link).

## Related Reading

- [Text Chunking Strategies](/course/essentials/day-1/chunking-strategies/): the lesson with code for each strategy.
- [How to Choose an Embedding Model](/documentation/search-patterns/choose-embedding-model/): the model decides your chunk size limit.
- [Filtering in Vector Search](/documentation/search-patterns/vector-search-filtering/): which chunk payload fields to index.
- [Data Management Integrations](/documentation/data-management/): chunking libraries that write to Qdrant.
