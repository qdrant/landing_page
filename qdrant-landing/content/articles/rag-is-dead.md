---
title: "Is RAG Dead? Why Long Context Windows Don't Replace RAG"
short_description: "What published measurements show about long context windows versus retrieval: quality, cost, latency, and when each approach fits."
description: "Is RAG dead? Compare long context windows and retrieval with sourced measurements of quality, cost, and latency, and learn when each approach fits."
social_preview_image: /articles_data/rag-is-dead/preview/social_preview.jpg 
small_preview_image: /articles_data/rag-is-dead/icon.svg 
preview_dir: /articles_data/rag-is-dead/preview 
weight: 60
author: David Myriel & Chadha Sridi
author_link: https://github.com/davidmyriel
date: 2026-08-04T00:00:00.000Z
draft: false 
keywords: 
  - vector database 
  - vector search
  - retrieval augmented generation
  - long context
  - context window
category: core-concepts
---

# Is RAG Dead? Long Context Windows versus Retrieval

Every time a model ships a larger context window, someone declares that [retrieval augmented generation (RAG)](/articles/what-is-rag-in-ai/) is obsolete. If a model can read a million tokens, why build a retrieval pipeline?

A larger window changes the trade-off, but it does not remove it. This article reviews what published measurements say about quality, cost, and latency, and explains when each approach fits. Where a number comes from a paper, a vendor page, or our own calculation, the text says so. The sources are listed at the end.

**The short answer:** RAG is not dead, and long context is not a gimmick. For a small, stable set of documents, putting everything in the prompt is often the simplest option. For data that is large, changing, or access-controlled, retrieval is still the practical choice. Many systems use both.

## When long context is the better choice

If your documents fit in the window, you can skip retrieval and avoid its failure mode: the right passage never reaching the model. Anthropic's guidance from September 2024 says so directly. If your knowledge base is smaller than 200,000 tokens, about 500 pages, you can include all of it in the prompt.

Quality can favor long context too. A 2024 study compared RAG with long-context prompting on three LLMs. It found that long context consistently outperformed RAG on average when it was given enough resources, while RAG kept a significantly lower cost. A June 2026 case study on manufacturing safety training found the same ordering. Long-context prompting answered more questions correctly than semantic RAG (73.1% versus 65.4%), at 26 times the per-query token cost. The study used two small language models and 972 answers.

## Why more context is not always better

A large window is not the same as using it well. Four studies show how performance changes with input length:

- **Position matters.** Liu et al. found that models do best when the relevant information is at the beginning or the end of the input. Performance degrades significantly when it is in the middle.
- **Claimed size is not usable size.** RULER tested 17 long-context models. Almost all scored near perfectly on a simple needle-in-a-haystack test, and almost all lost a lot of accuracy as the context grew. All of them claimed 32K tokens or more, and only half kept satisfactory performance at 32K.
- **Literal matches hide the problem.** NoLiMa removed the word overlap between the question and the text that answers it. Of 13 models that claim to support at least 128K tokens, 11 fell below 50% of their short-context score at 32K. GPT-4o dropped from 99.3% to 69.7%.
- **Even simple tasks degrade.** Chroma's "Context Rot" report tested 18 LLMs and found that performance becomes less reliable as the input grows, even on simple tasks. A single distractor was enough to lower results.

Most of these studies tested models from 2023 to 2025. The consistent finding is that passing a needle-in-a-haystack test does not mean a model uses a long input well.

## Cost

LLM input is billed per token, so the cost of a query grows with the prompt. This example uses Anthropic's published price for Claude Sonnet 5.5 in October 2026: $2 per million input tokens. A cache read costs 0.1 times that price, and the full 1M-token window is billed at the standard rate. The table shows input cost only. Output tokens cost the same in both setups.

| Setup | Input tokens | Input cost per query |
|---|---|---|
| RAG, a few retrieved passages | 5,000 | $0.01 |
| Long context, whole corpus | 200,000 | $0.40 |
| Long context, cached prefix | 200,000 | $0.04 |

The cached row assumes a cache hit. Writing the 200,000-token prefix to the 5-minute cache costs 1.25 times the base price, $0.50, and each hit refreshes the entry. So caching narrows the gap from 40x to 4x when the same corpus is queried often. It helps much less when the content changes or when queries arrive less often than the cache lives.

The RAG row does not include the retrieval step itself, which adds a search query and an index to operate.

## Latency

Every input token has to be processed before the first output token appears, so a very long prompt starts answering later than a short one. Prompt caching helps. Anthropic reports that it can reduce the latency of long prompts by more than 2x.

