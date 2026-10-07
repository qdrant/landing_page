---
draft: false
slug: jevjitsu
title: "Jevjitsu: Or, How We Tried Generalized Classifiers on Everything"
short_description: "Trying Jev on reranking, query understanding, near-duplicate removal, and semantic chunking"
description: "We applied the Jev generalized classifier to reranking, query understanding, near-duplicate removal, and semantic chunking."
date: 2026-10-07T00:00:00Z
author: Andrei Cristea & Chadha Sridi
featured: false
preview_image: /blog/jevjitsu/preview_image.jpg
social_preview_image: /blog/jevjitsu/preview_image.jpg
tags:
  - jev
  - classification
  - reranking
  - query-understanding
  - chunking
---

Classification is one of the oldest problems in machine learning. Unlike modern decoding transformers, most classification models were non-autoregressive by nature. Before Jev, the common approaches were training your own classifier, which needs labels, using a zero-shot classifier (compared in this [Hugging Face benchmark](https://huggingface.co/blog/aarabil/btzsc-benchmark)), or prompting an LLM with some hacky type safety on top. There were also [meta-ML methods](https://arxiv.org/pdf/2205.01500), but none of them reached the mainstream.

With the introduction of Jev, a decision model from TypeSafe served through OpenRouter, the taxonomy of classifiers has changed yet again:

| **Approach**                                             | **Training needed** | **New labels at runtime?** | **Output constrained to labels?**          | **Typical speed** |
| :--------------------------------------------------------:| :-------------------:| :--------------------------:| :------------------------------------------:|:-----------------:|
| **Train a task-specific classifier** (encoder or MLP)    | Yes                 | No                         | Yes                                        | Very fast         |
| **Use a zero-shot classifier** (NLI or label embeddings) | No                  | Yes                        | Yes, by choosing from the candidate labels | Fast              |
| **Prompt a generative LLM**                              | No                  | Yes                        | Not by default                             | Slow              |
| **Use Jev**                                              | No                  | Yes                        | Yes, as designed                           | Fast              |

There are two fundamental ideas that the Jev advancement brings to light:

1. **Jev is the next step in making models usable without task-specific training.** Pretrained transformers meant you no longer trained a model from scratch for each task, and LLMs let you describe what you want. Jev keeps "describe it, don't train it" while addressing what makes LLMs awkward for classification: slow responses, high costs, and answers outside your options.
2. **A conceptual shift in consumers of the "LLM Is All You Need" approach**. Recently, the default was to stretch an LLM over everything. Jev is part of a move toward concrete methods. Even if the underlying concept still uses the transformer architecture, the constraints and promise are way different for the end customer.

Since Jev can take on any classification task, we tried it on several. Everyone has tested it as a reranker by now, and so did we, but the more interesting part came after: how to rerank better, how reading the query before searching helps, and what happens if you make Jev chunk a document. Here is what we expected, what surprised us, and what we'd try next. The WANDS, Amazon-C4, and QASPER experiments are in the [many-jev-recipies](https://github.com/qdrant-labs/many-jev-recipies) repository if you want to run them yourself.

## Reranking

Hybrid search usually finds the useful results. The harder part is the order: the difference between the best answer at position seven and a weaker one at position one can be too subtle for the first step, so it needs a "smarter cousin", a reranker, to put the candidates in order. LLM judges are smart enough for that job but too slow and costly to run on every query. Jev fits naturally here: it returns numeric scores without generating text, so they sort directly, with nothing to parse.

We tried three ways to ask:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/rerank-methods-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/rerank-methods.svg" alt="Three ways to rerank with Jev. Jev Score asks &quot;How relevant is this doc?&quot; for each doc, judging every doc on its own, in one request. Jev Choice asks &quot;Which doc is most relevant?&quot; once for all docs, in one request. Both produce a ranking such as C, A, D, B. Jev Iterative asks that question once per ranking position, removing each winner, using 10 requests for a top 10.">
</picture>

At this point, testing Jev as a reranker on a few hundred queries is practically a rite of passage. Every search vendor runs it on 80, 100, 200, or 300 queries, posts a table, and moves on. So naturally, we did too: 100 [NFCorpus](https://huggingface.co/datasets/BeIR/nfcorpus) queries, the top 30 and top 50 candidates from Qdrant with BGE-small, and each method reordering the same candidates. The table shows each method's nDCG@10 lift over BGE-small alone:

| **Method** | **Requests per query** | **Lift, top 30** | **Lift, top 50** |
| :-- | :-: | :-: | :-: |
| Jev Score | 1 | +0.0665 | +0.0741 |
| Jev Choice | 1 | +0.0583 | +0.0673 |
| Jev Iterative | 10 | +0.0746 | +0.0789 |

We expected the most expensive method, Iterative, to win by a wide margin. It had the highest score, but only by a small margin: all three beat BGE-small at both depths, and the gaps between them are under 0.02. More effort doesn't always buy a better result, so the cheap options win: Score is our default, and Iterative isn't worth ten requests per query.

Jev is an API call, while a small local cross-encoder like MiniLM runs on your own CPU, so Jev pays off where a better first page is worth the extra call. On product search it was: on the WANDS benchmark from the next section, sorting the hybrid top 20 by Jev's relevance answer beat both local cross-encoders we tried, bge-reranker-base and MiniLM, reading the same results. The more useful lesson came after the benchmark: Jev's score is a probability of relevance, not just a sort key, so other steps can use it.

## Reducing Repetitive Answers

Imagine an e-commerce search for "iphone" that returns ten variants of the same iPhone 18. Sometimes that's what the shopper wants, but often they'd rather see a range of products on the first page.

We measured this on 240 held-out queries from the [WANDS](https://huggingface.co/datasets/napsternxg/wands) benchmark, scoring relevance (nDCG@10) and repetition: near-duplicate pairs, results whose embeddings are 0.95 similar or more, on the first page of 10.

| **Pipeline**                                       | **nDCG@10** | **Near-duplicate pairs per page** | **Product classes in the top 10** |
| :---------------------------------------------------| :-----------:| :---------------------------------:| :---------------------------------:|
| Hybrid search                                      | 0.683       | 1.27                              | 3.17                              |
| Qdrant MMR, diversity 0.5                          | 0.561       | 0.00                              | 4.74                              |
| Jev rerank                                         | 0.769       | 1.25                              | 2.41                              |
| Jev's score in our own MMR, diversity 0.7          | 0.719       | 0.22                              | 3.40                              |
| Qdrant MMR, diversity 0.5, then Jev rerank         | 0.723       | 0.04                              | 3.12                              |

Sorting by Jev's answer gave the most relevant page by far, and it did nothing for repetition: the near-duplicates stayed, and the page got narrower, from 3.17 distinct product classes to 2.41. That's not a flaw in Jev. Even a perfect ordering by the human labels narrows the page to 2.66 classes, because the most relevant products for a query tend to be the same kind of product.

Qdrant's built-in [Maximal Marginal Relevance (MMR)](/articles/vector-similarity-beyond-search/#diversity-search) goes the other way: at diversity 0.5, it removes the near-duplicates and gives the widest page, but costs 0.12 nDCG@10, because it measures relevance as vector similarity to the query.

The fix was to use the reranker's score indirectly, as the relevance signal for diversity: either swap MMR's relevance term for Jev's answer, or run Qdrant's MMR first and let Jev rerank its top 20. Both beat hybrid search on relevance and repetition at once, giving up part of the plain rerank's gain for a varied page. This part came together quickly, with one surprise: we expected pruning, dropping the results Jev flags as irrelevant or as near-duplicates of a higher one, to beat reranking. It didn't: the difference in relevance between the two was minimal. The full comparison is in the [pruning notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/prune/prune.ipynb).

## Query Understanding

Can we use the meaning of a query, not only its words, to improve search? That is the central question of query understanding. It turns a query into signals, here product categories, that decide how to search for it: a shopper typing "kitchen faucet replacement" wants plumbing parts, and search that knows it can push them up. We started from the main rule of [Doug Turnbull's experiments](https://softwaredoug.com/blog/2026/09/22/jev-query-understanding) with Jev: filter only when very sure, because a wrong filter hides the right product, and boost otherwise, because a wrong boost only reorders the page.

We expected this part to work out of the box. It didn't: our first version, where Jev chose each category name from candidates taken from the products, gave almost no gain in quality. The problem was the categories themselves. Jev can only assign categories, not create them, and the names it chose weren't general enough. Clustering the products first helped, but only by about half a point of nDCG@10. What fixed it was adding an LLM: a cheap one names each cluster of products, once, before indexing, and Jev validates the names. A name shouldn't be too generic but also not too narrow: Jev has to place enough of its group under it and few products from other groups. Sometimes an LLM is unavoidable, and the answer is to constrain it with Jev and keep its cost small. The exact checks are in the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/notebooks/jevqu_c4_llm_taxonomy.ipynb).

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/taxonomy-building-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/taxonomy-building.svg" alt="Building product categories in four steps: group similar products, an LLM names each group, Jev checks that the name fits the group, and the names that fit become the categories. For example, women's clothing is kept and Greeting Cards is dropped.">
</picture>

From here on, nothing is generated, only categorized:

- At indexing time, Jev tags every product with these categories, stored as payload: a Nintendo Switch case gets *device cases*, under *Electronics & Accessories*.
- At search time, Jev scores each product category against the query. At 0.9 or more, search filters to that category. From 0.5 to 0.9, it boosts matching products. Below that, it does nothing.

The filtering and boosting run in Qdrant: the category is a [payload filter](/documentation/search/filtering/), and the boost is a [score formula](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) on top of [hybrid search](/documentation/search/hybrid-queries/#hybrid-search).

We compared setups on 300 [Amazon-C4](https://huggingface.co/datasets/McAuley-Lab/Amazon-C4) searches, and that mix of filtering and boosting worked best:

{{< chart id="jevjitsu/routing" caption="Tiered filters at 0.9 and boosts from 0.5, with thresholds picked on development queries. Default uses the library defaults, which boost from 0.6. Every setup beat plain hybrid search on average; filtering on every guess is within noise." >}}

Building and tagging the categories is a one-off cost per collection. The cost that stays is time: the Jev request adds half a second to two seconds to every query, depending on how many categories it reads. Like [Netflix](https://pretalx.com/media/haystackeu26/submissions/7F3XA8/resources/From_Tries_to_gXhR9ny.pdf), we put a cheap model in front of the slow one: small classifiers trained on Jev's own product tags answer the queries they're sure about, with boosts only. That took 37% of queries off Jev, with slightly higher average nDCG@10 on our 300 test queries (section 6 of the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/notebooks/jevqu_c4_llm_taxonomy.ipynb)).

The Amazon-C4 queries are long and LLM-generated, which gives Jev plenty of context. Real search boxes see much shorter queries, so we tried a few of our own. They have no relevance labels, so read them as examples, not measurements:

| **Query**                        | **Jev filtered on**                               | **What happened**                                                                               |
| :---------------------------------| :--------------------------------------------------| :------------------------------------------------------------------------------------------------|
| "apple"                          | *Food & Beverage* (0.91, just past the threshold) | Hurt: the page became all food, and the MacBook, the apple tree, and the laptop decal were gone |
| "kitchen faucet replacement"     | *Plumbing Parts* (0.98)                           | Helped: more relevant products made it onto the page                                            |
| "running shoes that aren't nike" | *athletic footwear* (0.98)                        | Barely helped: the category was right, but "not Nike" isn't something a category can express    |

Filtering works when the category is the whole intent. Short queries are more ambiguous, and a filter hurts them most: MMR can't bring the lost products back, because the filter removes them first. The guard we would try first is to boost, never filter, on one- or two-word queries. Another idea we didn't try, but encourage you to, is giving Jev more context: "apple" sent together with the shop it was typed in, say `"shop": "electronics"`, can help Jev make a better call. Search still has no one-size-fits-all solution, so check your own queries and edge cases before you adopt even the most confident one.

## Semantic Chunking

Retrieval often brings back the right chunk with only half the answer in it, because the chunker cut the paragraph in two. Fixed-size chunkers cut wherever the token count runs out. Most semantic chunkers cut where the embeddings of neighboring sentences drift apart, so a paragraph that changes vocabulary mid-argument can get split, and two articles that share vocabulary can get merged.

What if Jev judged each gap between sentences instead? We send it a window of numbered sentences from the document, trimmed here to four from a [QASPER](https://huggingface.co/datasets/allenai/qasper) paper:

```json
{"sentences": [
  {"sentence": 1, "text": "It can be seen that the classes RY and DN contain the majority of the speeches."},
  {"sentence": 2, "text": "Language Model"},
  {"sentence": 3, "text": "We use a simple statistical language model based on n-grams."},
  {"sentence": 4, "text": "In particular, we use 6-grams."}
]}
```

For every gap, we ask one yes/no question, "Does sentence 2 start a new topic?", where yes means "Sentence 2 moves to a different subject from sentence 1: a new section, story, question or theme begins" and no means "Sentence 2 continues the subject of sentence 1". Jev answered 0.97 for sentence 2, a section heading, and 0.13 and 0.03 for the two sentences after it.

We cut where the answer passes a threshold, keeping each chunk between a minimum and maximum size. The cuts are a plain function of Jev's answers, so changing the chunk size needs no new requests.

We tested it on QASPER's 407 research papers and 1,297 questions whose evidence paragraphs were marked by researchers. Each chunker's chunks are embedded, 5 are retrieved from Qdrant per question, filtered to that question's paper, and we score how much of the evidence they hold and how little else: recall, precision, and IoU, counted in characters. Against four baselines (fixed-size, a recursive splitter at two sizes, and embedding-based semantic chunking) at the same mean chunk size, Jev improved every metric, with every 95% confidence interval excluding zero: on average 13.0% in IoU, 11.2% in precision, and 9.1% in recall. We expected a modest improvement, and we got it on the first try, with a question we never tuned: sometimes a task really can be done in one iteration. Here's where the gain comes from, on one question:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/chunking-recall-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/chunking-recall.svg" alt="For the question &quot;What language is this dataset in?&quot;, fixed-size chunks cut through the answer and split it across two chunks, while Jev cuts where the topic changes and keeps the whole answer in one chunk.">
</picture>

The trade-off is cost and simplicity: the other chunkers run locally for free, while Jev sends your text to an API, at about $0.27 per million document tokens. The smallest gain was against a recursive splitter that breaks on blank lines first, since QASPER's answers are whole paragraphs. Rewording the question may improve the chunks further. The implementation and the full comparison are in the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/chunker/chunker.ipynb).

## What We Would Try First

We see the effect of using Jev best in tasks like the chunker: it's an easy setup with zero overhead at query time. If you run product search, start with Jev's score inside MMR. If you run RAG, start with the chunker.

Query understanding, on the other hand, still has a lot of unexplored potential: product categories are only one of the signals a query carries, and the fixes for "apple" are still untested.

Another idea is to use rerankers in other contexts, or things that look like rerankers. Optimizing for diversity was one, with the goal of a system that is both diverse and accurate. Another perfect use case is the threshold that e-commerce search usually uses to show empty results when the similarity is below a certain X.

What feels too costly are methods like Iterative reranking: ten requests per query for a small gain.

The use cases can grow: you no longer need to train a model before you start, so prototyping is easy, and the main cost left is infrastructure.

## Summary

In the end, Jev shows that generalized classification can be useful far beyond reranking. It is not always the best solution: a specialized reranker or a fine-tuned model for a specific use case may still perform better. What has changed is that classification is becoming cheap, fast, and general enough to use as a building block throughout search and agentic systems.


The market seems to be moving in the same direction. Paid vendors are introducing their own approaches: OpenAI's [Decisions API](https://developers.openai.com/api/docs/guides/decisions), now in public beta, answers the same three kinds of questions we used here (yes/no, choice, and score). Open source is not staying behind either. In just the last several weeks, we have seen direct Jev reproductions ([OpenJev](https://huggingface.co/openjev/openjev), [Open-Jev](https://huggingface.co/AlexWortega/openjev)), lightweight classifiers ([Laya](https://huggingface.co/convaiinnovations/laya), [JevLite](https://huggingface.co/vagmi/jev-lite)), and alternative architectures ([CLM](https://github.com/Contrastive-LM/CLM), [Span-01](https://www.respan.ai/blog/introducing-span-1)).

The idea is simple: **where your pipeline needs a decision, let Jev make it, instead of generating it with an autoregressive model or guessing it with a similarity threshold.** That is where we think there is a lot left to explore.

To try it on your own queries, start with the [many-jev-recipies](https://github.com/qdrant-labs/many-jev-recipies) repository.