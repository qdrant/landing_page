---
notebook_path: 101-foundations/sparse-vectors-movies-reco/recommend-movies.ipynb
reading_time_min: 7
title: Movie recommendation system with Qdrant space vectors
---

# Movie recommendation system with Qdrant space vectors

This notebook is a simple example of how to use Qdrant to build a movie recommendation system.
We will use the MovieLens dataset and Qdrant to build a simple recommendation system.

## How it works

MovieLens dataset contains a list of movies and ratings given by users. We will use this data to build a recommendation system.

Our recommendation system will use an approach called **collaborative filtering**.

The idea behind collaborative filtering is that if two users have similar tastes, then they will like similar movies.
We will use this idea to find the most similar users to our own ratings and see what movies these similar users liked, which we haven't seen yet.

1. We will represent each user's ratings as a vector in a sparse high-dimensional space.
1. We will use Qdrant to index these vectors.
1. We will use Qdrant to find the most similar users to our own ratings.
1. We will see what movies these similar users liked, which we haven't seen yet.

```python
!pip install qdrant-client pandas
```

<hr />

```python
# Download and unzip the dataset

!mkdir -p data
!wget https://files.grouplens.org/datasets/movielens/ml-1m.zip
!unzip ml-1m.zip -d data
```

<hr />

```python
from qdrant_client import QdrantClient, models
import pandas as pd
```

<hr />

```python
users = pd.read_csv(
    "./data/ml-1m/users.dat",
    sep="::",
    names=["user_id", "gender", "age", "occupation", "zip"],
    engine="python",
)
users
```

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>user_id</th>
      <th>gender</th>
      <th>age</th>
      <th>occupation</th>
      <th>zip</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>F</td>
      <td>1</td>
      <td>10</td>
      <td>48067</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2</td>
      <td>M</td>
      <td>56</td>
      <td>16</td>
      <td>70072</td>
    </tr>
    <tr>
      <th>2</th>
      <td>3</td>
      <td>M</td>
      <td>25</td>
      <td>15</td>
      <td>55117</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4</td>
      <td>M</td>
      <td>45</td>
      <td>7</td>
      <td>02460</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5</td>
      <td>M</td>
      <td>25</td>
      <td>20</td>
      <td>55455</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>6035</th>
      <td>6036</td>
      <td>F</td>
      <td>25</td>
      <td>15</td>
      <td>32603</td>
    </tr>
    <tr>
      <th>6036</th>
      <td>6037</td>
      <td>F</td>
      <td>45</td>
      <td>1</td>
      <td>76006</td>
    </tr>
    <tr>
      <th>6037</th>
      <td>6038</td>
      <td>F</td>
      <td>56</td>
      <td>1</td>
      <td>14706</td>
    </tr>
    <tr>
      <th>6038</th>
      <td>6039</td>
      <td>F</td>
      <td>45</td>
      <td>0</td>
      <td>01060</td>
    </tr>
    <tr>
      <th>6039</th>
      <td>6040</td>
      <td>M</td>
      <td>25</td>
      <td>6</td>
      <td>11106</td>
    </tr>
  </tbody>
</table>
<p>6040 rows × 5 columns</p>
</div>

```python
movies = pd.read_csv(
    "./data/ml-1m/movies.dat",
    sep="::",
    names=["movie_id", "title", "genres"],
    engine="python",
    encoding="latin-1",
)
movies
```

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>movie_id</th>
      <th>title</th>
      <th>genres</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>Toy Story (1995)</td>
      <td>Animation|Children's|Comedy</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2</td>
      <td>Jumanji (1995)</td>
      <td>Adventure|Children's|Fantasy</td>
    </tr>
    <tr>
      <th>2</th>
      <td>3</td>
      <td>Grumpier Old Men (1995)</td>
      <td>Comedy|Romance</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4</td>
      <td>Waiting to Exhale (1995)</td>
      <td>Comedy|Drama</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5</td>
      <td>Father of the Bride Part II (1995)</td>
      <td>Comedy</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>3878</th>
      <td>3948</td>
      <td>Meet the Parents (2000)</td>
      <td>Comedy</td>
    </tr>
    <tr>
      <th>3879</th>
      <td>3949</td>
      <td>Requiem for a Dream (2000)</td>
      <td>Drama</td>
    </tr>
    <tr>
      <th>3880</th>
      <td>3950</td>
      <td>Tigerland (2000)</td>
      <td>Drama</td>
    </tr>
    <tr>
      <th>3881</th>
      <td>3951</td>
      <td>Two Family House (2000)</td>
      <td>Drama</td>
    </tr>
    <tr>
      <th>3882</th>
      <td>3952</td>
      <td>Contender, The (2000)</td>
      <td>Drama|Thriller</td>
    </tr>
  </tbody>
