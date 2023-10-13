---
title: New Recommendation API
short_description: Qdrant 1.6 brings recommendations strategies and more flexibility to the Recommendation API.
description: Qdrant 1.6 brings recommendations strategies and more flexibility to the Recommendation API.
preview_dir: /articles_data/new-recommendation-api/preview
social_preview_image: /articles_data/new-recommendation-api/preview/social_preview.jpg
small_preview_image: /articles_data/new-recommendation-api/icon.svg
weight: -60
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-10-10T10:12:00.000Z
---

Semantic search with a single vector being used as a query is probably the most popular use case for vector 
search engines, such as Qdrant. Given the query, we can vectorize it and find the closest points in the index. 
But [Vector Similarity beyond Search](/articles/vector-similarity-beyond-search/) does exist, and recommendation 
systems are a great example. Recommendations might be seen as a multi-aim search, where we want to find items 
close to positive and far from negative examples. That has multiple applications, including recommendation systems 
for e-commerce, content, or even dating apps.

Qdrant has provided the [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) 
for a while, but the previous version had some limitations. The latest release, [Qdrant 1.6](https://github.com/qdrant/qdrant/releases/tag/v1.6.0), 
gives you some new exciting features, including an extension of the recommendation API, making it more flexible
and powerful. This article unveils the internals and shows how they may be used in practice.

### Recap of the old recommendations API

The old [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) in Qdrant came with
some limitations. First of all, it was required to pass both positive and negative examples using the IDs of the
existing points. If you wanted to use vector embedding directly, you had to either create a new point in a collection
or mimic the behaviour of the Recommendation API by using the [Search API](https://qdrant.tech/documentation/concepts/search/#search-api).
Moreover, in the previous releases of Qdrant, you were always asked to provide at least one positive example. That was caused 
by the algorithm used to combine multiple samples into a single query vector. It was a simple, yet effective approach. However, 
if the only information you had was that your user dislikes some items, you couldn't use it directly.

Qdrant 1.6 brings a more flexible API. You can now can provide both ids and vectors of positive and negative
examples. You can even combine them within a single request. That makes the new implementation backward compatible,
so you can easily upgrade an existing Qdrant instance without any changes in your code. And the default behaviour
of the API is still the same as before. However, we extended the API, so **you can now choose the strategy of how
to find the recommended points**.

```http request
POST /collections/{collection_name}/points/recommend

{
  "positive": [100, 231],
  "negative": [718, [0.2, 0.3, 0.4, 0.5]],
  "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "value": "London"
                }
            }
        ]
  },
  "strategy": "average_vector",
  "limit": 3
}
```

## Recommendations` strategy

Assume you want to travel to a small city on another continent. You start from your hometown, take a taxi to the local 
airport, and then a flight to one of the closest hubs. From there you have to take another flight to the hub at your 
destination continent, and, hopefully, the last one to the airport of the city you want to visit. Finally, you still need 
to choose some local transport to get to your final address. The transport network is somehow similar to the HNSW graph, 
a structure used in Qdrant to implement the approximate nearest neighbours search. HNSW is a multilayer graph of vectors, 
with connections based on vector proximity. The top layer has the least points, and the distances between those points are 
the biggest. The deeper we go, the more points we have, and the distances are getting smaller. The graph is built in a way 
that the points are connected to their closest neighbours at every layer. All the points from a particular layer are also 
present in the layer below, so it's possible to switch the search space while staying in the same location. In the case of 
transport networks, the top layer would be the airline hubs, well-connected but with big distances between the airports. 
Local airports, along with railways and buses, build the middle layers with way higher density and smaller distances. 
Lastly, our bottom layer consists of local means of transport, which is the densest and has the smallest distances 
between the points.

![Transport network](/articles_data/new-recommendation-api/example-transport-network.png)

You don’t have to check all the possible connections when you travel. You select an intercontinental flight, then a local one, 
and finally a bus or a taxi. All the decisions are made based on the distance between the points. The search process in HNSW 
is also based on traversing the graph in a similar manner. We start from the entry point in the top layer, find the closest 
point here, and move to the same point, but in the next layer. This process repeats until we reach the bottom layer. Visited 
points are kept in the memory, along with the distances to the query vector. If none of the neighbours of the current point is 
better than the best match, we can stop the traversal, as this is a local minimum. We start by zooming out, and then gradually 
zoom in.

In this oversimplified example, we assumed that the distance between the points is the only factor that matters. In reality, we 
might want to consider other criteria, such as the ticket price, or avoid some specific locations due to certain restrictions. 
That means, there are various strategies for choosing the best match, which is also true in the case of vector recommendations. 
We can use different approaches to determine the path of traversing the HNSW graph by changing how we calculate the score of a 
candidate point during traversal. The default behaviour is based on pure distance, but Qdrant 1.6 exposes two strategies for the 
recommendation API.

### Average vector

The default one, called `average_vector` is the old one, based on the average of positive and negative examples. It simplifies 
the recommendations process and converts it into a single vector search. Now, it supports both point IDs and vectors as 
parameters, so you can, for example, recommend some items based on past interactions with existing points, and also 
incorporate the query vector, which is not a part of the collection. Internally, that mechanism is based on the averages of 
positive and negative examples and was calculated with the following formula:

```
average_vector = avg(positive_vectors) + ( avg(positive_vectors) - avg(negative_vectors) )
```

The `average_vector` converts the problem of recommendations into a single vector search.

### Best score

The second strategy is called `best_score`. It does not rely on averages and is more flexible. It allows you to pass just the 
negative samples and has a slightly more sophisticated algorithm under the hood.

The best score is chosen at every step of HNSW graph traversal. In the average vector strategy, we selected the points most 
similar to the query vector regarding the distance function. In the case of the best score strategy, **there is no single query 
vector anymore, but a bunch of positive and negative queries**. Thus, we calculate the distance between a traversed point and 
every positive and negative example separately. As a result, we have a set of distances, one for each sample. In the next step, 
we simply take the best scores for positives and negatives, so now we have two values. We want to penalize being close to the 
negatives, so instead of using the similarity value directly, we check if it’s closer to positives or negatives. The following 
formula is used to calculate the score of a traversed point:

```rust
if best_positive_score > best_negative_score {
    score = best_positive_score
} else {
    score = -(best_negative_score * best_negative_score)
}
```

If the point is closer to the negatives, we penalize it by taking the negative squared value of the best negative score. In such 
a case, the score of the candidate point is always going to be lower or equal to zero, making the chances of choosing that point 
significantly lower. However, if there are only points with the best negative score higher than the best positive score, we still 
prefer those that are further away from the negatives. That procedure effectively **pulls the traversal procedure away from the 
negative examples**.

If you want to know more about the internals of HNSW, you can check out the article about the 
[Filtrable HNSW](https://qdrant.tech/articles/filtrable-hnsw/) that covers the topic thoroughly.

## Food Discovery demo

Our [Food Discovery demo](https://qdrant.tech/articles/food-discovery-demo/) is an application built mainly on top of the 
[Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api). It allows you to find the meal 
based on the liked and disliked photos. There are some updates, enabled by the new Qdrant release:

* **Ability to include multiple textual queries in the recommendation request.** Previously we only allowed passing a single
  query to solve the cold start problem. Right now, you can pass multiple queries and mix them with the liked/disliked photos.
  This became possible, because we can pass both point ids and embedding vectors in the same request, and user queries are
  obviously not a part of the collection.
* **Switch between the recommendation strategies.** You can now choose between the `average_vector` and the `best_score`.
  This clearly shows the difference between the two approaches.

### Differences between the strategies

The UI of the Food Discovery demo allows you to switch between the strategies. The `best_vector` is the default one, but
with just a single switch you can see how the results differ when using the `average_vector` strategy.

If you select just a single positive example, both algorithms work identically.

![](/articles_data/new-recommendation-api/one-positive-best-score.png) ![](/articles_data/new-recommendation-api/one-positive-average-vector.png)

TODO: write and add strategy comparison in different cases

### Check out the demo

The [Food Discovery Demo](https://food-discovery.qdrant.tech/) is available online, so you can test and see the difference. 
This is an open source project, so you can easily deploy it on your own. The source code is available in the [GitHub repository
](https://github.com/qdrant/demo-food-discovery/). 
