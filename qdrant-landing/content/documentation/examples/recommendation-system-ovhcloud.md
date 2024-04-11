---
title: Movie Recommendation System
weight: 34
aliases:
  - /documentation/tutorials/recommendation-system-ovhcloud/
---

# Build a Movie Recommendation System

| Time: 120 min | Level: Advanced | Output: [GitHub](https://github.com/infoslack/qdrant-example/blob/main/HC-demo/HC-OVH.ipynb) |
| --- | ----------- | ----------- |----------- |

This notebook aims to create a recommendation system using the MovieLens dataset and Qdrant. Vector databases like Qdrant are crucial for storing high-dimensional data, such as user and item embeddings, enabling personalized recommendations by quickly retrieving similar users or items based on advanced indexing techniques. We'll leverage collaborative filtering with a MovieLens dataset, identifying similar users based on ratings represented as vectors in Qdrant, and suggesting movies they liked but we haven't seen yet. The suggested items or content should closely align with the user's interests, leading to more personalized and relevant recommendations.

Collaborative filtering works on the principle that users with similar tastes will enjoy similar movies. To implement this, we'll represent each user's ratings as vectors in a high-dimensional space using Qdrant. By indexing these vectors, we can find users with similar tastes to ours and recommend movies they liked but we haven't seen yet.

## Components

- **Dataset:** [Red Hat Interactive Learning Portal](https://developers.redhat.com/learn)
- **Vector DB:** [Qdrant Hybrid Cloud](https://qdrant.tech) running on OpenShift.
- **Web Host:** [OVHcloud](https://haystack.deepset.ai/) 

## Prerequisites

First, download and unzip the MovieLens dataset into a local directory.

```bash 
mkdir -p data
wget https://files.grouplens.org/datasets/movielens/ml-1m.zip
unzip ml-1m.zip -d data
```

The necessary Python libraries are installed using `pip`, including `pandas` for data manipulation, `qdrant-client` for interfacing with Qdrant, and `python-dotenv` for managing environment variables.

```python
!pip install -U  \
    pandas  \
    qdrant-client \
    python-dotenv
```

The `.env` file is used to store sensitive information like the Qdrant host URL and API key securely.

```bash
QDRANT_HOST
QDRANT_API_KEY
```
Load all environment variables into the setup.

```python
import os
from dotenv import load_dotenv
load_dotenv('./.env')
```

## Implementation

Load the user, movie, and rating data from the MovieLens dataset into pandas DataFrames to facilitate data manipulation and analysis.

```python
from qdrant_client import QdrantClient, models
import pandas as pd
```

```python
# load users
users = pd.read_csv('data/ml-1m/users.dat', sep='::', names=['user_id', 'gender', 'age', 'occupation', 'zip'], engine='python')
users.head()
```

```python
# load movies
movies = pd.read_csv('data/ml-1m/movies.dat', sep='::', names=['movie_id', 'title', 'genres'], engine='python', encoding='latin-1')
movies.head()
```

```python
#load ratings
ratings = pd.read_csv( 'data/ml-1m/ratings.dat', sep='::', names=['user_id', 'movie_id', 'rating', 'timestamp'], engine='python')
ratings.head()
```

**Normalize ratings**

Sparse vectors can use advantage of negative values, so we can normalize ratings to have a mean of 0 and a standard deviation of 1
This normalization ensures that ratings are consistent and centered around zero, enabling accurate similarity calculations.
In this scenario we can take into account movies that we don't like.

```python
ratings.rating = (ratings.rating - ratings.rating.mean()) / ratings.rating.std()
```

```python
ratings.head()
```

## Preparing the data and creating a collection

Transform user ratings into sparse vectors, where each vector represents ratings for different movies. This step prepares the data for indexing in Qdrant.

First, create a collection with configured sparse vectors
- Sparse vectors don't require to specify dimension, because it's extracted from the data automatically

> An explanation of using hybrid cloud with OVH can be inserted here!

```python
# Convert ratings to sparse vectors

from collections import defaultdict

user_sparse_vectors = defaultdict(lambda: {"values": [], "indices": []})

for row in ratings.itertuples():
    user_sparse_vectors[row.user_id]["values"].append(row.rating)
    user_sparse_vectors[row.user_id]["indices"].append(row.movie_id)
```
```python
client = QdrantClient(
    url = os.getenv("QDRANT_HOST"),
    api_key = os.getenv("QDRANT_API_KEY")
)

client.create_collection(
    "movielens",
    vectors_config={},
    sparse_vectors_config={
        "ratings": models.SparseVectorParams()
    }
)
```

Upload user ratings to the "movielens" collection in Qdrant as sparse vectors, along with user metadata. This step populates the database with the necessary data for recommendation generation.

```python
def data_generator():
    for user in users.itertuples():
        yield models.PointStruct(
            id=user.user_id,
            vector={
                "ratings": user_sparse_vectors[user.user_id]
            },
            payload=user._asdict()
        )

client.upload_points(
    "movielens",
    data_generator()
)
```

## Running the Recommendation System

Personal movie ratings are specified, where positive ratings indicate likes and negative ratings indicate dislikes. These ratings serve as the basis for finding similar users with comparable tastes.

Personal ratings are converted into a sparse vector representation suitable for querying Qdrant. This vector represents the user's preferences across different movies.

Let's try to recommend something for ourselves:

1 = Like
-1 = dislike

Search with movies[movies.title.str.contains("Matrix", case=False)]

```python
my_ratings = { 
    2571: 1,  # Matrix
    329: 1,   # Star Trek
    260: 1,   # Star Wars
    2288: -1, # The Thing
    1: 1,     # Toy Story
    1721: -1, # Titanic
    296: -1,  # Pulp Fiction
    356: 1,   # Forrest Gump
    2116: 1,  # Lord of the Rings
    1291: -1, # Indiana Jones
    1036: -1  # Die Hard
}

inverse_ratings = {k: -v for k, v in my_ratings.items()}

def to_vector(ratings):
    vector = models.SparseVector(
        values=[],
        indices=[]
    )
    for movie_id, rating in ratings.items():
        vector.values.append(rating)
        vector.indices.append(movie_id)
    return vector
```

Query Qdrant to find users with similar tastes based on the provided personal ratings. The search returns a list of similar users along with their ratings, facilitating collaborative filtering.

```python
results = client.search(
    "movielens",
    query_vector=models.NamedSparseVector(
        name="ratings",
        vector=to_vector(my_ratings)
    ),
    with_vectors=True, # We will use those to find new movies
    limit=20
)
```

Movie scores are computed based on how frequently each movie appears in the ratings of similar users, weighted by their ratings. This step identifies popular movies among users with similar tastes. Calculate how frequently each movie is found in similar users' ratings

```python
def results_to_scores(results):
    movie_scores = defaultdict(lambda: 0)

    for user in results:
        user_scores = user.vector['ratings']
        for idx, rating in zip(user_scores.indices, user_scores.values):
            if idx in my_ratings:
                continue
            movie_scores[idx] += rating

    return movie_scores
```

The top-rated movies are sorted based on their scores and printed as recommendations for the user. These recommendations are tailored to the user's preferences and aligned with their tastes. Sort movies by score and print top five:

```python
movie_scores = results_to_scores(results)
top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)

for movie_id, score in top_movies[:5]:
    print(movies[movies.movie_id == movie_id].title.values[0], score)
```

## Result

```bash
Star Wars: Episode V - The Empire Strikes Back (1980) 20.02387858
Star Wars: Episode VI - Return of the Jedi (1983) 16.443184379999998
Princess Bride, The (1987) 15.840068229999996
Raiders of the Lost Ark (1981) 14.94489462
Sixth Sense, The (1999) 14.570322149999999
```