---
title: Vector Similarity beyond Search
short_description: Harnessing the full capabilities of vector embeddings
description: Vector similarity posesses a lot of potential beyond simple full text search extension. In this article we explore some of the promissing new techniques that can be used to expand use-cases of unstructured data.
preview_dir: /articles_data/exploration-api/preview
small_preview_image: /articles_data/exploration-api/icon.svg
social_preview_image: /articles_data/exploration-api/preview/social_preview.jpg
weight: -1
author: Luis Cossio
author_link: https://github.com/coszio
date: 2023-07-01T13:00:00+03:00
draft: false
---


When making use of unstructured data, there are traditional go-to solutions that are well-known for developers:

- **Full-text search** when you need to find documents that contain a certain word or phrase.
- **Vector search** when you need to find documents that are semantically similar to a given query.

Sometimes poeple even mixing those two approaches, so it might look like the vector similarity is just an extension of full-text search. However, in this article we will explore some of the promissing new techniques that can be used to expand use-cases of unstructured data and demonstarte that vector similarity creates it's own stack of data exploration tools.


{{< figure src=/articles_data/exploration-api/venn-diagram.png caption="Full-text search and Vector Similarity Functionality overlap" >}}


While there is an intersection in the functionality of these two approaches, there is also a vast area of functions that is unique to each of them.
For example, the exact phrase matching and counting of results are native to full-text search, while vector similarity support for this type of operations is limited.
On the other hand, vector similarity easily allows cross-modal search - retrieval of images by text, or vice-versa, which is not possible with full-text search.

This mismatch in expectations might sometimes lead to confusion, attempting to use a vector similarity as a full-text search, can result in a range of frustrations, from slow response times, to poor search results, to limited functionality.
As a result, they are getting only a fraction of the benefits that vector similarity can provide.

Below we will explore why vector similarity stack deserves new interfaces and design patterns, that will unlock the full potential of this technology, that can still be used in conjunction with full-text search.

## New Ways to Interact with Similarities

Vector representations unlock new ways to interact with data.
For example, they can be used to measure semantic similarity between words, to cluster words or documents based on their meaning, to perform sentiment analysis, or even to generate new text.
However, these interactions can go beyond finding their nearest neighbors (kNN).
There are several other techniques that can be leveraged by vector representations beyond the traditional kNN search. These include dissimilarity search, diversity search, and recommendation.



## Dissimilarity Search

The simplest concept after the nearest search, which can’t be reproduced traditional full-text search is Dissimilarity search.
It aims to find the most un-similar or distant documents across the collection.


{{< figure src=/articles_data/exploration-api/dissimilarity.png caption="Dissimilarity Search" >}}

Vector similarity, unlike full-text match, is able to compare any pair of documents (or points) and assign a similarity score. 
It doesn’t rely on keywords or other metadata. 
With vector simialrity it can simply be achieved by inverting search objective from maximizing similarity to minimizing it.

The dissimilarity search unlocks vector similarity in the areas, where previously no search was used. 
Let's a look at a few examples.

### Case: Mislabeling Detection

Say, for example, we have a dataset of furniture, in which we have classified our items into what kind of furniture they are: tables, chairs, lamps, …etc.
To make sure that our catalog is accurate, we can use dissimilarity search to highliht items which are most likely mislabeled.

In order to do this, we only need to search for most dissimilar items using the 
embedding of the category title itself as a query.
We can use filters to narrow down the search to a specific category.

<!-- ToDo: Picture -->
<!-- {{< figure src=/articles_data/exploration-api/mislabeling.png caption="Mislabeling Detection" >}} -->

The output of this search can be further processed with heavier models or human supervision to detect actual mislabeling.

### Case: Outlier Detection

In some cases we might not even have labels, but it is still possible to try to detect anomalies in our dataset.
And the dissimilarity search can be used for this purpose as well.

The only thing we need is a bunch of reference points that we consider "normal".
Then we can simply search for the most dissimilar points to this reference set and use them as a candidates for further analysis.


## Diversity Search

Even with no input provided vector, \[dis\]similarity can improve an overall selection of items from the dataset.

Naive approach would be to do just some random sampling. 
However, unless our dataset have uniform distribution, the results of such sampling might be biased towards more frequent types of items.


<!-- ToDo: Picture with sanitary equipment -->


The similarity information can be used to increase the diversity of those results and make the first overview more interesting.
That is especially useful, when users do not yet know what they are looking for and want to explore the dataset.


The power of vector similarity, in the context of being able to compare any two points, allows making a diverse selection of the collection possible without any labeling efforts.
By maximizing the distance between all points in the response, we can have an algorithm that will sequentially output dissimilar results between all of them.

