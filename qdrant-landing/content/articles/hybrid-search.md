---
title: 50 Shades of Hybrid Search
short_description: What Hybrid Search is and how to get the best of both worlds.
description: What Hybrid Search is and how to get the best of both worlds.
preview_dir: /articles_data/hybrid-search/preview
social_preview_image: /articles_data/hybrid-search/social_preview.png
small_preview_image: /articles_data/hybrid-search/icon.svg
weight: 5
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-01-16T12:25:00.000Z
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
it with a vector database. [Tantivy](https://github.com/quickwit-oss/tantivy) is one of the options worth considering. 
It is written in Rust, as Qdrant, which makes it really fast.

Designing a proper search pipeline shouldn't be biased by some personal preferences. That's why it's worth 
benchmarking different options and choosing the right based on their search accuracy, no matter how we define it.

## Why not linear combination?

It's often proposed to use full-text and vector search scores to form a linear combination formula to rerank 
the results. So it goes like this:

```final_score = 0.7 * vector_score + 0.3 * full_text_score```

However, we didn't even consider such a setup. Why? Those scores don't make the problem linearly separable. We used 
BM25 score along with cosine vector similarity to use both of them as points coordinates in 2-dimensional space. The 
chart shows how those points are distributed:

![A distribution of both Qdrant and BM25 scores mapped into 2D space.](/articles_data/hybrid-search/linear-combination.png)

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

2. **Keyword-based search with Tantivy**

   All the documents are indexed by Tantivy and queried with its default configuration.

3. **Vector and keyword-based candidates generation and cross-encoder reranking**

   Both Qdrant and Tantivy provides N candidates each and 
   [ms-marco-MiniLM-L-6-v2](https://www.sbert.net/docs/pretrained-models/ce-msmarco.html) cross encoder performs reranking 
   on those candidates only. This is an approach that makes it possible to use the power of semantic and keyword based 
   search together.

![The design of all the three experiments](/articles_data/hybrid-search/experiments-design.png)

In each case we want to receive the top 10 results for given query.

At first glance, the last approach might look like there was some overhead due to calling two different services. 
In reality, those are typically launched separately, and retrieving the results from both of them and combining them
is not a big deal if done correctly. If you use Python, calling the services asynchronously allows running everything
in parallel. Libraries, such as [asyncio](https://docs.python.org/3/library/asyncio.html) or 
[AIOHTTP](https://docs.aiohttp.org/en/stable/), may help do that seamlessly.

```python
async def search(query: str):
    keyword_search = search_tantivy(query)
    vector_search = search_qdrant(query) 
    all_results = await asyncio.gather(keyword_search, vector_search)  # parallel calls
    rescored = cross_encoder_rescore(query, all_results)
    return rescored
```

## Quality metrics

There are various ways of how to measure the performance of search engines, and *[Recommender Systems: Machine Learning 
Metrics and Business Metrics](https://neptune.ai/blog/recommender-systems-metrics)* is a great introduction to that topic. 
I selected the following ones:

- NDCG@5, NDCG@10
- DCG@5, DCG@10
- MRR@5, MRR@10
- Precision@5, Precision@10
- Recall@5, Recall@10

Since both systems return a score for each result, we could use DCG and NDCG metrics. However, BM25 scores are not
normalized be default. We performed the normalization to a range `[0, 1]` by dividing each score by the maximum
score returned for that query. 

## Datasets

There are various benchmarks for search relevance available. Full-text search has been a strong baseline for
most of them. However, there are also cases in which semantic search works better by default. For that article, 
I'm performing **zero shot search**, meaning our models didn't have any prior exposure to the benchmark datasets, 
so this is effectively an out-of-domain search.

### Home Depot

[Home Depot dataset](https://www.kaggle.com/competitions/home-depot-product-search-relevance/) consists of real 
inventory and search queries from Home Depot's website with a relevancy score from 1 (not relevant) to 3 (highly relevant).

    Anna Montoya, RG, Will Cukierski. (2016). Home Depot Product Search Relevance. Kaggle. 
    https://kaggle.com/competitions/home-depot-product-search-relevance

There are over 124k products with textual descriptions in the dataset and around 74k search queries with the relevancy
score assigned. For the purposes of our benchmark, relevancy scores were also normalized.

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

![The results of all the experiments conducted on Home Depot dataset](/articles_data/hybrid-search/experiment-results-home-depot.png)

The results achieved with Tantivy alone are better than with Qdrant only. However, if we combine both
methods into hybrid search with an additional cross encoder as a last step, then that gives great improvement
over any baseline method.

With the cross-encoder approach, Qdrant retrieved about 56.05% of the relevant items on average, while Tantivy 
fetched 59.16%. Those numbers don't sum up to 100%, because some items were returned by both systems.

## WANDS

![The results of all the experiments conducted on WANDS dataset](/articles_data/hybrid-search/experiment-results-wands.png)

The dataset seems to be more suited for semantic search, but the results might be also improved if we decide to use
a hybrid search approach with cross encoder model as a final step.

Overall, combining both full-text and semantic search with an additional reranking step seems to be a good idea, as we 
are able to benefit the advantages of both methods.

Again, it's worth mentioning that with the 3rd experiment, with cross-encoder reranking, Qdrant returned more than 48.12% of 
the relevant items and Tantivy around 66.66%.

### Search results

It is interesting to check out those results which were returned correctly by one of the methods and not by the other. At first 
glance at the search results, it is obvious some cases won’t be found with a full-text search without lots of human effort. These are, 
in turn, easily captured by vector embeddings. In some cases, Qdrant could even find the items with no overlap between terms used in 
a query and the document. There are of course some cases in which vector search could not find the relevant items, but full-text 
mechanism of Tantivy did that properly. **The good thing about vector search is that the [neural model might be easily 
fine-tuned](https://quaterion.qdrant.tech/) with those unsuccessful items.** If we wanted to do the same with the full-text search, 
then we would need to provide a list of synonyms or configure a different heuristics. Unfortunately, we cannot predict all the 
possible queries our users may think of.

# A wrap up

You'll never cover all the possible queries with a list of synonyms, so a full-text search may not find all the relevant 
documents. There are also some cases in which your users use different terminology than the one you have in your database. 
Those problems are easily solvable with neural vector embeddings, and combining both approaches with an additional reranking 
step is possible. So you don't need to resign from your well-known full-text search mechanism but extend it with vector 
search to support the queries you haven't foreseen.
