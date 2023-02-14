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


<!-- 
What Hybrid search even is?

We know at least 3 definitions of hybrid search:
- a combination of vector search with filtering - we won't use it, we call it just filtered vector search
- a combination of vector seach with keyword-based search - this one we will cover in this article
- a combination of dense and sparse vectors - we will cover it in the next article

-->


## Why do we still need keyword search?

<!---
Why do we still need keyword search?

There are multiple scenarios where vector search have clear advantage:

- When it is not enough keywords, short texts with typos and ambiguous content-dependent meanings
- Multi-lingual & multi-modal search
- Specialized domains, with tuned encoder models
- Document-as-a-Query similarity search

At the same time keyword-based search might be useful in following scenarios:

- Out-of-domain search, words are words, no matter what they mean. BM25 ranking represents the most universal property of natural language - less frequent words are more important.
- Search-as-you-type, when there is only a few characters typed, and we can't use vector search yet.
- Exact phrase matching, when we want to find the exact phrase in the document. Useful for names of the products, people, etc.

-->


## Matching the tool to the task

<!---

Text search itself is devided into multiple specializations:

- Web-scale search, documents retrieval
- Fast search-as-you-type
- Logs search, and search over less-than-natural texts (transactions, code, etc.)

Each of those scenarios have a specialized tool, which performs the search best in that scenario.
And we can combine those tools with vector search to get the best of both worlds.

-->

# The fast search: A Fallback strategy


<!---

In scenarios like search-as-you-type, the speed of the search is crucial.
That is why we can't use vector search on every query. At the same time the simple prefix search might have a bad recall.

In this case a good strategy is to use vector search only when the keyword/prefix search returns a none or small number of results.

A good candidate for this is a MeiliSearch. It uses custom ranking rules to precise result as fast as user can type.


here is a pseudo-code of such a strategy:

```python
async def search(query: str):
    # Get fast results from MeiliSearch
    keyword_search_result = search_meili(query)

    # Check if there are enough results
    # or if the results are good enough for given query
    if is_results_enough(keyword_search_result, query):
        return keyword_search

    # Encoding takes time, but we fill get more results
    vector_query = encode(query)

    vector_result = search_qdrant(vector_query)
    return vector_result
```

-->

# The precise search: The re-ranking strategy

<!---

Another scenario is where we care most about the precision of the search.
We will be using reference datasets to benchmark the search quality.

There a bunch of search engines, that specialize in full-text search we found interesting:

- https://github.com/quickwit-oss/tantivy - a full-text indexing library, written in Rust. Have a great performance and featureset. 
- https://github.com/lnx-search/lnx - a young but promising project, utilizes Tanitvy as a backend
- https://github.com/zinclabs/zinc - a project written in Go, focused on minimal resource usage and high performance.
- https://github.com/valeriansaliou/sonic - a project written in Rust, uses custom network communication protocol for fast communication between the client and the server.


You can use any of those engines, all of them will work fine in combination with vector search and Qdrant.

But before that, we need to understand how to combine the results from different sources.

-->

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

## How to approach re-ranking?

<!---

The other common approach to re-rank search results is to use model that takes additional factors into account.
Those models are usually trained on a clickstream data of real application and might be very business-specific.
So we will not cover them in this article. Instead, we will focus on the more general approach.

We will use so-called cross-encoder models. 
Cross-encoder takes a pair of text and predicts the similarity between them.
Unlike embedding models, cross-encoders are not compressing text into a vector but uses interaction between individual tokens of both texts.
Those models are generally more powerful than both bm25 and vector search, but they are also slower.

It is only feasible to use cross-encoder models for re-ranking of pre-selected candidates.

Here is a pseudo-code of such a strategy:

```python
async def search(query: str):
    keyword_search = search_keyword(query)
    vector_search = search_qdrant(query) 
    all_results = await asyncio.gather(keyword_search, vector_search)  # parallel calls
    rescored = cross_encoder_rescore(query, all_results)
    return rescored
```

Worth mentioning that queries to keyword search and vector search and re-scring can be done in parallel.
Cross-encoder can start scoring results as soon as the fastest search engine returns the results.

-->


## Experiments

For that benchmark, there have been 3 experiments conducted:

