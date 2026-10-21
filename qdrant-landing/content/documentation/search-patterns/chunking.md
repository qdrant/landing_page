---
title: "How to Choose a Chunking Strategy"
short_description: "Pick a chunk size, boundary method, and context method from your token budget and your documents, with measured results on three datasets."
description: "Pick a chunk size, boundary method, and context method from your token budget and your documents, with results measured on three datasets."
weight: 5
author: Andrei Cristea
date: 2026-10-19T00:00:00+00:00
draft: false
---

# How to Choose a Chunking Strategy

How do you eat an elephant? One bite at a time. Or, as we say in software development, *divide and conquer*. Chunking belongs to the same family of strategies.

Imagine a library of books about animals stored in a vector search engine. To answer a question like "What color is an elephant?", you first need to find the right book and the right chapter. But how do you get there without proper guidance?

{{< island path="content/documentation/headless/chunking/split" ratio="700 / 284" title="Split between complete statements: each chunk gets its own vector and search returns one chunk, so a boundary inside a sentence can return half the answer. Illustrative boundaries, not token counts." >}}
![What color is an elephant? Split between sentences, the returned chunk contains "Elephants are usually gray." Split inside the sentence, the returned chunk contains only "are usually gray", while "Elephants" stays in the chunk before it.](/articles_data/chunking-guide/good-and-bad-split.svg)
{{< /island >}}

This is where chunking becomes useful. Chunking splits documents into isolated vector points that search can return on their own. Done well, each point describes itself and the answer is traceable to its source: the chunk says elephants are usually gray. Done badly, the answer is split between chunks and causes more harm than help: the returned chunk says something is gray, and what is gray sits in another chunk.

## General Recommendation

Chunking is mostly used in the retrieval step of a [RAG pipeline](/articles/what-is-rag-in-ai/), helping the system find focused, traceable information. A useful chunk holds one answerable piece of information, completely, and little else around it.

> **Recommended starting point:** Use recursive splitting with chunks of up to 256 tokens, no overlap, and hybrid search. For documents with headings, split each section separately. In our tests, a 1,000-token retrieval budget included the answer passage for **95% of SQuAD questions, 92% of RepliQA, and 60% of Qasper**. Treat this as a starting point to test on your own data.

