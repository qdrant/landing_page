---
title: "Vector Similarity: Going Beyond Full-Text Search"
short_description: "How vector similarity goes past search: dissimilarity, diversity, recommendation, and discovery."
description: "Use vector similarity for more than search: dissimilarity, diversity, recommendation, and discovery, with the Qdrant API for each."
preview_dir: /articles_data/vector-similarity-beyond-search/preview
small_preview_image: /articles_data/vector-similarity-beyond-search/icon.svg
social_preview_image: /articles_data/vector-similarity-beyond-search/preview/social_preview.jpg
weight: 40
author: Luis Cossío
author_link: https://coszio.github.io/
date: 2023-08-08T08:00:00+03:00
draft: false
keywords: 
    - vector similarity
    - exploration
    - dissimilarity
    - discovery
    - diversity
    - recommendation
category: data-exploration
---

When making use of unstructured data, there are traditional go-to solutions that are well-known for developers:

- **Full-text search** when you need to find documents that contain a particular word or phrase.
- **[Vector search](/documentation/overview/vector-search/)** when you need to find documents that are semantically similar to a given query.

Today, the two usually run together: [hybrid search](/documentation/search-tuning/hybrid-search/) fuses keyword and vector results into one ranking. That makes it easy to see vector similarity as just an extension of full-text search. 

However, this article explores techniques that expand the use cases of unstructured data, shows that vector similarity creates its own stack of data exploration tools, and points to the Qdrant API that implements each one.

## Vector Search vs. Full-Text Search

While there is an intersection in the functionality of these two approaches, there is also a vast area of functions that is unique to each of them.
For example, the exact phrase matching and counting of results are native to full-text search, while vector similarity support for this type of operation is limited.
On the other hand, vector similarity easily allows cross-modal retrieval of images by text or vice versa, which is impossible with full-text search.

This mismatch in expectations might sometimes lead to confusion.
Attempting to use vector similarity as a full-text search can result in a range of frustrations, from slow response times to poor search results, to limited functionality.
Teams that do this get only a fraction of the benefits of vector similarity.

{{< figure width=70% src=/articles_data/vector-similarity-beyond-search/venn-diagram.png caption="Where Full-Text Search and Vector Search Overlap" alt="Venn diagram. Full-text search only: synonyms, quick counts, and facets. Both: similarity search and filters. Vector search only: dissimilarity search, recommendations, diversity search, and multimodality." >}}

The rest of this article covers the techniques that need their own interfaces, and the Qdrant query for each.


## Beyond Nearest-Neighbor Search

Having a vector representation of unstructured data unlocks new ways of interacting with it.
For example, it can be used to measure semantic similarity between words, to cluster words or documents based on their meaning, to find related images, or even to generate new text.
However, these interactions can go beyond finding their nearest neighbors (kNN).

Vector representations also support techniques beyond kNN search: dissimilarity search, diversity search, recommendations, and discovery.


## Dissimilarity Search

The Dissimilarity or farthest search is the most straightforward concept after the nearest search, which can't be reproduced in a traditional full-text search.
It aims to find the most dissimilar or distant documents across the collection.


{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/dissimilarity.png caption="Dissimilarity Search" alt="A query point with dashed lines to the six points farthest from it, which are circled as results." >}}

Unlike full-text match, Vector similarity can compare any pair of documents (or points) and assign a similarity score. 
It doesn't rely on keywords or other metadata. 
With vector similarity, we can easily achieve a dissimilarity search by inverting the search objective from maximizing similarity to minimizing it.
In Qdrant, this is a [Recommend query with only negative examples](/documentation/search/explore/#using-only-negative-examples), using the `best_score` or `sum_scores` strategy.

The dissimilarity search can find items in areas where previously no other search could be used.
Let's look at a few examples.

### Detecting Mislabeled Items

For example, we have a dataset of furniture in which we have classified our items into what kind of furniture they are: tables, chairs, and lamps.
To ensure our catalog is accurate, we can use a dissimilarity search to highlight items that are most likely mislabeled.

To do this, we only need to search for the most dissimilar items using the embedding of the category title itself as a query.
This can be too broad, so we combine it with a [filter](/articles/filterable-hnsw/) to narrow the search down to a specific category.


{{< figure src=/articles_data/vector-similarity-beyond-search/mislabelling.png caption="Mislabeling Detection" alt="Items ordered by dissimilarity to the query Chair: three chairs, an outdoor egg chair flagged for review, and a set of caster wheels flagged as mislabeled." >}}

In Qdrant, pass the category title embedding as the only negative example, and filter on the category.
The output of this search can be further processed with heavier models or human supervision to detect actual mislabeling.

### Detecting Outliers

In some cases, we might not even have labels, but it is still possible to try to detect anomalies in our dataset.
Dissimilarity search can be used for this purpose as well.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/anomaly-detection.png caption="Anomaly Detection" alt="Three chairs serve as reference points. An egg chair near them is marked for review, and a set of caster wheels far from all of them is marked as an anomaly." >}}

