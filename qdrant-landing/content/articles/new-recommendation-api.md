---
title: Deliver Better Recommendations with Qdrant’s new API
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

The most popular use case for vector search engines, such as Qdrant, is Semantic search with a single query vector. Given the 
query, we can vectorize (embed) it and find the closest points in the index. But [Vector Similarity beyond Search](/articles/vector-similarity-beyond-search/) 
does exist, and recommendation systems are a great example. Recommendations might be seen as a multi-aim search, where we want 
to find items close to positive and far from negative examples. This use of vector databases has many applications, including 
recommendation systems for e-commerce, content, or even dating apps.

Qdrant has provided the [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) 
for a while, but the previous version had some limitations. The latest release, [Qdrant 1.6](https://github.com/qdrant/qdrant/releases/tag/v1.6.0), 
gives you some new exciting features, including an extension of the recommendation API, making it more flexible and powerful. 
This article unveils the internals and shows how they may be used in practice.

### Recap of the old recommendations API

The old [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api) in Qdrant came with some limitations. First of all, it was required to pass vector IDs for 
both positive and negative example points. If you wanted to use vector embeddings directly, you had to either create a new point 
in a collection or mimic the behaviour of the Recommendation API by using the [Search API](https://qdrant.tech/documentation/concepts/search/#search-api).
Moreover, in the previous releases of Qdrant, you were always asked to provide at least one positive example. This requirement 
was based on the algorithm used to combine multiple samples into a single query vector. It was a simple, yet effective approach. 
However, if the only information you had was that your user dislikes some items, you couldn't use it directly.

Qdrant 1.6 brings a more flexible API. You can now provide both IDs and vectors of positive and negative examples. You can even 
combine them within a single request. That makes the new implementation backward compatible, so you can easily upgrade an existing
Qdrant instance without any changes in your code. And the default behaviour of the API is still the same as before. However, we 
extended the API, so **you can now choose the strategy of how to find the recommended points**.

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

There are two key changes in the request. First of all, we can adjust the strategy of search and set it to `average_vector` (the 
default) or `best_score`. Moreover, we can pass both IDs (`718`) and embeddings (`[0.2, 0.3, 0.4, 0.5]`) as both positive and 
negative examples. 

## HNSW ANN example and strategy

Let’s start with an example to help you understand the [HNSW graph](https://qdrant.tech/articles/filtrable-hnsw/). Assume you want 
to travel to a small city on another continent:

1. You start from your hometown and take a bus to the local airport.
2. Then, take a flight to one of the closest hubs. 
3. From there, you have to take another flight to a hub on your destination continent.
4. Hopefully, one last flight to your destination city.
5. You still have one more leg on local transport to get to your final address. 

This journey is similar to the HNSW graph’s use in Qdrant's approximate nearest neighbours search.

![Transport network](/articles_data/new-recommendation-api/example-transport-network.png)

HNSW is a multilayer graph of vectors (embeddings), with connections based on vector proximity. The top layer has the least 
points, and the distances between those points are the biggest. The deeper we go, the more points we have, and the distances 
get closer. The graph is built in a way that the points are connected to their closest neighbours at every layer. 

All the points from a particular layer are also in the layer below, so switching the search layer while staying in the same 
location is possible. In the case of transport networks, the top layer would be the airline hubs, well-connected but with big 
distances between the airports. Local airports, along with railways and buses, with higher density and smaller distances, make 
up the middle layers. Lastly, our bottom layer consists of local means of transport, which is the densest and has the smallest 
distances between the points.

You don’t have to check all the possible connections when you travel. You select an intercontinental flight, then a local one, 
and finally a bus or a taxi. All the decisions are made based on the distance between the points. 

The search process in HNSW is also based on similarly traversing the graph. Start from the entry point in the top layer, find 
its closest point and then use that point as the entry point into the next densest layer. This process repeats until we reach 
the bottom layer. Visited points and distances to the original query vector are kept in memory. If none of the neighbours of 
the current point is better than the best match, we can stop the traversal, as this is a local minimum. We start at the biggest 
scale, and then gradually zoom in.

In this oversimplified example, we assumed that the distance between the points is the only factor that matters. In reality, we 
might want to consider other criteria, such as the ticket price, or avoid some specific locations due to certain restrictions. 
That means, there are various strategies for choosing the best match, which is also true in the case of vector recommendations. 
We can use different approaches to determine the path of traversing the HNSW graph by changing how we calculate the score of a 
candidate point during traversal. The default behaviour is based on pure distance, but Qdrant 1.6 exposes two strategies for the 
recommendation API.

### Average vector

The default strategy, called `average_vector` is the previous one, based on the average of positive and negative examples. It 
simplifies the recommendations process and converts it into a single vector search. It supports both point IDs and vectors as 
parameters. For example, you can get recommendations based on past interactions with existing points combined with query vector 
embedding. Internally, that mechanism is based on the averages of positive and negative examples and was calculated with the 
following formula:

```
average_vector = avg(positive_vectors) + ( avg(positive_vectors) - avg(negative_vectors) )
```

The `average_vector` converts the problem of recommendations into a single vector search.

### The new hotness - Best score

The new strategy is called `best_score`. It does not rely on averages and is more flexible. It allows you to pass just negative 
samples and uses a slightly more sophisticated algorithm under the hood.

The best score is chosen at every step of HNSW graph traversal. We separately calculate the distance between a traversed point 
and every positive and negative example. In the case of the best score strategy, **there is no single query vector anymore, but a 
bunch of positive and negative queries**. As a result, for each sample in the query, we have a set of distances, one for each 
sample. In the next step, we simply take the best scores for positives and negatives, creating two separate values. Best scores 
are just the closest distances of a query to positives and negatives. The idea is: **if a point is closer to any negative than to 
any positive example, we do not want it**. We penalize being close to the negatives, so instead of using the similarity value 
directly, we check if it’s closer to positives or negatives. The following formula is used to calculate the score of a traversed 
potential point:

```rust
if best_positive_score > best_negative_score {
    score = best_positive_score
} else {
    score = -(best_negative_score * best_negative_score)
}
```

If the point is closer to the negatives, we penalize it by taking the negative squared value of the best negative score. For a 
closer negative, the score of the candidate point will always be lower or equal to zero, making the chances of choosing that point 
significantly lower. However, if the best negative score is higher than the best positive score, we still prefer those that are 
further away from the negatives. That procedure effectively **pulls the traversal procedure away from the negative examples**.

If you want to know more about the internals of HNSW, you can check out the article about the 
[Filtrable HNSW](https://qdrant.tech/articles/filtrable-hnsw/) that covers the topic thoroughly.

## Food Discovery demo

Our [Food Discovery demo](https://qdrant.tech/articles/food-discovery-demo/) is an application built on top of the new [Recommendation API](https://qdrant.tech/documentation/concepts/search/#recommendation-api). 
It allows you to find a meal based on liked and disliked photos. There are some updates, enabled by the new Qdrant release:

* **Ability to include multiple textual queries in the recommendation request.** Previously, we only allowed passing a single 
  query to solve the cold start problem. Right now, you can pass multiple queries and mix them with the liked/disliked photos. 
  This became possible because of the new flexibility in parameters. We can pass both point IDs and embedding vectors in the same
  request, and user queries are obviously not a part of the collection.
* **Switch between the recommendation strategies.** You can now choose between the `average_vector` and the `best_score` scoring 
  algorithm. 

### Differences between the strategies

The UI of the Food Discovery demo allows you to switch between the strategies. The `best_vector` is the default one, but with just 
a single switch, you can see how the results differ when using the previous `average_vector` strategy.

If you select just a single positive example, both algorithms work identically.

[//]: # (All the figures were generated from .png files using ImageMagick: convert -delay 300 -loop 0 one-positive*.png one-positive.gif)

| One positive example, average vector                                                                     | | One positive example, best score                                                                     |
|----------------------------------------------------------------------------------------------------------|-|------------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/one-positive-average-vector.png" class="lightbox-image"> | | <img src="/articles_data/new-recommendation-api/one-positive-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/one-positive.gif" caption="One positive example, both strategies" >}})

The difference only becomes apparent when you start adding more examples, especially if you choose some negatives.

| One positive and one negative example, average vector                                                                 | | One positive and one negative example, best score                                                                 |
|-----------------------------------------------------------------------------------------------------------------------|-|-------------------------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/one-positive-one-negative-average-vector.png" class="lightbox-image"> | | <img src="/articles_data/new-recommendation-api/one-positive-one-negative-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/one-positive-one-negative.gif" caption="One positive and one negative example, both strategies" >}})

The more likes and dislikes we add, the more diverse the results of the `best_score` strategy will be. In the old strategy, there 
is just a single vector, so all the examples are similar to it. The new one takes into account all the examples separately, making 
the variety richer.

| Multiple positive and one negative examples, average vector                                          | | Multiple positive and one negative examples, best score                                          |
|------------------------------------------------------------------------------------------------------|-|--------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/multiple-average-vector.png" class="lightbox-image"> | | <img src="/articles_data/new-recommendation-api/multiple-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/multiple.gif" caption="Multiple positive and one negative examples, both strategies" >}})

Choosing the right strategy is dataset-dependent, and the embeddings play a significant role here. Thus, it’s always worth trying 
both of them and comparing the results in a particular case.

#### Handling the negatives only

In the case of our Food Discovery demo, passing just the negatives works as an outlier detection mechanism. The dataset was supposed 
to contain only food photos, but some of them are not. If you pass them as negative examples, the results will usually contain just 
the non-food items. That’s a simple way to filter out the outliers.

| Negatives only, average vector                                                                             | | Negatives only, best score                                                                             |
|------------------------------------------------------------------------------------------------------------|-|--------------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/negatives-only-average-vector.png" class="lightbox-image"> | | <img src="/articles_data/new-recommendation-api/negatives-only-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/negatives-only.gif" caption="Negatives only, both strategies" >}})

Still, both methods return different results, so they each have their place depending on the  questions being asked and the datasets 
being used.

#### Challenges with multimodality

Food Discovery uses the [CLIP embeddings model](https://huggingface.co/sentence-transformers/clip-ViT-B-32), which is multimodal, 
allowing both images and texts encoded into the same vector space. Using this model allows for image queries, text queries, or both of 
them combined. We utilized that mechanism in the updated demo, allowing you to pass the textual queries to filter the results further.

| A single text query, average vector                                                                    | | A single text query, best score                                                                     |
|--------------------------------------------------------------------------------------------------------|-|-----------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/text-query-average-vector.png" class="lightbox-image"> | | < img src="/articles_data/new-recommendation-api/text-query-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/text-query.gif" caption="A single text query, both strategies" >}})

Text queries might be mixed with the liked and disliked photos, so you can combine them in a single request. However, you might be 
surprised by the results achieved with the new strategy, if you start adding the negative examples.

| A single text query with negative example, average vector                                                            | | A single text query with negative example, best score                                                            |
|----------------------------------------------------------------------------------------------------------------------|-|------------------------------------------------------------------------------------------------------------------|
| <img src="/articles_data/new-recommendation-api/text-query-with-negative-average-vector.png" class="lightbox-image"> | | <img src="/articles_data/new-recommendation-api/text-query-with-negative-best-score.png" class="lightbox-image"> |

[//]: # ({{< figure src="/articles_data/new-recommendation-api/text-query-with-negative.gif" caption="A single text query with negative example, both strategies" >}})

This is an issue related to the embeddings themselves. Our dataset contains a bunch of image embeddings that are pretty close to each 
other. On the other hand, our text queries are quite far from most of the image embeddings, but relatively close to some of them, so the 
text-to-image search seems to work well. When all query items come from the same domain, such as only text, everything works fine. 
However, if we mix positive text and negative image embeddings, the results of the `best_score` are overwhelmed by the negative samples, 
which are simply closer to the dataset embeddings. If you experience such a problem, the `average_vector` strategy might be a better 
choice.

### Check out the demo

The [Food Discovery Demo](https://food-discovery.qdrant.tech/) is available online, so you can test and see the difference. 
This is an open source project, so you can easily deploy it on your own. The source code is available in the [GitHub repository
](https://github.com/qdrant/demo-food-discovery/) and the [README](https://github.com/qdrant/demo-food-discovery/blob/main/README.md) describes the process of setting it up. 
Since calculating the embeddings takes a while, we precomputed them and exported them as a [snapshot](https://storage.googleapis.com/common-datasets-snapshots/wolt-clip-ViT-B-32.snapshot), 
which might be easily imported into any Qdrant instance. [Qdrant Cloud is the easiest way to start](https://cloud.qdrant.io/), though!
