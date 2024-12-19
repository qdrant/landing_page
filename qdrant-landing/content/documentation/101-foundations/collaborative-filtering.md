---
notebook_path: 101-foundations/collaborative-filtering/collaborative-filtering.ipynb
reading_time_min: 5
title: Collaborative filtering system for movie recommendations
---

# Collaborative filtering system for movie recommendations

```python
import os
import pandas as pd
import requests
from IPython.display import display, HTML
from qdrant_client import models, QdrantClient
from qdrant_client.http.models import PointStruct, SparseVector, NamedSparseVector
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

# OMDB API Key
omdb_api_key = os.getenv("OMDB_API_KEY")

# Collection name
collection_name = "movies"

# Set Qdrant Client
qdrant_client = QdrantClient(
    os.getenv("QDRANT_HOST"), api_key=os.getenv("QDRANT_API_KEY")
)
```

<hr />

```python
# Function to get movie poster using OMDB API
def get_movie_poster(imdb_id, api_key):
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data.get("Poster", "No Poster Found"), data
    return "No Poster Found"
```

## Preparing the data

For experimental purposes, the dataset used in this example was [Movielens](https://files.grouplens.org/datasets/movielens/ml-latest.zip), with approximately 33,000,000 ratings and 86,000 movies.

But you can reproduce it with a smaller dataset if you wish; below are two alternatives:

- [Movielens Small](https://files.grouplens.org/datasets/movielens/ml-latest-small.zip)
- [The Movies Dataset from Kaggle](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset/)

```python
# Load CSV files
ratings_df = pd.read_csv("data/ratings.csv", low_memory=False)
movies_df = pd.read_csv("data/movies.csv", low_memory=False)
links = pd.read_csv("data/links.csv")

# Convert movieId in ratings_df and movies_df to string
ratings_df["movieId"] = ratings_df["movieId"].astype(str)
movies_df["movieId"] = movies_df["movieId"].astype(str)

# Add step to convert imdbId to tt format with leading zeros
links["imdbId"] = "tt" + links["imdbId"].astype(str).str.zfill(7)

# Normalize ratings
ratings_df["rating"] = (
    ratings_df["rating"] - ratings_df["rating"].mean()
) / ratings_df["rating"].std()

# Merge ratings with movie metadata to get movie titles
merged_df = ratings_df.merge(
    movies_df[["movieId", "title"]], left_on="movieId", right_on="movieId", how="inner"
)

# Aggregate ratings to handle duplicate (userId, title) pairs
ratings_agg_df = merged_df.groupby(["userId", "movieId"]).rating.mean().reset_index()
```

<hr />

```python
ratings_agg_df.head()
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
      <th>userId</th>
      <th>movieId</th>
      <th>rating</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>1</td>
      <td>0.429960</td>
    </tr>
    <tr>
      <th>1</th>
      <td>1</td>
      <td>1036</td>
      <td>1.369846</td>
    </tr>
    <tr>
      <th>2</th>
      <td>1</td>
      <td>1049</td>
      <td>-0.509926</td>
    </tr>
    <tr>
      <th>3</th>
      <td>1</td>
      <td>1066</td>
      <td>0.429960</td>
    </tr>
    <tr>
      <th>4</th>
      <td>1</td>
      <td>110</td>
      <td>0.429960</td>
    </tr>
  </tbody>
</table>
</div>

## Create a new Qdrant collection and send the data

```python
# Create a new Qdrant collection
qdrant_client.create_collection(
    collection_name=collection_name,
    vectors_config={},
    sparse_vectors_config={"ratings": models.SparseVectorParams()},
)
```

<hr />

```python
# Convert ratings to sparse vectors
user_sparse_vectors = defaultdict(lambda: {"values": [], "indices": []})
for row in ratings_agg_df.itertuples():
    user_sparse_vectors[row.userId]["values"].append(row.rating)
    user_sparse_vectors[row.userId]["indices"].append(int(row.movieId))


# Define a data generator
def data_generator():
    for user_id, sparse_vector in user_sparse_vectors.items():
        yield PointStruct(
            id=user_id,
            vector={
                "ratings": SparseVector(
                    indices=sparse_vector["indices"], values=sparse_vector["values"]
                )
            },
            payload={"user_id": user_id, "movie_id": sparse_vector["indices"]},
        )


# Upload points using the data generator
qdrant_client.upload_points(collection_name=collection_name, points=data_generator())
```

## Making a recommendation

```python
my_ratings = {
    603: 1,  # Matrix
    13475: 1,  # Star Trek
    11: 1,  # Star Wars
    1091: -1,  # The Thing
    862: 1,  # Toy Story
    597: -1,  # Titanic
    680: -1,  # Pulp Fiction
    13: 1,  # Forrest Gump
    120: 1,  # Lord of the Rings
    87: -1,  # Indiana Jones
    562: -1,  # Die Hard
}
```

<hr />

```python
# Create sparse vector from my_ratings
def to_vector(ratings):
    vector = SparseVector(values=[], indices=[])
    for movie_id, rating in ratings.items():
        vector.values.append(rating)
        vector.indices.append(movie_id)
    return vector
```

<hr />

```python
# Perform the search
results = qdrant_client.search(
    collection_name=collection_name,
    query_vector=NamedSparseVector(name="ratings", vector=to_vector(my_ratings)),
    limit=20,
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

<hr />

```python
# Create HTML to display top 5 results
html_content = "<div class='movies-container'>"

for movie_id, score in top_movies[:5]:
    imdb_id_row = links.loc[links["movieId"] == int(movie_id), "imdbId"]
    if not imdb_id_row.empty:
        imdb_id = imdb_id_row.values[0]
        poster_url, movie_info = get_movie_poster(imdb_id, omdb_api_key)
        movie_title = movie_info.get("Title", "Unknown Title")

        html_content += f"""
        <div class='movie-card'>
            <img src="{poster_url}" alt="Poster" class="movie-poster">
            <div class="movie-title">{movie_title}</div>
            <div class="movie-score">Score: {score}</div>
        </div>
        """
    else:
        continue  # Skip if imdb_id is not found

html_content += "</div>"

display(HTML(html_content))
```

<div class='movies-container'>
        <div class='movie-card'>
            <img src="https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg" alt="Poster" class="movie-poster">
            <div class="movie-title">Toy Story</div>
            <div class="movie-score">Score: 131.2033799</div>
        </div>

```
    <div class='movie-card'>
        <img src="https://m.media-amazon.com/images/M/MV5BN2IyNTE4YzUtZWU0Mi00MGIwLTgyMmQtMzQ4YzQxYWNlYWE2XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg" alt="Poster" class="movie-poster">
        <div class="movie-title">Monty Python and the Holy Grail</div>
        <div class="movie-score">Score: 131.2033799</div>
    </div>

    <div class='movie-card'>
        <img src="https://m.media-amazon.com/images/M/MV5BYmU1NDRjNDgtMzhiMi00NjZmLTg5NGItZDNiZjU5NTU4OTE0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg" alt="Poster" class="movie-poster">
        <div class="movie-title">Star Wars: Episode V - The Empire Strikes Back</div>
        <div class="movie-score">Score: 131.2033799</div>
    </div>

    <div class='movie-card'>
        <img src="https://m.media-amazon.com/images/M/MV5BOWZlMjFiYzgtMTUzNC00Y2IzLTk1NTMtZmNhMTczNTk0ODk1XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg" alt="Poster" class="movie-poster">
        <div class="movie-title">Star Wars: Episode VI - Return of the Jedi</div>
        <div class="movie-score">Score: 131.2033799</div>
    </div>

    <div class='movie-card'>
        <img src="https://m.media-amazon.com/images/M/MV5BOTlhYTVkMDktYzIyNC00NzlkLTlmN2ItOGEyMWQ4OTA2NDdmXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg" alt="Poster" class="movie-poster">
        <div class="movie-title">Men in Black</div>
        <div class="movie-score">Score: 131.2033799</div>
    </div>
    </div>
```

```python

```