</table>
<p>3883 rows × 3 columns</p>
</div>

```python
ratings = pd.read_csv(
    "./data/ml-1m/ratings.dat",
    sep="::",
    names=["user_id", "movie_id", "rating", "timestamp"],
    engine="python",
)
```

<hr />

```python
# Normalize ratings

# Sparse vectors can use advantage of negative values, so we can normalize ratings to have mean 0 and std 1
# In this scenario we can take into account movies that we don't like

ratings.rating = (ratings.rating - ratings.rating.mean()) / ratings.rating.std()
```

<hr />

```python
# Convert ratings to sparse vectors

from collections import defaultdict

user_sparse_vectors = defaultdict(lambda: {"values": [], "indices": []})

for row in ratings.itertuples():
    user_sparse_vectors[row.user_id]["values"].append(row.rating)
    user_sparse_vectors[row.user_id]["indices"].append(row.movie_id)
```

<hr />

```python
# For this small dataset we can use in-memory Qdrant
# But for production we recommend to use server-based version

qdrant = QdrantClient(":memory:")  # or QdrantClient("http://localhost:6333")
```

<hr />

```python
# Create collection with configured sparse vectors
# Sparse vectors don't require to specify dimension, because it's extracted from the data automatically

qdrant.create_collection(
    "movielens",
    vectors_config={},
    sparse_vectors_config={"ratings": models.SparseVectorParams()},
)
```

```
True
```

```python
# Upload all user's votes as sparse vectors


def data_generator():
    for user in users.itertuples():
        yield models.PointStruct(
            id=user.user_id,
            vector={"ratings": user_sparse_vectors[user.user_id]},
            payload=user._asdict(),
        )


# This will do lazy upload of the data
qdrant.upload_points("movielens", data_generator())
```

<hr />

```python
# Let's try to recommend something for ourselves

#  1 - like
# -1 - dislike

# Search with
# movies[movies.title.str.contains("Matrix", case=False)]

my_ratings = {
    2571: 1,  # Matrix
    329: 1,  # Star Trek
    260: 1,  # Star Wars
    2288: -1,  # The Thing
    1: 1,  # Toy Story
    1721: -1,  # Titanic
    296: -1,  # Pulp Fiction
    356: 1,  # Forrest Gump
    2116: 1,  # Lord of the Rings
    1291: -1,  # Indiana Jones
    1036: -1,  # Die Hard
}

inverse_ratings = {k: -v for k, v in my_ratings.items()}


def to_vector(ratings):
    vector = models.SparseVector(values=[], indices=[])
    for movie_id, rating in ratings.items():
        vector.values.append(rating)
        vector.indices.append(movie_id)
    return vector
```

<hr />

```python
# Find users with similar taste

results = qdrant.search(
    "movielens",
    query_vector=models.NamedSparseVector(name="ratings", vector=to_vector(my_ratings)),
    with_vectors=True,  # We will use those to find new movies
    limit=20,
)
```

<hr />

```python
# Calculate how frequently each movie is found in similar users' ratings


def results_to_scores(results):
    movie_scores = defaultdict(lambda: 0)

    for user in results:
        user_scores = user.vector["ratings"]
        for idx, rating in zip(user_scores.indices, user_scores.values):
            if idx in my_ratings:
                continue
            movie_scores[idx] += rating

    return movie_scores
```

<hr />

```python
# Sort movies by score and print top 5

movie_scores = results_to_scores(results)
top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)

for movie_id, score in top_movies[:5]:
    print(movies[movies.movie_id == movie_id].title.values[0], score)
```

```
Star Wars: Episode V - The Empire Strikes Back (1980) 20.023877887283938
Star Wars: Episode VI - Return of the Jedi (1983) 16.44318377549194
Princess Bride, The (1987) 15.84006760423755
Raiders of the Lost Ark (1981) 14.94489407628955
Sixth Sense, The (1999) 14.570321651488953
```

```python
# Find users with similar taste, but only within my age group
# We can also filter by other fields, like `gender`, `occupation`, etc.

results = qdrant.search(
    "movielens",
    query_vector=models.NamedSparseVector(name="ratings", vector=to_vector(my_ratings)),
    query_filter=models.Filter(
        must=[models.FieldCondition(key="age", match=models.MatchValue(value=25))]
    ),
    with_vectors=True,
    limit=20,
)

movie_scores = results_to_scores(results)
top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)

for movie_id, score in top_movies[:5]:
    print(movies[movies.movie_id == movie_id].title.values[0], score)
```

```
Princess Bride, The (1987) 16.214640029038147
Star Wars: Episode V - The Empire Strikes Back (1980) 14.652836719595939
Blade Runner (1982) 13.52911944519415
Usual Suspects, The (1995) 13.446604377087162
Godfather, The (1972) 13.300575698740357
```