The only thing we need is a bunch of reference points that we consider "normal".
Then we can search for the most dissimilar points to this reference set and use them as candidates for further analysis.
In Qdrant, pass the IDs of the reference points as negative examples.
Keep the reference set to a few representative points, because the cost of `best_score` grows linearly with the number of examples, and raise the `ef` search parameter, for example to 64, for better accuracy.


## Diversity Search

Even without a query vector, similarity between the stored points can improve an overall selection of items from the dataset.

The naive approach is to do [random sampling](/documentation/search/search/#random-sampling). 
However, unless our dataset has a uniform distribution, the results of such sampling might be biased toward more frequent types of items.

{{< figure  width=80% src=/articles_data/vector-similarity-beyond-search/diversity-random.png caption="Example of Random Sampling" alt="A random sample of 16 bathroom products, most of them similar-looking drain plugs." >}}


The similarity information can increase the diversity of those results and make the first overview more interesting.
That is especially useful when users do not yet know what they are looking for and want to explore the dataset.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/diversity-force.png caption="Example of Similarity-Based Sampling" alt="A similarity-based sample of 16 bathroom products with little repetition, including headrests, bathtubs, feet, frames, cleaners, and a shelf." >}}


The power of vector similarity, in the context of being able to compare any two points, allows making a diverse selection of the collection possible without any labeling efforts.
By maximizing the distance between all points in the response, we can have an algorithm that will sequentially output dissimilar results.

{{< figure src=/articles_data/vector-similarity-beyond-search/diversity.png caption="Diversity Search" alt="Starting from a random point, each next result is the point farthest from all previous results." >}}


The best-known algorithm of this kind is [Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) (MMR).
Qdrant has supported it since v1.15 as an `mmr` parameter of a nearest-neighbor query, where `diversity` sets the balance between relevance (0.0) and diversity (1.0).
MMR needs a query vector. To build a selection without one, as in the diagram, request a [Distance Matrix](/documentation/search/explore/#distance-matrix) with `limit` set to the `sample` size minus one, so every sampled point is scored against every other.
Then pick points on the client: start from a random point and keep adding the point farthest from all points picked so far.


## Recommendations

Vector similarity can go above a single query vector.
It can combine multiple positive and negative examples for a more accurate retrieval.
Qdrant's Recommend query takes stored points as examples by their point IDs, and also accepts raw vectors.
With point IDs, we skip query-time neural network inference, which makes the recommendation search faster.

There are multiple ways to implement recommendations with vectors.

### Feature-Based Recommendations

The first approach is to take all positive and negative examples and average them to create a single query vector.
In this technique, the more significant components of positive vectors are canceled out by the negative ones, and the resulting vector is a combination of all the features present in the positive examples, but not in the negative ones.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/feature-based-recommendations.png caption="Feature-Based Recommendations" alt="Bar chart of vector dimensions. The search query keeps the dimensions where positive examples are high and negative examples are low." >}}

Qdrant implements this approach as the default [`average_vector` strategy](/documentation/search/explore/#average-vector-strategy) of the Recommend query.
It works great when the vectors are assumed to have each of their dimensions represent some kind of feature of the data, but sometimes distances are a better tool to judge negative and positive examples.

### Distance-Based Recommendations

Another approach is to use the distance between negative examples to the candidates to help them create exclusion areas.
In this technique, we perform searches near the positive examples while excluding the points that are closer to a negative example than to a positive one.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/relative-distance-recommendations.png caption="Distance-Based Recommendations" alt="Candidates near the positive examples are returned, except those closer to a negative example than to a positive one." >}}