1. **Vector search with Qdrant**

   All the documents and queries are vectorized with [all-MiniLM-L6-v2](https://www.sbert.net/docs/pretrained_models.html) 
   model, and compared with cosine similarity.

2. **Keyword-based search with BM25**

   All the documents are indexed by BM25 and queried with its default configuration.

3. **Vector and keyword-based candidates generation and cross-encoder reranking**

   Both Qdrant and BM25 provides N candidates each and 
   [ms-marco-MiniLM-L-6-v2](https://www.sbert.net/docs/pretrained-models/ce-msmarco.html) cross encoder performs reranking 
   on those candidates only. This is an approach that makes it possible to use the power of semantic and keyword based 
   search together.

![The design of all the three experiments](/articles_data/hybrid-search/experiments-design.png)

### Quality metrics

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

### Datasets

There are various benchmarks for search relevance available. Full-text search has been a strong baseline for
most of them. However, there are also cases in which semantic search works better by default. For that article, 
I'm performing **zero shot search**, meaning our models didn't have any prior exposure to the benchmark datasets, 
so this is effectively an out-of-domain search.

#### Home Depot

[Home Depot dataset](https://www.kaggle.com/competitions/home-depot-product-search-relevance/) consists of real 
inventory and search queries from Home Depot's website with a relevancy score from 1 (not relevant) to 3 (highly relevant).

    Anna Montoya, RG, Will Cukierski. (2016). Home Depot Product Search Relevance. Kaggle. 
    https://kaggle.com/competitions/home-depot-product-search-relevance

There are over 124k products with textual descriptions in the dataset and around 74k search queries with the relevancy
score assigned. For the purposes of our benchmark, relevancy scores were also normalized.

#### WANDS

I also selected a relatively new search relevance dataset. [WANDS](https://github.com/wayfair/WANDS), which stands for 
Wayfair ANnotation Dataset, is designed to evaluate search engines for e-commerce.

    WANDS: Dataset for Product Search Relevance Assessment
    Yan Chen, Shujian Liu, Zheng Liu, Weiyi Sun, Linas Baltrunas and Benjamin Schroeder

In a nutshell, the dataset consists of products, queries and human annotated relevancy labels. Each product has various 
textual attributes, as well as facets. The relevancy is provided as textual labels: “Exact”, “Partial” and “Irrelevant” 
and authors suggest to convert those to 1, 0.5 and 0.0 respectively. There are 488 queries with a varying number of 
relevant items each.

## The results

Both datasets have been evaluated with the same experiments. The achieved performance is shown in the tables.

### Home Depot

![The results of all the experiments conducted on Home Depot dataset](/articles_data/hybrid-search/experiment-results-home-depot.png)

The results achieved with BM25 alone are better than with Qdrant only. However, if we combine both
methods into hybrid search with an additional cross encoder as a last step, then that gives great improvement
over any baseline method.

With the cross-encoder approach, Qdrant retrieved about 56.05% of the relevant items on average, while Tantivy 
fetched 59.16%. Those numbers don't sum up to 100%, because some items were returned by both systems.

### WANDS

![The results of all the experiments conducted on WANDS dataset](/articles_data/hybrid-search/experiment-results-wands.png)

The dataset seems to be more suited for semantic search, but the results might be also improved if we decide to use
a hybrid search approach with cross encoder model as a final step.

Overall, combining both full-text and semantic search with an additional reranking step seems to be a good idea, as we 
are able to benefit the advantages of both methods.

Again, it's worth mentioning that with the 3rd experiment, with cross-encoder reranking, Qdrant returned more than 48.12% of 
the relevant items and Tantivy around 66.66%.

### Some anecdotal observations

<!--
Table with search examples: Examples where vector search did better and vice versa.
-->



# A wrap up

<!---

Each scenario requires it's own specialized tool. But it is possible to combine multiple tools with minimal overhead to achieve best results.

-->

You'll never cover all the possible queries with a list of synonyms, so a full-text search may not find all the relevant 
documents. There are also some cases in which your users use different terminology than the one you have in your database. 
Those problems are easily solvable with neural vector embeddings, and combining both approaches with an additional reranking 
step is possible. So you don't need to resign from your well-known full-text search mechanism but extend it with vector 
search to support the queries you haven't foreseen.
