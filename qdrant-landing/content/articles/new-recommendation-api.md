---
title: New Recommendation API
short_description: TBD
description: TBD
social_preview_image: /articles_data/new-recommendation-api/preview/social_preview.png
small_preview_image: /articles_data/new-recommendation-api/icon.svg
weight: -60
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-10-10T10:12:00.000Z
---

Semantic search with a single vector being used as a query is probably the most popular use case for vector 
search engines, such as Qdrant. Given the query, we can vectorize it and find the closest points in the index. 
But [Vector Similarity beyond Search](/articles/vector-similarity-beyond-search/) does exist, and recommendation 
systems are a great example of it. Recommendations might be seen as multi-aim search, where we want to find 
items which are close to positive and far from negative examples. That has multiple applications, including
recommendation systems for e-commerce, content, or even dating apps.

Qdrant has been providing the [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) 
for a while, but it had some limitations. The latest release, [Qdrant 1.6](https://github.com/qdrant/qdrant/releases/tag/v1.6.0), 
gives you some new exciting features, including an extension of the recommendation API, making it more flexible
and powerful. This article unveils the internals and shows how it may be used in practice.

### Recap of the old recommendations API

The old [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) in Qdrant came with
some limitations. First of all, it was required to pass both positive and negative examples using the IDs of the
existing points. If you wanted to use a vector embedding directly, you had to either create a new point in a collection,
or mimic the behaviour of the Recommendation API by using the [Search API](https://qdrant.tech/documentation/concepts/search/#search-api).
Moreover, in the previous releases of Qdrant, you were always asked to provide at least one positive example. That was caused 
by the algorithm used to combine multiple samples into a single query vector. Up till now that mechanism was based on the 
averages of positive and negative examples and was calculated with the following formula:

```python
average_vector = avg(positive_vectors) + ( avg(positive_vectors) - avg(negative_vectors) )
```

It was a simple, yet effective approach. However, if the only information you had was that your user dislikes some items,
you couldn't use it directly.

Qdrant 1.6 brings a more flexible API. Right now, you can provide both ids and vectors of positive and negative
examples. You can even combine them within a single request. That makes the new implementation backward compatible,
so you can easily upgrade an existing Qdrant instance without any changes in your code. And the default behaviour
of the API is still the same as before. However, we extended the API, so **you can now choose the strategy of how
to find the recommended points**.

## Recommendations` strategy

Currently, we expose two strategies for the recommendation API. 

### Average vector

The default one, called `average_vector` is the old one, based on the average of positive and negative examples. 
It simplifies the process of recommendations and converts it into a single vector search.  Now it supports both 
point IDs and vectors as parameters, so you can, for example, recommend some items based on the past interactions 
with existing points, and also incorporate the query vector which is not a part of the collection. 

TODO: image with different books/movies and external query

The process of finding the best matches is pretty straightforward. Qdrant operates on HNSW graph and traverse it 
to find the closest entries in the vector space. If you want to know more about the internals of HNSW, you can
check out the article about the [Filtrable HNSW](https://qdrant.tech/articles/filtrable-hnsw/) that covers the topic
thoroughly. In a nutshell, the algorithm compares the query vector to the points visited during the traversal and 
chooses those which are the closest to it, in terms of the selected similarity function. The best matches are those
which optimize that function the most.

TODO: image with HNSW graph and query vector

### Best score

The second strategy is called `best_score`. It does not rely on averages and is more flexible. It allows you to
pass just the negative samples, and has a slightly more sophisticated algorithm under the hood. 

The best score is chosen at every step of HNSW graph traversal. In the average vector strategy, we were selecting 
the points most similar to the query vector in terms of the distance function. In case of the best score strategy, 
there is no single query vector anymore, but a bunch of positive and negative queries. Thus, we calculate the distance 
between a traversed point to every positive and negative example first. As a result we have a set of distances, one for 
each example. In the next step we simply take the best scores for positives and negatives, so now we have two values. 
We want to penalize being close to the negatives, so instead of using the similarity value directly, we check if it's 
closer to positive or negatives in terms of best score. The following formula is used to calculate the score of a
traversed point:

```rust
if best_positive_score > best_negative_score {
    score = best_positive_score
} else {
    score = -(best_negative_score * best_negative_score)
}
```

If the point is closer to negatives, we penalize it by taking the negative squared value of the best negative score.
In this case, the score of the candidate point is always going to be lower than zero, making the chances of choosing
that point significantly lower. 

TBD