Qdrant implements this approach as the [`best_score` strategy](/documentation/search/explore/#best-score-strategy), available since v1.6.
A candidate that is closer to a negative example than to any positive one gets a negative score, so it ranks below every candidate that is closer to a positive example.
[Deliver Better Recommendations with Qdrant's New API](/articles/new-recommendation-api/) compares it with `average_vector`.

The main use case of both approaches is to take some history of user interactions and recommend new items based on it.

## Discovery and Context Search

In many exploration scenarios, the desired destination is not known in advance.
The search process in this case can consist of multiple steps, where each step would provide a little more information to guide the search in the right direction.

To get more intuition about the possible ways to implement this approach, let's take a look at how similarity models are trained in the first place:

The most well-known loss function used to train similarity models is a [triplet loss](/articles/triplet-loss/).
In this loss, the model is trained by fitting the information of relative similarity of three objects: the Anchor, Positive, and Negative examples.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/triplet-loss.png caption="Triplet Loss" alt="Training pulls the positive example toward the anchor and pushes the negative example away by at least a margin." >}}

Using the same mechanics, we can look at the training process from the other side.
Given a trained model, the user can provide positive and negative examples, and the goal of the discovery process is then to find suitable anchors across the stored collection of vectors.

{{< figure width=60% src=/articles_data/vector-similarity-beyond-search/discovery.png caption="Reversed Triplet Loss" alt="One positive-negative pair splits the space into a +1 zone on the positive side and a -1 zone on the negative side." >}}

Multiple positive-negative pairs can be provided to make the discovery process more accurate.
As in model training, the pairs can be noisy or contradict each other, so the discovery process has to tolerate that.


{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/discovery-noise.png caption="Multiple Context Pairs" alt="Two positive-negative pairs split the space into four zones scored +2, 0, 0, and -2." >}}

The important difference between this and the recommendation method is that the positive-negative pairs in the discovery method don't assume that the final result should be close to positive, it only assumes that it should be closer than the negative one.

{{< figure width=80% src=/articles_data/vector-similarity-beyond-search/discovery-vs-recommendations.png caption="Discovery vs. Recommendation" alt="A recommendation result sits next to the positive example. A discovery candidate sits far from both examples, on the positive side of the pair." >}}

Qdrant implements both ideas in the [Discovery API](/documentation/search/explore/#discovery-api), available since v1.7.
Discovery search takes a target and context pairs. Points that satisfy more pairs always rank higher, and similarity to the target orders points that satisfy the same number.
Context search takes only the pairs and returns points from the zones where the loss is lowest, which gives a constrained but diverse result.
[Discovery Search in Qdrant](/articles/discovery-search/) walks through both.

## Exploration APIs in Qdrant

Vector similarity as a concept is much broader than task-specific implementations of full-text search, so the techniques in this article need their own query types.
Qdrant exposes them through the [Query API](/documentation/search/search/#query-api), available since v1.10, where they accept the same filters as a regular search.
The Distance Matrix API has its own endpoint.

| Technique | Qdrant query | Since |
|---|---|---|
| Dissimilarity search, mislabeling and outlier detection | [Recommend with only negative examples](/documentation/search/explore/#using-only-negative-examples) | v1.6 |
| Diversity search | [`mmr`](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) on a nearest-neighbor query | v1.15 |
| Random sampling | [`sample: random`](/documentation/search/search/#random-sampling) | v1.11 |
| Feature-based recommendations | [Recommend, `average_vector` strategy](/documentation/search/explore/#average-vector-strategy) | Before v0.10 |
| Distance-based recommendations | [Recommend, `best_score` strategy](/documentation/search/explore/#best-score-strategy) | v1.6 |
| Discovery and context search | [Discover and context queries](/documentation/search/explore/#discovery-api) | v1.7 |
| Similarity structure of a sample | [Distance Matrix API](/documentation/search/explore/#distance-matrix) | v1.12 |

Full-text search runs in the same API: Qdrant scores [BM25](/documentation/search/text-search/full-text-search/#bm25) on sparse vectors and combines it with dense vectors in [hybrid queries](/documentation/search/hybrid-queries/).

To try these queries, start with the runnable examples in [Explore the Data](/documentation/search/explore/).