{{< figure src=/articles_data/exploration-api/diversity.png caption="Diversity Search" >}}


Some forms of diversity sampling are already used in the industry and are known as [Maximum Margin Relevance](https://python.langchain.com/docs/integrations/vectorstores/qdrant#maximum-marginal-relevance-search-mmr) (MMR). Techniques like this were developed as a way to enhance similarity on a universal search API.
However, there is still room for improvement, particularly in terms of diversity retrieval.
By utilizing more advanced vector-native engines, it could be possible to take use-cases to the next level and achieve even better results.


## Recommendations

Vector similarity can go above a single query vector.
It can combine multiple positive and negative examples for a more accurate retrieval.
Building a recommendation API in a vector database can take an additional advantage of using already stored vectors as part of the queries, by specifying the point id.
The benefit of this is that no query-time neural network inference is required.

There are multiple ways to implement recommendation with vectors.

### Vector-Features Recommendations

First approach is to take all positive and negative examples and average them to create a single query vector.
In this technique, the larger components of positive vectors are canceled out by the negative ones, and the resulting vector is a combination of all the features that are present in the positive examples, but not in the negative ones.

{{< figure src=/articles_data/exploration-api/feature-based-recommendations.png caption="Vector-Features Based Recommendations" >}}

This approach is already implemented in Qdrant, and while it works great when the vectors are assumed to have each of their dimensions to represent some kind of feature of the data, sometimes distances are a better tool to judge negative and positive examples.

### Relative Distance Recommendations

Another approach is to use the distance between candidates and negative examples to make them create exclusion areas.
In this technique, we perform searches near the positive examples while excluding the points that are closer to a negative example than to a positive one.

{{< figure src=/articles_data/exploration-api/relative-distance-recommendations.png caption="Relative Distance Recommendations" >}}

## Discovery

In many exploration scenarios the desired destination is not known beforehand.
Search process in this case can consist of multiple steps, each step would provide a little more information.

To get more intuition about the possible ways to implement this approach, let’s take a look on how similarity modes are trained in the first place.

The most well-known loss function, used to train similarity models is a Triplet-loss.
In this loss the model is trained by fitting the information of relative similarity of 3 objects: the Anchor, Positive and Negative examples. 

{{< figure src=/articles_data/exploration-api/triplet-loss.png caption="Triplet Loss" >}}

Using the same mechanics, we can look at the training process from the other side.
We already have a trained model, the user can provide positive and negative example, and the goal of discovery process - to find suitable anchors across the stored collection of vectors.

<!-- ToDo: image where we know positive and nagative -->
<!-- {{< figure src=/articles_data/exploration-api/discovery.png caption="Discovery" >}} -->

Multiple positive-negative pairs can be provided to make discovery process more accurate.
Worth mentioning, that as well as in NN training, dataset may contain noise and some portion of contradictory information, so that discovery process should be tolerant to this kind of data imperfections. 


<!-- Image with multiple pairs -->
<!-- {{< figure src=/articles_data/exploration-api/discovery-noise.png caption="Discovery with noise" >}} -->


The important difference between recommendation method is that positive-negative pairs in discovery method doesn’t assume that final result should be close to positive, it only assumes that it should be closer than the negative one.

<!-- Image with difference -->
<!-- {{< figure src=/articles_data/exploration-api/discovery-difference.png caption="Discovery vs Recommendation" >}} -->

In combination with filtering or similarity search, the additional information from the pairs can be used as a re-ranking factor.

## The New API stack for Vector Databases

When you introduce a vector search capabilities into your text search engine, you extend its functionality.
However, it doesn't work the other way around, as the vector similarity as a concept is much broader than some task-specific implementation of full-text search.

Vector Databases, which introduce built-in full-text functionality must make a number of compromises: 

- Choose a specific full-text search variant.
- Either sacrifice the consistency of API, or limit the functionality of vector similarity to only basic kNN search.
- Introduce additional complexity to the system.


Qdrant, on the contrary, puts vector similarity in the center of it's API and architecture, that allows us to move towards the new stack of vector-native operations.
We believe that this is the future of vector databases, and we are excited to see what new use-cases will be unlocked by this technology.


## Conclusion

Vector similarity offer a range of powerful functions that go far beyond those available in traditional full-text search engines.
From dissimilarity search to diversity and recommendation, these methods can expand the cases in which vectors are useful. 

Vector Databases, that are designed to store and proceess immense amounts of vectors, are the first candidates to implement these new techniques and allow users to exploit their data at its fullest.
