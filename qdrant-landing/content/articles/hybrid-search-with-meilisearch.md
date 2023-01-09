---
title: Hybrid keyword and vector based search with Meilisearch
short_description: Keyword and vector search may coexist. Here is how to take best from both worlds!
description: Qdrant and Meilisearch might be used together to bring both vector and keyword based search experience.
preview_dir: /articles_data/hybrid-search-with-meilisearch/preview
social_preview_image: /articles_data/hybrid-search-with-meilisearch/social_preview.png
small_preview_image: /articles_data/hybrid-search-with-meilisearch/icon.svg
weight: 5
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2022-12-21T17:25:00.000Z
---

If you're still sceptical about all the buzz around vector search, there is a chance to combine it with 
something you got used to a keyword-based search. So you can enjoy the advantages of both. Still, it might 
be unclear how to do it right. Here we benchmark different options!

## The good old world of keyword-based search

The introduction of vector search solved many problems that keyword-based search suffered from. Before 
introducing it, we had to use different heuristics to make the keyword search queryproof. Otherwise, it 
wouldn't support synonyms, typos, and different forms of the same word our users could provide. In fact, 
looking for relevant content without prior exposure to the underlying data is challenging, if we focus on 
words only.

## Vector search novelties

The vector search ability to capture the semantic meaning of the queries and documents made the search 
process easier. The growth of tools like Qdrant made that technology available to everyone. Yet, switching 
from inverted indexes to vectors significantly changes the search experience. It seems like, in some cases, 
we all want to have the advantages of both approaches. Keyword-based search is excellent for exact phrase 
matching. It also works perfectly to boost the entries containing a specific text. But it may not capture 
the relevant content if we express the query differently than expected. Qdrant itself introduced the possibility 
of performing full-text filtering. Yet, filtering is not ranking. We can include or exclude specific phrases, 
but that won't impact the order of the results.

# A hybrid: semantic and keyword-based search

