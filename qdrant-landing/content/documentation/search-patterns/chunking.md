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

Chunking became the go-to way to split large collections of documents. Imagine a library of books stored in a vector search engine: to answer a question about one chapter, you need to reach that chapter, not the whole book. Chunking is mostly used in the retrieval step of a [RAG pipeline](/articles/what-is-rag-in-ai/). But is it that useful?

Long context windows keep reviving the claim that RAG, and chunking with it, is no longer needed: put the whole context into the LLM. Even Qdrant has asked the question ([RIP Chunking?](/blog/ultrabert-embed/)). When you read one of these takes, it's important to keep a cool head and think about what constraints and requirements your system has.

Let's first look at what chunking is. Chunking splits documents into isolated vector points that search can return on their own. Done well, each point describes itself and the answer is traceable to its source. Done badly, the answer is split between chunks and causes more harm than help.

In the RepliQA dataset, for example, the answer to "What support does Vertex Dynamics provide under the Magical Toolkit?" is exam fees, textbooks, and paid study leave. Paragraph-based chunking keeps the whole answer in one chunk, while fixed 128-token chunks cut it between "paid time" and "off to study", so retrieval returns only half of it.

![One document split two ways. At paragraph breaks, the answer sits inside one chunk and search returns it whole. With fixed 128-token windows, a boundary falls inside the answer, so search returns one chunk and the rest of the answer stays in the other.](/articles_data/chunking-guide/good-and-bad-split.svg)

*Chunk widths are proportional to their token counts.*

A useful chunk holds one answerable piece of information, completely, and little else around it. Two things decide how to chunk: how many tokens you can send per answer, which this guide calls the context budget, and how much a passage depends on the rest of its document, which it calls context dependency.

**The setup that worked for us:** recursive splitting, 256-token chunks, no overlap, top-k ≈ budget ÷ chunk size, hybrid search, and no chunk crossing a heading. With a 1,000-token budget, it got the answer to the model for 95% of SQuAD questions, 92% of RepliQA, and 60% of Qasper. The rest of the guide is why.