## Where retrieval still wins

- **The data does not fit.** A 1 million token window holds about 2,500 pages, using Anthropic's ratio of 500 pages per 200,000 tokens. Enterprise knowledge bases are often much larger.
- **The data changes.** An index updates incrementally. A long prompt has to be rebuilt, and a cache has to be rewritten, whenever the content changes.
- **Different users may see different data.** With retrieval, you filter by tenant or permission before anything reaches the model. With a long prompt, everything in it is visible to the model for that request, so you have to assemble a prompt per user. See [multitenancy](/documentation/manage-data/multitenancy/) for how Qdrant separates tenants in one collection.
- **You need to show sources.** Retrieved passages come with identifiers that you can cite and check.

## No silver bullet

The LaRA benchmark reached a similar conclusion: the best choice between RAG and long context depends on the model's size and long-text ability, the context length, the task type, and the retrieved chunks. Neither approach wins everywhere.

That is why routing is a practical pattern. Self-Route, from the 2024 study by Li et al., lets the model decide for each query whether retrieval is enough or the long context is needed. It reduced computation cost while keeping performance comparable to long context. A May 2026 preprint, Pre-Route, proposes deciding before answering, from metadata such as document type and length.

Retrieval and long context also combine in a simpler way. Use retrieval to narrow a large corpus to a few dozen passages, and pass them in one prompt that the model reasons over. Compound systems of this kind are common. In February 2024, Databricks reported that 60% of LLM applications used some form of RAG and 30% used multi-step chains.

## How to choose

| Your situation | Start with |
|---|---|
| Corpus under about 200,000 tokens, stable, queried rarely | Long context |
| Same corpus queried often within minutes | Long context with caching. Compare its cost with RAG |
| Corpus larger than the window, or growing | RAG |
| Different access rules for different users | RAG with filters |
| Questions that span a whole document, such as summaries and comparisons | Long context, or retrieval of a wide set of passages |
| Narrow factual questions over a large corpus | RAG |

Build a small evaluation set from your real questions, and run both approaches on your data and your model. The [RAG evaluation guide](/blog/rag-evaluation-guide/) and the documentation on [retrieval quality](/documentation/search-evaluation/retrieval-relevance/) explain how.

## Where Qdrant fits

If you choose retrieval, Qdrant provides the search layer. It offers dense and sparse vectors, [hybrid search](/documentation/search-tuning/hybrid-search/), filters for tenant isolation and permissions, and [quantization](/documentation/manage-data/quantization/) to reduce memory. You can try it on a [free Qdrant Cloud cluster](https://cloud.qdrant.io/signup).

## Sources

- Liu et al., ["Lost in the Middle: How Language Models Use Long Contexts"](https://arxiv.org/abs/2307.03172), Transactions of the Association for Computational Linguistics, 2024.
- Hsieh et al., ["RULER: What's the Real Context Size of Your Long-Context Language Models?"](https://arxiv.org/abs/2404.06654), COLM 2024.
- Li et al., ["Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach"](https://arxiv.org/abs/2407.16833), EMNLP 2024, industry track.
- Modarressi et al., ["NoLiMa: Long-Context Evaluation Beyond Literal Matching"](https://arxiv.org/abs/2502.05167), ICML 2025.
- Chroma, ["Context Rot: How Increasing Input Tokens Impacts LLM Performance"](https://www.trychroma.com/research/context-rot), July 14, 2025.
- Li et al., ["LaRA: Benchmarking Retrieval-Augmented Generation and Long-Context LLMs"](https://arxiv.org/abs/2502.09977), 2025.
- Hamilton et al., ["The Token Tax of Epistemic Accuracy: Comparing RAG and Long-Context Architectures for Document-Grounded Generative AI Applications"](https://arxiv.org/abs/2606.20898), arXiv, June 18, 2026.
- Chen et al., ["Route Before Retrieve: Activating Latent Routing Abilities of LLMs for RAG vs. Long-Context Selection"](https://arxiv.org/abs/2605.10235), arXiv preprint, May 2026.
- Anthropic, ["Introducing Contextual Retrieval"](https://www.anthropic.com/news/contextual-retrieval), September 19, 2024.
- Anthropic, [pricing documentation](https://platform.claude.com/docs/en/about-claude/pricing), read in October 2026.
- Zaharia et al., ["The Shift from Models to Compound AI Systems"](https://bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/), Berkeley AI Research blog, February 18, 2024.
