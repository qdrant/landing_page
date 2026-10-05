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

Classification is one of the most ancient problems in Machine Learning. Compared to modern decoding transformers, most of the classification models were non-autoregressive by nature. Before the recent introduction of Jev, you had one of the following ways to classify things: either create your own classifier or use an LLM with some hacky type safety on top. The first one needed labels and was limited in what you could classify, as well as brittle. The second, while being able to create any class, was still costly and slow. It also needed a custom hack on top to get a funny class of just random hallucination. There were also [meta-ML methods](https://arxiv.org/pdf/2205.01500), but all of them were away from the mainstream.

With the introduction of Jev, the taxonomy of the classifiers has changed yet again:

| **Approach** | **Training needed** | **New labels at runtime?** | **Output constrained to labels?** | **Typical speed** |
| :-: | :-: | :-: | :-: | :-: |
| **Train a task-specific classifier** (encoder or MLP) | Yes | No | Yes | Very fast |
| **Use a zero-shot classifier** (NLI or label embeddings) | No | Yes | Yes, by choosing from the candidate labels | Fast |
| **Prompt a generative LLM** | No | Yes | Not by default | Slow |
| **Use Jev** | No | Yes | Yes, as designed | Fast |

To find more about a pre-Jev classification approaches, we recommend checking this [Hugging Face](https://huggingface.co/blog/aarabil/btzsc-benchmark) page that compares recent zero-shot text classifiers.

There are two fundamental ideas that the Jev advancement brings to light:

1. **Jev is the next step in making models usable without task-specific training.** Pretrained transformers meant you no longer had to train a model from scratch for each task. With LLMs, you can simply describe what you want. Jev keeps that "describe it, don't train it" approach and addresses what makes LLMs awkward for classification: they are slow, costly, and free to answer outside your options. This signals to other developers and enthusiasts that there is a demand for solving classic tasks like classification in this new way, while bringing back the guarantees and speed of old-school methods. This is what keeps the competition high and the progress going.
2. **A conceptual shift in consumers of the "LLM Is All You Need" approach**. Recently, the default was to stretch LLM over everything. Jev is part of a move for concrete methods. Even if the underlying concept still uses transformer architecture, the constraints and promise are way different for the end customer.

Thus, since this is a model that you can apply to any classification task, we did. First we have tried to apply it to how everyone did - as a reranker, however, some other ideas worth checking.

You can access all of the experiments below are in the [many-jev-recipies](https://github.com/qdrant-labs/many-jev-recipies) repository, if you want to run them yourself. 

## Reranking

Using Jev as a reranker was one of the use cases that gained traction early on. The fit is natural once you look at what a reranker does. In vector search, rerankers are a second, more expensive, and more precise step that reorders a pool of candidates retrieved by a faster first step. LLM judges make strong rerankers, but they're usually too slow and costly to run on every query.

Jev can be a better fit for this step: you pass your query and the retrieved candidates along with a typed question that defines the possible answers, and Jev returns a probability for each answer without generating text. Those probabilities sort directly, with nothing to parse and far fewer ties.

Here are three ways to rerank with Jev:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/rerank-methods-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/rerank-methods.svg" alt="Three ways to rerank with Jev. Jev Score grades each candidate on a scale of relevance levels with one request. Jev Choice compares all candidates at once and returns a probability for each. Jev Iterative picks the best remaining candidate each round, with one request per ranking position.">
</picture>

- **Jev Score:** uses the Score question type. Jev rates each candidate against an ordered scale of relevance levels: it returns a probability for each level, and the score is the probability-weighted average of the level positions. We rerank the candidates by their scores.

```python
levels = [                        # ordered from least to most relevant
    "Not relevant: does not help answer the query",
    "Somewhat relevant: related, but only partially addresses the query",
    "Highly relevant: directly answers or substantially addresses the query",
]

questions = {}
for each candidate i:
    questions["candidate_i"] = Score(
        instructions = "How relevant is this document to the query?"
                       + query + candidate title and text,
        criteria = levels,
    )

response = jev(questions)         # one request for all candidates
for each candidate i:
    candidate.score = response["candidate_i"].score    # fractional, 0 to 2
sort candidates by score, highest first
```

- **Jev Choice:** uses the Choice question type. We pass all candidates as options in a single request and rank them by Jev's probability that each one is the most relevant.

```python
options = {"candidate_i": candidate title and text, for each candidate i}

response = jev(
    state = query,
    question = Choice("Which document is most relevant to the query?", options),
)                                 # one request for the whole pool

for each candidate i:
    candidate.score = response.probabilities["candidate_i"]
sort candidates by score, highest first
```

- **Jev Iterative:** uses the Choice question type repeatedly. Each round, Jev picks the best remaining candidate, which takes the next position and leaves the pool, until the top 10 positions are filled.

```python
ranking = []
remaining = candidates

repeat 10 times, or until remaining is empty:
    options = {"candidate_i": title and text, for each remaining candidate i}
    response = jev(
        state = query,
        question = Choice("Which document is most relevant to the query?", options),
    )
    winner = remaining[response.choice]
    ranking.append(winner)
    remove winner from remaining

return ranking                    # top 10 only
```

At this point, testing Jev as a reranker on a few hundred queries is practically a rite of passage. Every search vendor runs it on 80, 100, 200, or 300 queries, posts a table, and moves on. So naturally, we did too: we tested the three methods on 100 queries from [NFCorpus](https://huggingface.co/datasets/BeIR/nfcorpus). For each query, BGE-small retrieved the top 30 and top 50 candidates from Qdrant, and each method reordered that same candidate set. We measured ranking quality with nDCG@10, which rewards placing relevant documents near the top of the list, and report each method's lift over BGE-small alone. With 30 candidates, Jev Score lifted nDCG@10 by +0.0665, Jev Choice by +0.0583, and Jev Iterative by +0.0746. With 50 candidates, the lifts were +0.0741, +0.0673, and +0.0789, respectively.

All three methods improved on BGE-small at both depths. The gaps between them are small, under 0.02 nDCG@10, and 100 queries aren't enough to say which one is best. Retrieving 50 candidates instead of 30 gave a slightly larger lift for all three. Iterative is the expensive one: it sends one request per ranking position, 10 per query instead of one, and is probably not worth its latency.

Where to Go From Here:

- **Score is a sensible default:** Tune the criteria to your use case.
- **Iterative Choice can reduce redundancy:** With the documents picked so far included in the state, Jev chooses the candidate that best answers the query without repeating them. Qdrant's [built-in Maximal Marginal Relevance(MMR)](https://qdrant.tech/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) does this with vector distance.
- **Some judgments can move to index time:** Questions like "Is this page a tutorial?" or "Is this about a deprecated feature?" don't need the query. Answer them once during ingestion, and use them as payload filters or in a [score boosting formula](https://qdrant.tech/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query).
- **Let confidence decide how much Jev counts:** Every Score answer comes with a confidence value. When confidence is high, use Jev's order. When it's low, blend Jev's score with the original vector score.

## Query Understanding

**By query understanding, we mean extracting signals (here, [taxonomical classes](https://en.wikipedia.org/wiki/Class_\(taxonomy\))) from a query and using them to decide how to handle it.**

For example, *"funny movies"* and *"a recent family comedy under two hours"* express a similar intent, but may require different processing. [Netflix](https://pretalx.com/media/haystackeu26/submissions/7F3XA8/resources/From_Tries_to_gXhR9ny.pdf) uses query understanding to route searches: simple queries take a fast path, more complex ones go through BERT, and natural-language queries can be routed to an LLM.

After reading [Doug's Turnbull article](https://softwaredoug.com/blog/2026/09/22/jev-query-understanding) on query understanding, we got inspired to make a query understanding with Jev as a use case. His results gave some initial insights for the implementation:

- **Filter only when very sure; otherwise, boost.** A filter removes results, so a wrong one hides the right product. A boost only moves matching products up, so a wrong one costs less.
- **Get the broader category right first**. A wrong top-level category can be a catastrophic mistake.
- **Let the LLM propose, then check.** An LLM generates candidates; Jev just confirms which ones fit the data.

We add query understanding by building a [taxonomy](https://en.wikipedia.org/wiki/Taxonomy) from the collection itself. This happens once per collection, before indexing or doing any search. We sample 5000 items and group similar ones together (by clustering their embeddings). A cheap LLM names each group from a few example items. Then Jev checks each name against the group's items. If the name does not hold up, it's dropped.

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/taxonomy-building-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/taxonomy-building.svg" alt="Building a taxonomy from a collection in four steps. Similar products are grouped, an LLM suggests a name, Jev checks whether the name fits the products, and what fits becomes the taxonomy. The name &quot;women's clothing&quot; fits 14 of 15 products and is kept. The name &quot;Greeting Cards&quot; fits 4 of 15 and is dropped.">
</picture>

At indexing time: Jev tags every product with the categories from taxonomy and we store them as payload fields. *A "Nintendo Switch case"*, for example, is now tagged *Electronics & Accessories* under *device cases* superclass.

At search time, Jev reads the query and scores each category. Of the routing configurations we compared (compared in the chart that follows), this one worked best: below 60% we ignore it, between 60% and 90% we boost matching products, and above 90% we filter.

```python
results = query_points(client, "products", "a lightweight case that snaps onto my Switch OLED", jev)

Electronics & Accessories   0.97   -> filter
device cases                0.97   -> filter
Bags & Luggage              0.65   -> boost
Toys & Games                0.53   -> ignore
```

We have tried different configurations of routing, applied to the [Amazon-C4 dataset](https://huggingface.co/datasets/McAuley-Lab/Amazon-C4), and here are the results:

{{< chart id="jevtaxonomy/routing" caption="On 300 real searches, the Jev taxonomy improves nDCG@10 (x100) over default search in every routing configuration. Filtering when Jev is sure and boosting otherwise works best: 29.3 to 33.1, +13%. Default settings reach 32.4 (+12%), boosting only likely categories 32.0 against a 28.9 baseline (+11%), and filtering on every guess 30.1 (+3%)." >}}

We get some solid improvement for the NDCG; however, not without trade-offs:

|                                                                     | **Standard hybrid search**       | **With Jev-based query understanding**                                                                | **Trade-offs and key notes**                                                                      |
| :-------------------------------------------------------------------:| :--------------------------------:| :-----------------------------------------------------------------------------------------------------:| :-------------------------------------------------------------------------------------------------:|
| **Initial taxonomy setup** (once per collection, sample 5000 items) | -                                | 16 min (\~\\$0.70 for Jev, <\\$0.02 for LLM)                                                  | One-off step. Reads a subset of 5k points, making compute costs independent of total corpus size. |
| **Indexing 1M points** (extrapolated)                               | \~3 hours (local embeddings) | +\~32 hours, +\~\\$103 (\~\\$100 of labeling, labeling is \~\\$0.0001 per item) | Linear cost scaling based on volume.                                                              |
| **Added query latency**                                             | -                                | +0.5 s (31 classes) to +1.9 s (70 classes)                                                            | Introduces waiting time for Jev resolution before vector filtering.                               |

Some of these trade-offs, like latency (section 6 in the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/notebooks/jevqu_c4_llm_taxonomy.ipynb)), can be improved; however, that is outside of this blog post. What is important to take from this experiment is that something like this before required at least 3 specialized classifiers; now we can just enjoy the spoils of Jev's decision-making to construct a better search.

## Removing near-duplicates from results

Another exciting idea is to improve the search results by reducing the uniformity of responses.

Imagine in an e-commerce setting, if someone types "iphone" and gets ten variants of the same "iphone 18". That might be intended behavior; however, often customers want search results to be diverse and rich.

As discussed Qdrant MMR supports natively as well as [other dissimilarity methods](https://qdrant.tech/articles/vector-similarity-beyond-search/). But native MMR can lead to a decrease in retrieval quality, like in our quick experiment on the [Wands dataset](https://huggingface.co/datasets/napsternxg/wands):

| **Pipeline** | **Hybrid search** | **MMR, diversity 0** | **MMR, diversity 0.25** | **MMR, diversity 0.5** | **MMR, diversity 0.75** |
| :------------:| :-----------------:| :--------------------:| :-----------------------:| :----------------------:| :-----------------------:|
| **nDCG@10**  | 0.6831            | 0.6349               | 0.6179                  | 0.5606                 | 0.5158                  |

*For more details, check our notebook on [pruning](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/prune/prune.ipynb)*.

We tried Jev in two roles, reranker and pruner (applied on top of MMR). As a reranker, Jev scores how likely each result is to be relevant to the query, and we sort the list by that score. As a pruner, Jev also flags results that repeat a higher-ranked one, and we drop those plus any result it isn't confident is relevant. MMR alone removes duplicates but lowers nDCG@10. Jev wins that back with both pruning and reranking, reaching similar performance.

*Individual example from the dataset*

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/near-duplicates-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/near-duplicates.svg" alt="For the query &quot;sugar canister&quot;, hybrid search returns five results of one product type with nDCG@5 of 0.56. Jev prune returns two product types with nDCG@5 of 0.63. Jev rerank returns three product types with nDCG@5 of 0.79.">
</picture>

Thus, cutting and reranking are both doing better than the baseline hybrid and also improve the uniqueness of the results.

## Semantic Chunker

Most semantic chunkers cut where the embeddings of neighbouring sentences drift apart. A paragraph that changes vocabulary mid-argument gets split, and two articles that share vocabulary get merged.

What if we use Jev instead to read a window of numbered sentences and judge each gap, asking if **the next sentence starts a new topic?** The pseudo code for it looks the following:

```python
sentences = split(document)                    # by punctuation and newlines

for each window of 40 sentences (step 20):
    ask Jev, for every gap in the window:
      "Does sentence k+1 start a new topic?"   # one request, a probability per gap

cut at gaps where P(new topic) >= threshold,
    keeping each chunk between min_size and max_size tokens

# threshold, min_size and max_size reuse the same answers: resize without new calls
```

For the experiment, we will use the Qasper dataset. A chunker is scored by embedding its chunks, retrieving 5 per question, and measuring the following:

- **recall**: share of reference tokens that appear in the retrieved chunks;
- **precision**: share of retrieved tokens that belong to a reference;
- **IoU**: overlap divided by the union of retrieved and reference tokens. It rewards chunks that hold the answer and little else.

Overall if we compare Jev to default chunkers based on these metrics, we can see consistent improvement for each chunking size for each strategy:

| **Metric** | **IoU** | **Precision** | **Recall** |
| :-: | :-: | :-: | :-: |
| **Avg. improvement over other baselines** | **+13.0%** | **+11.2%** | **+9.1%** |

To see where the gain comes from, here's one question chunked both ways, with fixed-size chunks and with Jev:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/chunking-recall-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/chunking-recall.svg" alt="For the question &quot;What language is this dataset in?&quot;, fixed-size chunks split the answer across chunk 26 and chunk 27, each 200 tokens. Jev chunks keep the answer in one 420-token chunk, chunk 25.">
</picture>

This shows that this approach targets mostly recall, and has more effective chunks with better answers sitting in one place. Let's look at another example:

<picture>
  <source media="(min-width: 700px)" srcset="/blog/jevjitsu/chunking-precision-wide.svg">
  <img style="max-width:100%;height:auto" src="/blog/jevjitsu/chunking-precision.svg" alt="For the question &quot;How long is the dataset?&quot;, fixed-size chunks split the answer across chunk 3 and chunk 4, each 200 tokens, cutting the answer at the last word. Jev keeps the answer in one 161-token chunk, chunk 5.">
</picture>

Here Jev improves precision, since both chunks retrieve the whole answer, but Jev is more effective since it needs fewer tokens to retrieve the answer.

Jev answers one question, whether the next sentence starts a new topic, and that improves both metrics: answers stay in one chunk, and retrieved chunks carry less unrelated text. With the question untuned and only the cutoff set to match each baseline's chunk size, Jev beats fixed-size, recursive, and semantic chunking on all three metrics. The trade-off is cost and simplicity. Fixed-size, recursive, and embedding-based chunkers run locally for free, while Jev sends your text to an API and costs about \\$0.27 per million tokens. In return, you get measurably better chunks from a question we never tuned, and rewording that question may improve them further. The full comparison is in the [notebook](https://github.com/qdrant-labs/many-jev-recipies/blob/main/recipes/chunker/chunker.ipynb).

## Summary

In the end, Jev shows that generalized classification can be useful far beyond reranking. It is not a one-size-fits-all solution: a specialized reranker or a fine-tuned model for a specific use case may still perform better. What has changed is that classification is becoming cheap, fast, and general enough to use as a building block throughout search and agentic systems.

The market seems to be moving in the same direction. Paid vendors are introducing their own approaches, like [Decisions API](https://huggingface.co/blog/sora-2/what-is-openai-decisions-api-a-practical-guide) from OpenAI, while open source is not staying behind. In just the last several weeks, we have seen direct Jev reproductions ([OpenJev](https://huggingface.co/openjev/openjev), [Open-Jev](https://huggingface.co/AlexWortega/openjev)), lightweight classifiers ([Laya](https://huggingface.co/convaiinnovations/laya), [JevLite](https://huggingface.co/vagmi/jev-lite)), and alternative architectures ([CLM](https://github.com/Contrastive-LM/CLM), [Span-01](https://www.respan.ai/blog/introducing-span-1)).

The interesting question, then, is not whether Jev should replace everything. It is: **where in your pipeline are you approximating a decision with similarity, heuristics, or generation when you could simply make the decision?** That is where we think there is a lot left to explore.