If we want to combine both worlds, we need a separate tool designed to make that efficient and a way to connect 
it with a vector database. [Meilisearch](https://www.meilisearch.com/) is one of the options worth considering. 
It is written in Rust, as Qdrant, which makes it really fast.

Designing a proper search pipeline shouldn't be biased by some personal preferences. That's why it's worth 
benchmarking different options and choosing the right based on their search accuracy, no matter how we define it.

## Why not linear combination?

It's often proposed to use full-text and vector search scores to form a linear combination formula to rerank 
the results. So it goes like this:

```final_score = 0.7 * vector_score + 0.3 * full_text_score```

However, we didn't even consider such a setup. Why? First of all, [Meilisearch does not provide a relevancy score
](https://github.com/meilisearch/meilisearch/discussions/773). But more importantly, those scores don't make the 
problem linearly separable. We used BM25 score along with cosine vector similarity to use both of them as points 
coordinates in 2-dimensional space. The chart shows how those points are distributed:

![A distribution of both Qdrant and BM25 scores mapped into 2D space.](/articles_data/hybrid-search-with-meilisearch/linear-combination.png)

*A distribution of both Qdrant and BM25 scores mapped into 2D space. It clearly shows relevant and non-relevant 
objects are not linearly separable in that space, so using a linear combination of both scores won't give us 
a proper hybrid search.*

Both relevant and non-relevant items are mixed. **None of the linear formulas would be able to distinguish 
between them.** Thus, that's not the way to solve it.

## How to approach hybrid search

For that benchmark, there have been 3 experiments conducted:

1. **Vector search with Qdrant**

   All the documents and queries are vectorized with [all-MiniLM-L6-v2](https://www.sbert.net/docs/pretrained_models.html) 
   model, and compared with cosine similarity.

2. **Keyword-based search with Meilisearch**

   All the documents are indexed by Meilisearch and queried with its default configuration.

3. **Vector and keyword-based candidates generation and cross-encoder reranking**

   Both Qdrant and Meilisearch provides N candidates each and 
   [ms-marco-MiniLM-L-6-v2](https://www.sbert.net/docs/pretrained-models/ce-msmarco.html) cross encoder performs reranking 
   on those candidates only. This is an approach that makes it possible to use the power of semantic and keyword based 
   search together.

![The design of all the three experiments](/articles_data/hybrid-search-with-meilisearch/experiments-design.png)

In each case we want to receive the top 10 results for given query.

## Quality metrics

There are various ways of how to measure the performance of search engines, and https://neptune.ai/blog/recommender-systems-metrics 
is a great introduction to that topic. I selected the following ones:

- NDCG@5, NDCG@10
- DCG@5, DCG@10
- MRR@5, MRR@10
- Precision@5, Precision@10
- Recall@5, Recall@10

For the purposes of NDCG@N and DCG@N the relevancy score was derived from the ranking. We assumed two scenarios:

1. Relevancy is equal to 1.0 for all the results returned by the engine.
2. Relevancy is dependent on rank (decreases from 1 to 1/N for N results).

## Datasets

There are various benchmarks for search relevance available. Full-text search have been a strong baseline for
most of them, however there are also cases in which semantic search works better by default. 

### Home Depot

[Home Depot dataset](https://www.kaggle.com/competitions/home-depot-product-search-relevance/) consists of real 
inventory and search queries from Home Depot's website with a relevancy score from 1 (not relevant) to 3 (highly relevant).

    Anna Montoya, RG, Will Cukierski. (2016). Home Depot Product Search Relevance. Kaggle. 
    https://kaggle.com/competitions/home-depot-product-search-relevance

There are over 124k products with textual descriptions in the dataset and around 74k search queries with the relevancy
score assigned.

### WANDS

I also selected a relatively new search relevance dataset. [WANDS](https://github.com/wayfair/WANDS), which stands for 
Wayfair ANnotation Dataset, is designed to evaluate search engines for e-commerce.

    WANDS: Dataset for Product Search Relevance Assessment
    Yan Chen, Shujian Liu, Zheng Liu, Weiyi Sun, Linas Baltrunas and Benjamin Schroeder

In a nutshell, the dataset consists of products, queries and human annotated relevancy labels. Each product has various 
textual attributes, as well as facets. The relevancy is provided as textual labels: “Exact”, “Partial” and “Irrelevant” 
and authors suggest to convert those to 1, 0.5 and 0.0 respectively. There are 488 queries with a varying number of 
relevant items each.

# The results

Both datasets have been evaluated with the same experiments. The achieved performance is shown in the tables.

## Home Depot

![The results of all the experiments conducted on Home Depot dataset](/articles_data/hybrid-search-with-meilisearch/experiment-results-home-depot.png)

The results achieved with Meilisearch alone are better than with Qdrant only. However, if we combine both
methods into hybrid search with an additional cross encoder as a last step, then that gives great improvement
over any baseline method.

With the cross-encoder approach, Qdrant retrieved about 58.55% of the relevant items on average, while Meilisearch 
fetched 53.49%. Those numbers don't sum up to 100%, because some items were returned by both systems.

## WANDS

![The results of all the experiments conducted on WANDS dataset](/articles_data/hybrid-search-with-meilisearch/experiment-results-wands.png)

The dataset seems to be more suited for semantic search, but the results might be also improved if we decide to use
a hybrid search approach with cross encoder model as a final step.

Overall, combining both full-text and semantic search with an additional reranking step seems to be a good idea, as we 
are able to benefit the advantages of both methods.

Again, it's worth mentioning that with the 3rd experiment, with cross-encoder reranking, Qdrant returned more than 59.19% of 
the relevant items and Meilisearch around 53.08%.

### Search results

It is quite interesting to check out those results which were properly returned by one of the methods and not by the other. 
At the first glance at the search results, it is obvious there are some cases that won’t be found with full-text search 
without lots of human effort. These are, in turn, easily captured by vector embeddings. Just to mention a few, which were 
also marked as relevant in the WANDS dataset:

- Query: **nautical platters**

  Item: **sandy shore sea shells design serving platter**

- Query: **outdoor privacy wall**

  Item: **2 ft. h x 4 ft. w metal privacy screen**

- Query: **closet storage with zipper**

  Item: **60 ‘’ w portable wardrobe**

- Query: **outdoor light fixtures**

  Item: **cerridale outdoor armed sconce**

- Query: **beach blue headboard**

  Item: **seaside upholstered panel headboard**

There are of course some cases in which vector search could not find the relevant items, but full-text mechanism of 
Meilisearch did that properly. **The good thing about vector search is that the neural model might be easily fine-tuned 
with those unsuccessful items.** If we wanted to do the same with the full-text search, then we would need to provide a 
list of synonyms. Unfortunately, we cannot predict all the possible queries our users may think of.

# A wrap up

You'll never cover all the possible queries with a list of synonyms, so a full-text search may not find all the relevant 
documents. There are also some cases in which your users use different terminology than the one you have in your database. 
Those problems are easily solvable with neural vector embeddings, and combining both approaches with an additional reranking 
step is possible. So you don't need to resign from your well-known full-text search mechanism but extend it with vector 
search to support the queries you haven't foreseen.
