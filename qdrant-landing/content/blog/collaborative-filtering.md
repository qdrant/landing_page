---
title: "Collaborative Filtering: Enhancing Recommendations Without Model Training"
draft: false
slug:  
short_description: "Build an effective movie recommendation system using collaborative filtering and Qdrant's similarity search."
description: "Build an effective movie recommendation system using collaborative filtering and Qdrant's similarity search." 
preview_image: /blog/collaborative-filtering/social_preview.png
social_preview_image: /blog/collaborative-filtering/social_preview.png
date: 2024-06-24T00:00:00-08:00
author: Daniel Romero
featured: false 
tags:
  - vector search
  - vector database
  - collaborative filtering
  - sparse vectors
  - recommendation systems
---

## Improving Recommendation Systems

Every time Spotify recommends the next song from a band you've never heard of, it uses a recommendation algorithm based on other users' interactions with that song. This type of algorithm is known as **collaborative filtering**. 

Unlike content-based recommendations, collaborative filtering excels when the objects' semantics are loosely or unrelated to users' preferences. This adaptability is what makes it so fascinating. Movie, music, or book recommendations are good examples of such use cases. After all, we rarely choose which book to read purely based on the plot twists.

**Traditional Collaborative Filtering:** The standard way to build a collaborative filtering engine involves training a model that converts the sparse matrix of user-to-item relations into a compressed, dense representation of user and item vectors. Some of the most commonly referenced algorithms for this purpose include [SVD (Singular Value Decomposition)](https://en.wikipedia.org/wiki/Singular_value_decomposition) and [Factorization Machines](https://en.wikipedia.org/wiki/Matrix_factorization_(recommender_systems)). However, the model training approach requires significant resource investments. Model training necessitates data, regular re-training, and a mature infrastructure.

*In this blog and video, we will walk you through how to use Qdrant as a collaborative filtering solution. You can also try the [notebook example](https://github.com/infoslack/qdrant-example/blob/main/sparse-vectors/collaborative-filtering.ipynb) for this implementation.*

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/infoslack/qdrant-example/blob/main/sparse-vectors/collaborative-filtering.ipynb)

### Collaborative Filtering Without Model Training

Fortunately, there is a way to build collaborative filtering systems without any model training. You can obtain interpretable recommendations and have a scalable system using a technique based on similarity search. Let’s explore how this works with an example of building a movie recommendation system.

<iframe width="560" height="315" src="https://www.youtube.com/embed/9B7RrmQCQeQ?si=nHp-fM_szHynLcH8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### Building a Movie Recommendation System

**Note:** *If you aren't familiar with the sparse method, read about Qdrant's [Sparse Vector Implementation](https://qdrant.tech/articles/sparse-vectors/).*

Imagine we want to build a movie recommendation system and have numerous reviews from different users. We can represent these reviews in a sparse matrix. 

```python
# Convert ratings to sparse vectors
user_sparse_vectors = defaultdict(lambda: {"values": [], "indices": []})
for row in ratings_agg_df.itertuples():
    user_sparse_vectors[row.userId]["values"].append(row.rating)
    user_sparse_vectors[row.userId]["indices"].append(int(row.movieId))
```

![collaborative-filtering](/blog/collaborative-filtering/collaborative-filtering.png)

If we have a list of movies we like and dislike, we can search for the top 20 users with the most similar tastes to ours. By doing this, we can discover the most liked movies that we haven't seen yet by looking at those users' review lists.

```python
# Perform the search
results = qdrant_client.search(
    collection_name=collection_name,
    query_vector=NamedSparseVector(
        name="ratings",
        vector=to_vector(my_ratings)
    ),
    limit=20
)

# Convert results to scores and sort by score
def results_to_scores(results):
    movie_scores = defaultdict(lambda: 0)
    for result in results:
        for movie_id in result.payload["movie_id"]:
            movie_scores[movie_id] += result.score
    return movie_scores

# Convert results to scores and sort by score
movie_scores = results_to_scores(results)
top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)
```

### Steps to Implement Similarity Search with Qdrant

To implement this, we use a simple yet powerful resource: [Qdrant with Sparse Vectors](https://qdrant.tech/articles/sparse-vectors/). Here’s a step-by-step outline of how we can achieve this:

[Follow along with out GitHub code example](https://github.com/infoslack/qdrant-example/blob/main/sparse-vectors/collaborative-filtering.ipynb)

1. **Import Libraries and Load Datasets**: We start by importing the necessary libraries and loading our datasets. These include three main CSV files: user ratings, movie titles, and IMDB IDs.

2. **Preprocess Data**: We load the CSV files and preprocess the data, which involves converting IDs to the appropriate format, normalizing ratings, and merging data frames to get movie titles. An extra function can fetch movie posters from the IMDB API to give a finishing touch.

3. **Initialize Qdrant Client**: We initialize the Qdrant client and create a new collection to store our data. We convert the user ratings to sparse vectors and include the movieId in the payload.

4. **Get Recommendations**: Now we can try to recommend something for ourselves. By using a list of movies with ratings, we perform a search in Qdrant to get the top recommendations, focusing on the most similar ones. We can filter the results to order by score and sort them to get the top 5 movies.

5. **Display Recommendations**: Finally, we display the top 5 recommended movies along with their posters and titles.

### Conclusion

As demonstrated, it is possible to build an interesting movie recommendation system without intensive model training using Qdrant and Sparse Vectors. This approach not only simplifies the recommendation process but also makes it scalable and interpretable. In future posts, we can experiment more with this combination to further enhance our recommendation systems.

Thank you for reading! If you found this article helpful, stay tuned for more insights into recommendation algorithms and their applications.