*About the numbers:* they come from SQuAD, RepliQA, and Qasper, three public datasets whose context dependency runs from low to high in that order; [How We Measured](#how-we-measured) describes them. Every setup gets the same budget of retrieved text, not the same number of chunks, because that is how you pay. A question counts as found when at least 80% of its answer passage, counted in characters, reaches the model, whether or not the model then answers correctly. The share of questions found is recall at a token budget, the metric behind every table and chart here.

## Configure Your Chunks

Two settings, chunk size and overlap, sit between two limits, the context budget and the embedding model's input length, and the right values depend on how much context your documents carry.

### Context Budget

Your context budget is how many tokens of retrieved text you can afford per answer, after your instructions and the question. The model's context window is the hard limit, but cost and latency usually set a much lower one.

![Two 1,000-token prompts filled in rank order. Eight chunks of up to 128 tokens fit, and the answer, ranked fifth, is sent. Only one chunk of up to 510 tokens fits, a 500-token chunk, and the answer, ranked second in a 505-token chunk, is not sent.](/articles_data/chunking-guide/budget-filling.svg)

*How a 1,000-token budget is filled, with illustrative chunk sizes.*

Two different token limits appear in this guide:

| Limit | What it caps | Value used in this guide |
|---|---|---|
| Embedding model input limit | One chunk, when the embedding model turns it into a vector | 512 tokens for bge-small-en-v1.5, including two special tokens, so every chunk is at most 510 tokens |
| Context budget | All retrieved text sent to the LLM in one prompt | 500, 1,000, 2,000, or 4,000 tokens. Tables use 1,000 unless they say otherwise |

### Chunk Size

A chunk size setting is a maximum: the splitter cuts at paragraph or line breaks, so most chunks are shorter. Recursive chunks averaged about 90, 190, and 410 tokens at those maximums, so a 1,000-token budget holds about ten chunks of up to 128 tokens, about five of up to 256, and about two of up to 510.

| Maximum chunk size | SQuAD | RepliQA | Qasper | Tokens sent |
|---|---|---|---|---|
| 128 tokens | 88% | 84% | 46% | about 950 |
| 256 tokens | 86% | 77% | 51% | about 900 |
| 510 tokens | 65% | 59% | 40% | about 850 |

*Small chunks give the model more separate search results in the same space. On Qasper, where passages depend on their paper, 256 tokens beat 128.*

{{< chart id="chunking/recall-by-budget" caption="Small chunks lead at small budgets on SQuAD and RepliQA, and the gap closes as the budget grows. On Qasper, 256-token chunks lead by 5 to 7 points at 1,000 and 2,000 tokens, and by less than the noise at 500 and 4,000." >}}

When your budget grows, send more chunks rather than bigger ones. Single facts suit small chunks, and answers spread over more than one paragraph suit larger ones: on Qasper, whose answers span paragraphs, 256 beat 128.

### Overlap

Overlap is a setting, not a method: it repeats the end of one chunk at the start of the next, with any splitter, and the common advice is 10% to 20%. With 64 tokens of overlap on 256-token chunks, recall at 1,000 tokens moved by less than 2 points on every dataset (86.3% to 86.5% on SQuAD, 76.9% to 77.5% on RepliQA, 50.8% to 52.2% on Qasper), within the noise. Overlap protects answers cut in half by a boundary, and a splitter that cuts at paragraph breaks rarely does that: about 6% of RepliQA answer passages crossed one with 256-token recursive chunks, against 32% with 256-token fixed windows. Overlap may matter more with fixed windows, which we tested without it.

### The Embedding Model's Input Limit

Many open embedding models stop reading at 512 tokens or fewer and drop the rest without warning: [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) reads 256 and [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) reads 512. Most splitters, LangChain's included, count characters unless you pass a token counter ([splitter docs](https://docs.langchain.com/oss/python/integrations/splitters)), so measure chunks with the model's own tokenizer. Every chunk in this guide stayed within 512 tokens, including those with added context.

Long-context models such as [UltraBERT-Embed](/blog/ultrabert-embed/) read 32,000 tokens, but with bge-small, smaller chunks found a detail inside a long document more often, and we didn't test whether that holds for long-context models.

### How Much Context Your Documents Carry

A chunk depends on its document when it can't be understood on its own. It might refer back to something defined earlier ("the employee", "our model"), need the document's structure, or be ambiguous without the title ("revenue grew 3%" for which company?). These categories come from the [ConTEB benchmark](https://arxiv.org/abs/2505.24782).

Two LLMs judged whether the chunk holding the answer made sense without its document, for 100 random questions per dataset. The first model's rate comes first and the second's in brackets; [How We Measured](#how-we-measured) has the check against a person.

| Dataset | Self-contained answer chunks | With title and section prefix |
|---|---|---|
| SQuAD (Wikipedia) | 71% (82%) | 75% (91%) |
| RepliQA (policies, reports, news) | 60% (74%) | 71% (82%) |
| Qasper (research papers) | 10% (23%) | 22% (30%) |

*Most failures are references back to earlier text: 25% of SQuAD chunks, 35% of RepliQA chunks, and 90% of Qasper chunks. Treat research papers as high dependency; contracts likely are too, though we didn't test them.*

## Choose a Method

Start with recursive splitting. It is the default in most libraries, it cuts at paragraph breaks before lines and sentences, and the only way of cutting that beat it, section boundaries, did so by 5 points on one dataset. Then improve it in two directions: how chunks are searched, and what context each chunk carries. Each chart and table in this section shows recall at a 1,000-token budget.

### Where to Cut

{{< chart id="chunking/methods-boundaries" caption="Fixed-size windows lose on every dataset. Section boundaries help only Qasper, the one dataset with headings. The semantic method tested here scores lower than recursive splitting on every dataset, by up to 3 points." >}}

Fixed-size windows cut every N tokens regardless of sentences and paragraphs, which is what split the *Magical Toolkit answer* in the [introduction](#how-to-choose-a-chunking-strategy). At 256 tokens they lost on every dataset against 256-token recursive chunks: 69% against 86% on SQuAD, 63% against 77% on RepliQA, 37% against 51% on Qasper. Section boundaries add one rule to recursive splitting: a chunk never crosses a heading, so it never mixes the end of Method with the start of Results. Only Qasper has headings, and there the rule raised recall from 51% to 56%.

| Method | Try it when | Gains | Gives up |
|---|---|---|---|
| Recursive | By default, on any text | Respects paragraphs; best or near-best on all three datasets | Sizes vary (about 190 tokens at a 256 maximum), and a chunk can run one section into the next |
| By structure | Documents with headings (Markdown, HTML, parsed PDFs) | No chunk crosses a heading: 5 points more on Qasper | Needs headings from a parser; short sections make more chunks (Qasper went from 18,893 to 22,442) |
| Fixed windows | Text with no breaks to cut at (not tested) | Every chunk is exactly N tokens, so budget math is exact and nothing needs parsing | Cuts through answers (32% of RepliQA answer passages at 256 tokens) and scored 14 to 17 points lower |
| Overlap, with any method | Fixed windows, where boundaries cut answers (not tested) | Protects an answer cut by a boundary | Repeats text that uses budget; moved recall by under 2 points with recursive splitting |

The semantic method tested here cuts where the distance between neighboring sentences is in a document's top 5%, LangChain's default threshold, comparing single sentences. It needs an extra embedding pass over every sentence and gave nothing back, which matches [published results](https://arxiv.org/abs/2410.13070).

Most tools ship all three methods under their own names. In LangChain, `RecursiveCharacterTextSplitter` is recursive splitting, `TokenTextSplitter` is fixed windows, and `MarkdownHeaderTextSplitter` splits at headings, and n8n's text splitter nodes are built on the same splitters. For PDFs and HTML, Unstructured's `by_title` strategy and [Docling's `HybridChunker`](https://docling-project.github.io/docling/concepts/chunking/) split at the headings their parsers find. The [chunking lesson](/course/essentials/day-1/chunking-strategies/) in the Qdrant course has code for each method, the [Unstructured integration](/documentation/data-management/unstructured/) chunks by title straight into a Qdrant collection, and the [LangChain](/documentation/frameworks/langchain/) and [n8n](/documentation/platforms/n8n/) integrations take your chunks from there into Qdrant. Whatever the tool, keep a parsed PDF in reading order, keep a table in one chunk or repeat its header row, and store the document ID, section, and position in the payload so an answer can cite its source and a [payload filter](/documentation/search-patterns/vector-search-filtering/) can narrow the search.

### How Chunks Are Searched

{{< chart id="chunking/methods-search" caption="At 1,000 tokens, hybrid search scores highest on every dataset, 1 to 4 points over BM25, and most on Qasper with section boundaries." >}}

The search method moved recall more than any chunking choice. SQuAD and RepliQA questions reuse the wording of their passages, which favors keyword search: when an LLM reworded the questions (see [When Chunking Is Not Worth It](#when-chunking-is-not-worth-it)), BM25 fell to 50% to 54%. With 128-token chunks, hybrid led dense search by 5 points on the original wording and was within the noise on the reworded. In Qdrant, BM25 is a sparse vector with the IDF modifier, and [hybrid search](/documentation/search/hybrid-queries/) combines it with dense vectors in one query through prefetch and Reciprocal Rank Fusion (RRF). Hybrid search scored highest of the search methods on every dataset. Section boundaries change nothing on SQuAD and RepliQA, which have no headings, but on Qasper they lift hybrid search from 55% to 60%, against the 51% baseline.

### Adding Context to Chunks

Context methods put part of the document into each chunk: a title and section prefix, an LLM-written document summary, or Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), an LLM-written context per chunk. The added text can go into the embedding only, or also be sent, where it uses budget.

![Two 1,000-token prompts. When added context goes into the embedding only, the prompt receives the original chunks and four fit. When the context is also sent, each chunk carries it into the prompt and only three fit.](/articles_data/chunking-guide/context-embedded-vs-sent.svg)

*Sent context uses budget, so fewer chunks fit. Sizes are illustrative.*

| Context method | SQuAD | RepliQA | Qasper (100 papers) |
|---|---|---|---|
| None | 86% | 77% | 53% |
| Title and section prefix, sent | 86% | 71% | 53% |
| Title and section prefix, embedded only | 86% | 74% | 55% |
| LLM summary of the document, sent | 84% | 75% | 43% |
| LLM summary of the document, embedded only | 86% | 77% | 47% |
| LLM context per chunk, sent | 84% | 76% | 50% |
| LLM context per chunk, embedded only | 86% | 79% | 58% |

Per-chunk context in the embedding only raised recall by 2.5 points on RepliQA and about 5 on Qasper, at the edge of the noise for 100 papers, and did nothing on SQuAD, whose chunks mostly stand alone; sending it erased the gain. It is also the most expensive to index: 26,527 LLM calls and about 60 million input tokens, about $11 with DeepSeek v4.1 Flash. A document summary, one call per document, did not help. Sending each hit's neighbors lowered recall to 73%, 68%, and 38% against 86%, 77%, and 51%, and sending the 510-token parent of a 128-token hit lowered it to 81%, 83%, and 45% against 88%, 84%, and 46%, because each hit uses more budget. Both can still help the model answer, which we didn't measure. In Qdrant, the [Grouping API](/documentation/search/search/#grouping-api) returns the best hits per document, and `with_lookup` attaches a parent stored once in another collection.

## Recommendations

These starting points come from one embedding model (bge-small-en-v1.5), budgets of 500 to 4,000 tokens, and three English datasets. Check them on your own data.

| Your documents | Start with |
|---|---|
| Short, self-contained entries (FAQs, tickets, catalog items) | Recursive chunks of 256 tokens, hybrid search |
| Documents with headings (manuals, reports, papers) | Section boundaries, then recursive chunks of 256 tokens, hybrid search |
| Long documents where most chunks depend on context | The same, plus per-chunk LLM context in the embedding only, if the indexing cost fits |

Picking the best setting from two datasets and testing it on the third landed within 5 points of the best in 11 of 12 cases.

## Check the Result

Inspect the chunks before you run a query:

- The longest chunk fits the embedding model's limit, counted with the model's own tokenizer.
- No chunk ends in the middle of a sentence or a table.
- Each chunk carries its document ID and position in the payload.
- Most of 20 random chunks, read on their own, make sense without their document.

Then test retrieval with 30 to 50 questions like the ones your users ask, each paired with the passage that answers it: fill your budget with the results in rank order and check whether that passage is in what you would send. The misses fall into three causes:

- The answer is cut by a chunk boundary: try section-aware boundaries or a larger chunk.
- The right document was found but other parts of it ranked higher: try hybrid search or a reranker.
- The document was not found and the question uses other words than the text: check the embedding model, or add keyword search for exact terms.

Finding the evidence is not the same as answering correctly, and this guide measures the first. Once retrieval looks right, read a sample of answers against the passages they came from.

## When Chunking Is Not Worth It

Sending the whole document is enough when you know which document holds the answer and it fits your budget: an average RepliQA document is about 1,250 tokens, a SQuAD article about 6,900, a Qasper paper about 5,000. Most applications do not know which document holds the answer, and finding it in a large collection is the problem retrieval solves.

The other way to skip chunking is to grep the raw files. Plain grep found the answer within a 1,000-token budget for 75% of SQuAD questions and 86% of RepliQA questions, but those questions reuse the words of the passage they were written from. So an LLM rewrote 300 questions per dataset, keeping names and numbers, until about 17% to 22% of question words appeared in the answer passage, down from 56% to 66%. The chart compares the same 300 RepliQA questions in both wordings, including an agent that greps and can rephrase its searches; switch the view for the cost per answer.

{{< chart id="chunking/wording-vs-cost" caption="When the wording changes, grep loses two thirds of its hits and BM25 almost half, while vector search over chunks loses 16 to 20 points. The agent loses 4, at several times the tokens." caption2="Retrieval sends about 900 tokens in one call. The agent uses a median of 5,100 to 7,600 tokens across three to four calls, and its mean is far higher because a few questions run long." >}}

The same 300 SQuAD questions show the pattern: grep fell from 74% to 30%, dense search with 128-token chunks from 90% to 81%. Grep is enough for a small collection, rare questions, or exact identifiers. Chunk when users ask in their own words, when you answer many questions over a large collection, or when cost per answer must be predictable.

## When to Adjust

Measure again when you add a new kind of document, when users ask different kinds of questions, when your budget changes, or when you switch embedding models. A new model always means re-embedding. Re-chunk only if its input limit or tokenizer changes your chunk sizes.

The same two questions apply beyond text. With audio and video, the budget is tighter and the order is given, but deciding where to cut is harder.

## How We Measured

The datasets have human-labeled answer passages: SQuAD v1.1 validation (Wikipedia, 48 articles, 10,570 questions), RepliQA split 0 (company policies, incident reports, and local news about made-up entities, 3,591 documents, 14,083 questions), and Qasper validation and test (NLP research papers, 697 papers, 1,976 questions). SQuAD and RepliQA search the whole collection; Qasper searches within its own paper, because its questions assume the paper is open. The setup is bge-small-en-v1.5 through FastEmbed, Qdrant, and LangChain's recursive splitter sized in the model's tokens. Budgets are counted with the same tokenizer, so your LLM will count the same text slightly differently. Differences of one or two points are meaningful on SQuAD and RepliQA, Qasper's confidence intervals are about 4 points wide, and results on 300 or 100 questions need differences over 5 points.

For context dependency, [DeepSeek v4.1 Flash](https://www.deepseek.com/en/news/deepseek-v4-1-flash/) and [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) labeled the same chunks. A person labeled 30 of them, a small sample, and agreed with DeepSeek on 27 and with Claude Haiku on 23, so DeepSeek's rates lead the table. Not measured or covered: answer correctness, other embedding models and semantic chunkers, reranking, parsing PDFs and tables, and [late chunking](https://arxiv.org/abs/2409.04701); [NVIDIA's benchmark](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/) measures answer accuracy on PDFs, where page-level chunks did well. Code, notebooks, and all results are in the [companion repository](https://github.com/qdrant-labs/chunking-guide-methods).

## Related Reading

- [Text Chunking Strategies](/course/essentials/day-1/chunking-strategies/): the lesson with code for each strategy.
- [How to Choose an Embedding Model](/documentation/search-patterns/choose-embedding-model/): the model decides your chunk size limit.
- [Hybrid Queries](/documentation/search/hybrid-queries/): dense and sparse vectors in one query.
- [Filtering in Vector Search](/documentation/search-patterns/vector-search-filtering/): which chunk payload fields to index.
- [UltraBERT Fits 32K Tokens in One Vector](/blog/ultrabert-embed/): whole-document vectors from a long-context model compared with 512-token chunks.
- [Data Management Integrations](/documentation/data-management/): chunking libraries that write to Qdrant.
