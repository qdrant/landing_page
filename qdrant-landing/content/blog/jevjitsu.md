---
draft: false
title: "Jevjitsu: Or, How We Tried Generalized Classifiers on Everything"
short_description: "Trying Jev on reranking, query understanding, near-duplicate removal, and semantic chunking"
description: "We applied the Jev generalized classifier to reranking, query understanding, near-duplicate removal, and semantic chunking."
date: 2026-10-05T00:00:00Z
author: Andrei Cristea & Chadha Sridi
featured: false
preview_image: /blog/jevjitsu/preview_image.png
social_image: /blog/jevjitsu/preview_image.png
tags:
  - jev
  - classification
  - reranking
  - query-understanding
  - chunking
---

Classification is one of the oldest problems in machine learning. Unlike modern decoding transformers, most classification models were non-autoregressive by nature. Before Jev, the common approaches were training your own classifier, which needs labels, using a zero-shot classifier (compared in this [Hugging Face benchmark](https://huggingface.co/blog/aarabil/btzsc-benchmark)), or prompting an LLM with some hacky type safety on top. There were also [meta-ML methods](https://arxiv.org/pdf/2205.01500), but none of them reached the mainstream.

With the introduction of Jev, the taxonomy of classifiers has changed yet again:

| **Approach**                                             | **Training needed** | **New labels at runtime?** | **Output constrained to labels?**          | **Typical speed** |
| :--------------------------------------------------------:| :-------------------:| :--------------------------:| :------------------------------------------:|:-----------------:|
| **Train a task-specific classifier** (encoder or MLP)    | Yes                 | No                         | Yes                                        | Very fast         |
| **Use a zero-shot classifier** (NLI or label embeddings) | No                  | Yes                        | Yes, by choosing from the candidate labels | Fast              |
| **Prompt a generative LLM**                              | No                  | Yes                        | Not by default                             | Slow              |
| **Use Jev**                                              | No                  | Yes                        | Yes, as designed                           | Fast              |

There are two fundamental ideas that the Jev advancement brings to light:

1. **Jev is the next step in making models usable without task-specific training.** Pretrained transformers meant you no longer trained a model from scratch for each task, and LLMs let you simply describe what you want. Jev keeps "describe it, don't train it" and addresses what makes LLMs awkward for classification: they are slow, costly, and free to answer outside your options. That signals demand for solving classic tasks this way, which is what keeps the competition high and the progress going.
2. **A conceptual shift in consumers of the "LLM Is All You Need" approach**. Recently, the default was to stretch an LLM over everything. Jev is part of a move toward concrete methods. Even if the underlying concept still uses the transformer architecture, the constraints and promise are way different for the end customer.

Since Jev can take on any classification task, we tried it on several. Like everyone, we started with reranking, but the more interesting results came after it:

- Reranking makes the first page more relevant but narrower, and it does nothing about near-duplicates. Running Qdrant's MMR first and reranking its results with Jev, or using Jev's score as MMR's relevance term, gave us pages that beat plain hybrid search on both relevance and repetition.
- Query understanding can start from the collection alone, with no labels or query logs: an LLM proposes a taxonomy, Jev checks it, and search filters or boosts on it. A filter only helps when Jev is sure, and short queries are where filters go wrong: for "apple", a 0.91 score turned the whole page into food.
- The labels Jev writes at indexing time are free training data. A small classifier trained on them takes over a third of the queries off Jev with no loss in quality.
- One untuned question, "Does the next sentence start a new topic?", makes a chunker that beats fixed-size, recursive, and embedding-based chunking.

All of the experiments are in the [many-jev-recipies](https://github.com/qdrant-labs/many-jev-recipies) repository if you want to run them yourself.

## Reranking

Hybrid search usually finds the useful results. The harder part is the order. Sometimes the difference between the best answer at position seven and a weaker one at position one is too subtle for the first step to catch, so it needs a "smarter cousin" to rearrange what it brought back.

That is what a reranker does: it takes the candidates from the fast first step and puts them in order, more slowly but more carefully. LLM judges are smart enough for that job but too slow and costly to run on every query.

Jev fits naturally here: it takes the query, the candidates, and a typed question, and returns a probability for each answer without generating text, so the scores sort directly, with nothing to parse and far fewer ties.

We tried three ways to ask:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/rerank-methods-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/rerank-methods.svg" alt="Three ways to rerank with Jev. Jev Score asks &quot;How relevant is this doc?&quot; for each doc, judging every doc on its own, in one request. Jev Choice asks &quot;Which doc is most relevant?&quot; once for all docs, in one request. Both produce a ranking such as C, A, D, B. Jev Iterative asks that question once per ranking position, removing each winner, using 10 requests for a top 10.">
</picture>

At this point, testing Jev as a reranker on a few hundred queries is practically a rite of passage. Every search vendor runs it on 80, 100, 200, or 300 queries, posts a table, and moves on. So naturally, we did too. We took 100 queries from [NFCorpus](https://huggingface.co/datasets/BeIR/nfcorpus), retrieved the top 30 and top 50 candidates from Qdrant with BGE-small, and let each method reorder the same candidates. The table shows each method's nDCG@10 lift over BGE-small alone:

| **Method** | **Requests per query** | **Lift, top 30** | **Lift, top 50** |
| :-- | :-: | :-: | :-: |
| Jev Score | 1 | +0.0665 | +0.0741 |
| Jev Choice | 1 | +0.0583 | +0.0673 |
| Jev Iterative | 10 | +0.0746 | +0.0789 |

All three methods beat BGE-small at both depths, and reading 50 candidates instead of 30 helped all three a little. The gaps between the methods are under 0.02, which 100 queries can't separate, so the cheap options win: Score is our default, and Iterative isn't worth ten requests per query.

Before you swap out your cross-encoder, consider the trade-off: Jev is an API call, while a small local cross-encoder like MiniLM runs on your own CPU. Jev pays off where a better first page is worth the extra call, or where the judgment can move off the query path entirely.

The more useful lesson came after the benchmark. A reranker's score usually ends up as a sort key and nothing else, but Jev's score is a probability of relevance, so it can feed other steps. We also combined it with MMR, which fixed a side effect of reranking itself.

## Reducing Repetitive Answers

Imagine an e-commerce search for "iphone" that returns ten variants of the same iPhone 18. Sometimes that's what the shopper wants, but often they'd rather see a range of products on the first page.

We measured this on [WANDS](https://huggingface.co/datasets/napsternxg/wands), Wayfair's product search benchmark: 42,994 products and 480 queries with graded labels, half of them for tuning and 240 held out for the results here. We score every pipeline on relevance (nDCG@10) and on repetition: the number of near-duplicate pairs (embedding cosine similarity of 0.95 or more) on the first page of 10.

| **Pipeline**                                       | **nDCG@10** | **Near-duplicate pairs per page** | **Product classes in the top 10** |
| :---------------------------------------------------| :-----------:| :---------------------------------:| :---------------------------------:|
| Hybrid search                                      | 0.683       | 1.27                              | 3.17                              |
| Qdrant MMR, diversity 0.5                          | 0.561       | 0.00                              | 4.74                              |
| Jev rerank                                         | 0.769       | 1.25                              | 2.41                              |
| Jev's score as MMR's relevance term, diversity 0.7 | 0.719       | 0.22                              | 3.40                              |
| Qdrant MMR, diversity 0.5, then Jev rerank         | 0.723       | 0.04                              | 3.12                              |

Sorting by Jev's answer gave the most relevant page by far, and it did nothing for repetition: the near-duplicates stayed, and the page got narrower, from 3.17 distinct product classes to 2.41. That's not a flaw in Jev. Even a perfect ordering by the human labels narrows the page to 2.66 classes, because the most relevant products for a query tend to be the same kind of product.

Qdrant's built-in [Maximal Marginal Relevance (MMR)](https://qdrant.tech/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) goes the other way. At diversity 0.5, it removes the near-duplicates but costs 0.12 nDCG@10. MMR measures relevance as vector similarity to the query, and on these candidates that alone loses relevance, even at diversity 0.

The fix was to use the reranker's score indirectly, as the relevance signal for diversity. One way keeps MMR but swaps its relevance term for Jev's relevance answer, while vector similarity still measures redundancy. The other runs Qdrant's MMR first and lets Jev rerank its top 20. Both beat hybrid search on relevance and on repetition at the same time, giving up part of the plain rerank's gain in exchange for a varied page. Jev inside MMR spreads the page over the most product classes, and MMR followed by a Jev rerank all but removes the near-duplicates, partly because Qdrant's MMR reads the hybrid top 50 while Jev's MMR reads only the top 20.

Part of every Jev gain is coverage: WANDS scores unlabeled results as irrelevant, and Jev's pages hold more labeled results (86.5% of the top 10, against 81.3% for hybrid search). The full comparison is in the [pruning notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/prune/prune.ipynb).

## Query Understanding

Can we use the meaning of what was sent in the query to improve our search? That is the central point of query understanding discipline. It turns a query into signals, here product categories, that decide how to search for it. What we did next is to create an end-to-end query understanding of product categories. 

We started with the three rules from [Doug Turnbull's experiments](https://softwaredoug.com/blog/2026/09/22/jev-query-understanding) with Jev:

- Filter only when very sure, and boost otherwise. A wrong filter hides the right product, while a wrong boost only reorders the page.
- Get the top-level category right first.
- Let an LLM propose categories, and let Jev check them.

Jev can only assign the categories not create them. Thus, we first build a them from the collection itself, once, before indexing. We do it with cheap LLM over clustered products and validate those with Jev. A name shouldnt be too generic but also not extra concrete: if at least half of clustered members are placed under category by Jev we are good to go.

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/taxonomy-building-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/taxonomy-building.svg" alt="Building a taxonomy in four steps: group similar products, an LLM names each group, Jev checks that the name fits the group, and the names that fit form the taxonomy. For example, women's clothing is kept and Greeting Cards is dropped.">
</picture>

Next no more generations, only categorization:

- At indexing time, Jev tags every product with these categories, stored as payload: a Nintendo Switch case gets *device cases*, under *Electronics & Accessories*. 
- At search time, Jev scores each product category against the query. At 0.9 or more, search filters to that category. From 0.5 to 0.9, it boosts matching products. Below that, it does nothing. 

We compared on 300 [Amazon-C4](https://huggingface.co/datasets/McAuley-Lab/Amazon-C4) searches, and that mix of filtering and boosting worked best:

{{< chart id="jevjitsu/routing" caption="Every routing setup scored above default search on average. Filtering only when Jev is sure and boosting otherwise scored highest; filtering on every guess is within noise." >}}

The gain has costs:

| | **Standard hybrid search** | **With Jev-based query understanding** |
| :-- | :-: | :-: |
| **Taxonomy setup**, once per collection on a 5,000-item sample, so its cost doesn't grow with the collection | - | 16 min (\~\\$0.70 for Jev, <\\$0.02 for LLM) |
| **Indexing 1M points** (extrapolated, linear in volume) | \~3 hours (local embeddings) | +\~32 hours, +\~\\$103 (labeling is \~\\$0.0001 per item) |
| **Added query latency** | - | +0.5 s (31 classes) to +1.9 s (70 classes) |

Building and tagging the categories is a one-off cost per collection. The cost that stays is time, because Jev adds a request to every query. Like [Netflix](https://pretalx.com/media/haystackeu26/submissions/7F3XA8/resources/From_Tries_to_gXhR9ny.pdf), we put a cheap model in front of the slow one: small classifiers trained on Jev's own product tags read the query's embedding, and when their top category scores 0.95 or more, the query skips Jev and gets boosts only. That took 37% of queries off Jev with no loss in quality and cut the estimated average wait from 1.9 to 1.2 seconds (details in section 6 of the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/notebooks/jevqu_c4_llm_taxonomy.ipynb))

The Amazon-C4 queries are long and LLM-generated, which gives Jev plenty of context. Real search boxes see much shorter queries, so we tried a few of our own. They have no relevance labels, so read them as examples, not measurements:

| **Query**                        | **Jev filtered on**                               | **What happened**                                                                               |
| :---------------------------------| :--------------------------------------------------| :------------------------------------------------------------------------------------------------|
| "apple"                          | *Food & Beverage* (0.91, just past the threshold) | Hurt: the page became all food, and the MacBook, the apple tree, and the laptop decal were gone |
| "kitchen faucet replacement"     | *Plumbing Parts* (0.98)                           | Helped: more relevant products made it onto the page                                            |
| "running shoes that aren't nike" | *athletic footwear* (0.98)                        | Barely helped: the category was right, but "not Nike" isn't something a category can express    |

Filtering works when the category is the whole intent. Short queries are more ambiguous, and a filter hurts them most. MMR can't bring the lost products back, because the filter removes them before MMR runs, so the guard we'd try first is to boost, never filter, on one- or two-word queries. A deeper taxonomy would catch more, but query understanding is far from solved. Another idea we did not try but encourage you is to try enriching the context for the Jev. Ambiguous "apple" might bring  *Food & Beverage* category, but "apple[electonics shop]" might make better Jev make better judgements. Search still has no one-size-fits-all solution, so check your own queries and edge cases before you adopt even the most confident one.

## Semantic Chunking

Most semantic chunkers cut where the embeddings of neighboring sentences drift apart. A paragraph that changes vocabulary mid-argument can get split, and two articles that share vocabulary can get merged.

What if Jev reads a window of numbered sentences instead and judges each gap, asking whether **the next sentence starts a new topic?** In pseudocode:

```python
sentences = split(document)                    # by punctuation and newlines

for each window of 40 sentences (step 20):
    ask Jev, for every gap in the window:
      "Does sentence k+1 start a new topic?"   # one request, a probability per gap

cut at gaps where P(new topic) >= threshold,
    keeping each chunk between min_size and max_size tokens

# threshold, min_size and max_size reuse the same answers: resize without new calls
```

We tested it on [QASPER](https://huggingface.co/datasets/allenai/qasper): 407 research papers and 1,297 questions whose evidence paragraphs were marked by researchers. Each chunker's chunks are embedded with bge-small, without overlap, and 5 are retrieved per question from within that question's paper. Overlap is counted in characters: recall is the share of the evidence retrieved, precision is the share of retrieved text that is evidence, and IoU is their overlap divided by their union, which rewards chunks that hold the evidence and little else.

We compared Jev against four baselines (fixed-size, two recursive splitters, and embedding-based semantic chunking), with Jev's cutoff set to match each one's mean chunk size. Jev improved every metric against every baseline, and every 95% confidence interval excludes zero. Averaged across the four baselines, the relative gains were 13.0% in IoU, 11.2% in precision, and 9.1% in recall.

To see where the gain comes from, here's one question chunked both ways, with fixed-size chunks and with Jev:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/chunking-recall-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/chunking-recall.svg" alt="For the question &quot;What language is this dataset in?&quot;, fixed-size chunks cut through the answer and split it across two chunks, while Jev cuts where the topic changes and keeps the whole answer in one chunk.">
</picture>

The precision gain follows from the same effect: the retrieved text per question stays about the same length as the baseline's, so when more of the answer lands in the retrieved chunks, less unrelated text does.

The trade-off is cost and simplicity. Fixed-size, recursive, and embedding-based chunkers run locally for free, while Jev sends your text to an API and costs about \\$0.27 per million tokens. The smallest gain was against a recursive splitter that breaks on blank lines first: QASPER's answers are whole paragraphs, so that splitter lines up with them for free. We never tuned the question and only set the cutoff, so rewording it may improve the chunks further. The full comparison is in the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/chunker/chunker.ipynb).

## Summary

In the end, Jev shows that generalized classification can be useful far beyond reranking. It is not a one-size-fits-all solution: a specialized reranker or a fine-tuned model for a specific use case may still perform better. What has changed is that classification is becoming cheap, fast, and general enough to use as a building block throughout search and agentic systems.

The market seems to be moving in the same direction. Paid vendors are introducing their own approaches, like [Decisions API](https://huggingface.co/blog/sora-2/what-is-openai-decisions-api-a-practical-guide) from OpenAI, while open source is not staying behind. In just the last several weeks, we have seen direct Jev reproductions ([OpenJev](https://huggingface.co/openjev/openjev), [Open-Jev](https://huggingface.co/AlexWortega/openjev)), lightweight classifiers ([Laya](https://huggingface.co/convaiinnovations/laya), [JevLite](https://huggingface.co/vagmi/jev-lite)), and alternative architectures ([CLM](https://github.com/Contrastive-LM/CLM), [Span-01](https://www.respan.ai/blog/introducing-span-1)).

The interesting question, then, is not whether Jev should replace everything. It is: **where in your pipeline are you approximating a decision with similarity, heuristics, or generation when you could simply make the decision?** That is where we think there is a lot left to explore.