*About the numbers:* they come from SQuAD, RepliQA, and Qasper, three public datasets whose context dependency runs from low to high in that order. [How We Measured](#how-we-measured) describes them.

## Context Budget Leads the Results

Your context budget is how many tokens of retrieved text you can afford per answer, after your instructions and the question. We compare every chunking setup under the same budget, not under the same top-k.

Top-k is fine for running a search. The problem is using a fixed number of chunks to compare chunking strategies with different chunk sizes:

| Evaluation | 128-token chunks | 510-token chunks |
|---|---|---|
| Fixed top-5 | Up to 640 tokens | Up to 2,550 tokens |
| Fixed 1,000-token budget | Up to 1,000 tokens | Up to 1,000 tokens |

Most chunking benchmarks compare a fixed number of results (top-k). But larger chunks mean more text sent to the LLM, making comparisons unfair and increasing costs. **This guide uses a fixed token budget instead**, giving every strategy the same context limit.

Our central metric is **recall at a token budget**: how often the right evidence reaches the LLM within that limit.

We fill the budget with search results in rank order. A question counts as **found** if the retrieved text contains at least 80% of its human-labeled answer passage (measured in characters). Recall is the percentage of questions found.

This measures **whether the LLM receives the evidence**, not whether it answers correctly.

{{< island path="content/documentation/headless/chunking/budget" ratio="700 / 340" title="Compare chunking setups at the same token budget, not the same top-k: filled in rank order, 1,000 tokens deliver the answer only with the small chunks, and larger chunks need a larger budget. Chunk sizes are illustrative." >}}
![Two 1,000-token prompts filled in rank order. Eight chunks of up to 128 tokens fit, and the answer, ranked fifth, is sent. Only one chunk of up to 510 tokens fits, a 500-token chunk, and the answer, ranked second in a 505-token chunk, is not sent.](/articles_data/chunking-guide/budget-filling.svg)
{{< /island >}}

Two different token limits appear in this guide:

| Limit | What it caps | Value used in this guide |
|---|---|---|
| Embedding model input limit | One chunk, when the embedding model turns it into a vector | 512 tokens for bge-small-en-v1.5, including two special tokens, so every chunk is at most 510 tokens |
| Context budget | All retrieved text sent to the LLM in one prompt | 500, 1,000, 2,000, or 4,000 tokens. Tables use 1,000 unless they say otherwise |

## What to Choose for Your Documents

The chart shows how each splitting method did under the same 1,000-token budget, and the table below says when each one is worth choosing.

{{< chart id="chunking/methods-boundaries" caption="Start with recursive splitting, and split by structure when documents have headings: at 1,000 tokens, structure adds 5 points on Qasper, the only dataset with headings. Fixed windows lose 14 to 17 points, and overlap and semantic splitting stay within about 3 points of recursive splitting." >}}

Start with recursive splitting. It is the default in most libraries, it cuts at paragraph breaks before lines and sentences, and the only boundary rule we tested that beat it, splitting by structure, did so by 5 points, on the one dataset with headings.

| Method                   | Try it when                                              | Gains                                                                              | Gives up                                                                                             |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Recursive                | By default, on any text                                  | Respects paragraphs; best or near-best on all three datasets                       | Sizes vary (about 190 tokens at a 256 maximum), and a chunk can run one section into the next        |
| By structure             | Documents with headings (Markdown, HTML, parsed PDFs)    | No chunk crosses a heading: 5 points more on Qasper                                | Needs headings from a parser; short sections make more chunks (Qasper went from 18,893 to 22,442)    |
| Fixed windows            | Text with no breaks to cut at                | Predictable token-sized windows, so budget math is simple, and nothing needs parsing | Cuts through answers (32% of RepliQA answer passages at 256 tokens) and scored 14 to 17 points lower |
| Overlap, with any method | Fixed windows, where boundaries cut answers  | Protects an answer cut by a boundary                                               | Repeats text that uses budget; moved recall by under 2 points with recursive splitting               |

Semantic chunking is not in the table because it did not beat recursive splitting. The variant tested here cuts where the distance between neighboring sentences is in a document's top 5%, LangChain's default threshold, comparing single sentences. It needs an extra embedding pass over every sentence and scored up to 3 points below recursive splitting, which matches [published results](https://arxiv.org/abs/2410.13070).

### How Chunks Are Searched

{{< chart id="chunking/methods-search" caption="Start with hybrid search: at 1,000 tokens it beats dense search and BM25 on every dataset, by 1 to 4 points over BM25, and splitting by structure adds 5 more on Qasper." >}}

With recursive chunking, switching from dense to hybrid search improved recall the most on SQuAD and RepliQA, by 9 and 16 points. On Qasper, splitting by structure, so that no chunk crosses a heading, mattered more: 5 points, against 4 for hybrid search.

The reason is that SQuAD and RepliQA questions often reuse wording from the source passages, giving keyword search an advantage. When questions were rephrased by an LLM, that advantage largely disappeared (see [When Chunking Is Not Worth It](#when-chunking-is-not-worth-it)).

In Qdrant, [hybrid search](/documentation/search/hybrid-queries/) combines dense vectors with BM25 sparse vectors using Reciprocal Rank Fusion (RRF). Splitting by structure makes no difference on datasets without headings, but noticeably improves retrieval on structured documents like Qasper.

### Chunk Size

{{< chart id="chunking/recall-by-budget" caption="Spend a bigger budget on more chunks, not bigger ones: 510-token chunks score lowest at every budget. With dense search, 128-token chunks lead at small budgets on SQuAD and RepliQA and the gap closes as the budget grows; on Qasper, 256-token chunks lead by 5 to 7 points at 1,000 and 2,000 tokens." >}}

Bigger chunks are not necessarily better: they can mix unrelated topics, and fewer of them fit in the same budget, as the figure in [Context Budget Leads the Results](#context-budget-leads-the-results) shows. But chunks that are too small can separate information that belongs together. With dense search, 128-token chunks lead on SQuAD and RepliQA, but that advantage disappears once keyword matching is added. With hybrid search, which the recommendations use, 256 tokens beat 128 on all three datasets: 95% against 93% on SQuAD, 92% against 90% on RepliQA, and 55% against 49% on Qasper. Splitting Qasper by structure raises the 256-token result to 60%, the number in the recommended starting point. So we recommend 256 by default.

When your budget grows, send more chunks rather than bigger ones. Single facts suit small chunks, and answers spread over more than one paragraph suit larger ones.

### Overlap

Overlap is a setting, not a method: it repeats the end of one chunk at the start of the next, with any splitter, and the common advice is 10% to 20%. Overlap protects answers cut in half by a boundary, and a splitter that cuts at paragraph breaks rarely does that: only about 6% of RepliQA answer passages crossed one with 256-token recursive chunks, against 32% with 256-token fixed windows. So with 64 tokens of overlap on 256-token chunks, recall at 1,000 tokens moved by less than 2 points on every dataset, within the noise. Overlap may matter more with fixed windows, which we tested without it.

### The Embedding Model's Input Limit

Many open embedding models stop reading at 512 tokens or fewer and drop the rest without warning: [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) reads 256 and [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) reads 512.

Measure chunks with the model's own tokenizer. Every chunk in this guide stayed within 512 tokens, including those with added context.

### How Much Context Your Documents Carry

Another important part is context dependency of the document. A chunk depends on its document when it cannot be understood on its own. It might refer back to something defined earlier ("the elephant", "cocktails"), need the document's structure, or be ambiguous without the title ("revenue grew 3%" for which company?). These categories come from the [ConTEB benchmark](https://arxiv.org/abs/2505.24782).

Context dependency is one factor that makes chunking harder. An LLM judged whether the chunk holding the answer made sense without its document, for 100 random questions per dataset. Qasper was the least self-contained and scored lowest, though its papers also differ from the other datasets in structure, answer length, and search scope.

| Dataset | Self-contained answer chunks | With title and section prefix |
|---|---|---|
| SQuAD (Wikipedia) | 71% | 75% |
| RepliQA (policies, reports, news) | 60% | 71% |
| Qasper (research papers) | 10% | 22% |

*Most failures are references back to earlier text: 25% of SQuAD chunks, 35% of RepliQA chunks, and 90% of Qasper chunks. Even with a title and section prefix, only 22% of Qasper answer chunks stand on their own, and the richer per-chunk LLM context below raised Qasper recall by only about 5 points.*

### Adding Context to Chunks

Context methods put part of the document into each chunk:
- A title and section prefix
- An LLM-written document summary
- Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), an LLM-written context per chunk

{{< island path="content/documentation/headless/chunking/context" ratio="700 / 244" title="Put added context in the embedding, not the prompt: sent context uses budget, so fewer chunks fit. Sizes are illustrative." >}}
![Two 1,000-token prompts. When added context goes into the embedding only, the prompt receives the original chunks and four fit. When the context is also sent, each chunk carries it into the prompt and only three fit.](/articles_data/chunking-guide/context-embedded-vs-sent.svg)
{{< /island >}}

| Context added to each chunk | Where it goes | SQuAD | RepliQA | Qasper |
|---|---|---|---|---|
| None | | 86% | 77% | 53% |
| Title and section prefix | Embedding only | 86% | 74% | 55% |
| | Embedding and prompt | 86% | 71% | 53% |
| LLM summary of the document | Embedding only | 86% | 77% | 47% |
| | Embedding and prompt | 84% | 75% | 43% |
| LLM context per chunk | Embedding only | 86% | 79% | 58% |
| | Embedding and prompt | 84% | 76% | 50% |

*Recall at a 1,000-token budget. Qasper uses 100 papers for this comparison.*

Per-chunk LLM context in the embedding only raised recall by 2.5 points on RepliQA and about 5 on Qasper, at the edge of the noise for 100 papers, and did nothing on SQuAD. These gains disappeared when the extra context was also sent to the model. This was also the most expensive approach to index, requiring over 26,000 LLM calls and around 60 million input tokens (about $11 with DeepSeek v4.1 Flash). Document-level summaries did not help, and lowered Qasper recall.

Start without generated context. Add per-chunk context to the embedding only, and only if your own evaluation shows that your documents need it.

Adding neighboring chunks or retrieving a larger parent chunk also reduced recall, as each result consumed more of the token budget. However, these approaches might still improve answer quality, which we did not measure.

In Qdrant, the [Grouping API](/documentation/search/search/#grouping-api) groups search results by document, while `with_lookup` can attach parent content stored separately, avoiding duplication.


### Tools for Chunking

Most tools ship the standard methods under their own names:

- **Recursive splitting:** LangChain `RecursiveCharacterTextSplitter`.
- **Fixed windows:** LangChain `TokenTextSplitter`.
- **Splitting by structure:** LangChain `MarkdownHeaderTextSplitter` for Markdown. For PDFs and HTML, Unstructured's `by_title` strategy and [Docling's `HybridChunker`](https://docling-project.github.io/docling/concepts/chunking/) split at the headings their parsers find.

n8n's text splitter nodes are built on the same splitters. The [chunking lesson](/course/essentials/day-1/chunking-strategies/) in the Qdrant course has code for each method, the [Unstructured integration](/documentation/data-management/unstructured/) chunks by title straight into a Qdrant collection, and the [LangChain](/documentation/frameworks/langchain/) and [n8n](/documentation/platforms/n8n/) integrations take your chunks from there into Qdrant.

Whatever the tool:

- Keep a parsed PDF in reading order.
- Keep a table in one chunk, or repeat its header row.
- Store the document ID, section, and position in the payload, so an answer can cite its source and a [payload filter](/documentation/search-patterns/vector-search-filtering/) can narrow the search.


## Check the Result

Inspect the chunks before you run a query:

- The longest chunk fits the embedding model's limit, counted with the model's own tokenizer.
- No chunk ends in the middle of a sentence or a table.
- Each chunk carries its document ID and position in the payload.
- Most of 20 random chunks, read on their own, make sense without their document.

Then test retrieval with 30 to 50 questions like the ones your users ask, each paired with the passage that answers it: fill your budget with the results in rank order and check whether that passage is in what you would send. The misses fall into three causes:

- The answer is cut by a chunk boundary: try splitting by structure or a larger chunk.
- The right document was found but other parts of it ranked higher: try hybrid search or a reranker.
- The document was not found and the question uses other words than the text: check the embedding model, or add keyword search for exact terms.

Stop tuning when your setup finds the evidence for most questions and the alternatives move recall only within the noise: keep the simpler setup.

Finding the evidence is not the same as answering correctly, and this guide measures the first. Once retrieval looks right, read a sample of answers against the passages they came from.

## When Chunking Is Not Worth It

Sending the whole document is enough when you know which document holds the answer and it fits your budget: an average RepliQA document is about 1,250 tokens, a SQuAD article about 6,900, a Qasper paper about 5,000. Most applications do not know which document holds the answer, and finding it in a large collection is the problem retrieval solves.

The other way to skip chunking is to grep the raw files. Plain grep found the answer passage within a 1,000-token budget for 75% of SQuAD questions and 86% of RepliQA questions, but those questions reuse the words of the passage they were written from. So an LLM rewrote 300 questions per dataset, keeping names and numbers, until only 17% to 22% of question words appeared in the answer passage, down from 56% to 66%. The chart compares the same 300 RepliQA questions in both wordings; switch the view for the cost per answer.

{{< chart id="chunking/wording-vs-cost" caption="Rely on grep only when questions reuse the documents' exact words: when the wording changes, grep loses two thirds of its hits and BM25 almost half, while vector search over chunks loses 16 to 20 points. The agent loses 4, at several times the tokens." caption2="Retrieval sends about 900 tokens in one call. The agent uses a median of 5,100 to 7,600 tokens across three to four calls, and its mean is far higher because a few questions run long." >}}

Grep is enough for a small collection, rare questions, or exact identifiers. Chunk when users ask in their own words, when you answer many questions over a large collection, or when cost per answer must be predictable.

## When to Adjust

Measure again when you add a new kind of document, when users ask different kinds of questions, when your budget changes, or when you switch embedding models. A new embedding model always means re-embedding. Re-chunk if its tokenizer or input limit changes your chunk sizes, or if your retrieval evaluation shows that different boundaries or sizes work better.

The same trade-offs apply beyond text. With audio and video, the budget is tighter and the order is given, but deciding where to cut is harder.

## How We Measured

### Datasets
We tested three datasets with human-labeled answer passages:

- **SQuAD v1.1** (validation): Wikipedia articles (48 articles, 10,570 questions).
- **RepliQA** (split 0): Fictional company policies, incident reports, and local news (3,591 documents, 14,083 questions).
- **Qasper** (validation and test): NLP research papers (697 papers, 1,976 questions).

### Setup and statistical confidence
- **Tools:** `bge-small-en-v1.5` via FastEmbed, Qdrant, and LangChain's recursive splitter, using embedding-model tokens for chunk sizes and budgets.
- **Token counting:** The same tokenizer measures chunk sizes and retrieval budgets. Your LLM may count tokens slightly differently.
- **Significance:** Differences of 1–2 recall points are meaningful on SQuAD and RepliQA. Qasper has confidence intervals about 4 points wide, while smaller experiments with 100–300 questions need improvements above 5 points to be convincing.

### Context dependency validation
We used **DeepSeek v4.1 Flash** and **Claude Haiku 5.5** to evaluate whether chunks could be understood independently.

- A human checked 30 chunks, agreeing with DeepSeek on 27 and Claude on 23. Given this small validation sample, we report DeepSeek's estimates.
- Claude rated more chunks as self-contained: **82%, 74%, and 23%** without context prefixes, rising to **91%, 82%, and 30%** with prefixes, across SQuAD, RepliQA, and Qasper.

### Scope and reproducibility
We did not measure answer correctness, other embedding models, semantic chunkers, reranking, PDF/table parsing, or [late chunking](https://arxiv.org/abs/2409.04701).

For comparison, [NVIDIA's chunking benchmark](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/) evaluates answer accuracy on PDFs and found that page-level chunks performed well.

**All code, notebooks, and results** are available in the [companion repository](https://github.com/qdrant-labs/chunking-guide-methods).

## Related Reading

- [Text Chunking Strategies](/course/essentials/day-1/chunking-strategies/): the lesson with code for each strategy.
- [How to Choose an Embedding Model](/documentation/search-patterns/choose-embedding-model/): the model decides your chunk size limit.
- [Hybrid Queries](/documentation/search/hybrid-queries/): dense and sparse vectors in one query.
- [Filtering in Vector Search](/documentation/search-patterns/vector-search-filtering/): which chunk payload fields to index.
- [UltraBERT Fits 32K Tokens in One Vector](/blog/ultrabert-embed/): whole-document vectors from a long-context model compared with 512-token chunks.
- [Data Management Integrations](/documentation/data-management/): chunking libraries that write to Qdrant.
