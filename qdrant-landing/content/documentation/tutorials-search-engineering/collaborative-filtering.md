---
title: Collaborative Filtering
aliases:
  - /documentation/tutorials/collaborative-filtering/
  - /documentation/advanced-tutorials/collaborative-filtering/
short_description: "Build an effective movie recommendation system using collaborative filtering and Qdrant's similarity search."
description: "Build an effective movie recommendation system using collaborative filtering and Qdrant's similarity search." 
preview_image: /blog/collaborative-filtering/social_preview.png
social_preview_image: /blog/collaborative-filtering/social_preview.png
weight: 3
goal: Recommendations
stack:
  - Python
example_resources:
  - label: Open Notebook
    url: https://githubtocolab.com/qdrant/examples/blob/master/collaborative-filtering/collaborative-filtering.ipynb
---

# Build a Recommendation System with Collaborative Filtering using Qdrant

| Time: 45 min | Level: Intermediate | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/collaborative-filtering/collaborative-filtering.ipynb) |    |
|--------------|---------------------|--|----|

Every time Spotify recommends the next song from a band you've never heard of, it uses a recommendation algorithm based on other users' interactions with that song. This type of algorithm is known as **collaborative filtering**. 

Unlike content-based recommendations, collaborative filtering excels when the objects' semantics are loosely or unrelated to users' preferences. This adaptability is what makes it so fascinating. Movie, music, or book recommendations are good examples of such use cases. After all, we rarely choose which book to read purely based on the plot twists.

The traditional way to build a collaborative filtering engine involves training a model that converts the sparse matrix of user-to-item relations into a compressed, dense representation of user and item vectors. Some of the most commonly referenced algorithms for this purpose include [SVD (Singular Value Decomposition)](https://en.wikipedia.org/wiki/Singular_value_decomposition) and [Matrix Factorization](https://en.wikipedia.org/wiki/Matrix_factorization_(recommender_systems)). However, the model training approach requires significant resource investments. Model training necessitates data, regular re-training, and a mature infrastructure.

## Methodology

Fortunately, there is a way to build collaborative filtering systems without any model training. You can obtain interpretable recommendations and have a scalable system using a technique based on similarity search. Let’s explore how this works with an example of building a movie recommendation system.

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/9B7RrmQCQeQ?si=nHp-fM_szHynLcH8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

## Implementation

To implement this, you will use a simple yet powerful resource: [Qdrant with Sparse Vectors](https://qdrant.tech/articles/sparse-vectors/). 

Notebook: [You can try this code here](https://githubtocolab.com/qdrant/examples/blob/master/collaborative-filtering/collaborative-filtering.ipynb)


### Setup 

Before you start, you need:

- A Qdrant instance: a free [Qdrant Cloud](https://cloud.qdrant.io/) cluster or a local one. Set `QDRANT_HOST` and `QDRANT_API_KEY`.
- Python 3.10 or later, with these packages:

```bash
pip install qdrant-client pandas
```

You have to first import the necessary libraries and define the environment.

```python
import os
import pandas as pd
from qdrant_client import QdrantClient, models
from qdrant_client.models import PointStruct, SparseVector
from collections import defaultdict

# Collection name
collection_name = "movies"

# Set Qdrant Client
qdrant_client = QdrantClient(
    os.getenv("QDRANT_HOST"),
    api_key=os.getenv("QDRANT_API_KEY")
)
```

### Prepare the data

This tutorial uses the [MovieLens Small](https://files.grouplens.org/datasets/movielens/ml-latest-small.zip) dataset: about 100,000 ratings of 9,700 movies by 610 users. Download it and unpack it into a `data` folder:

```bash
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip && mv ml-latest-small data
```

Load the movie datasets. These include two main CSV files: user ratings and movie titles.

```python
# Load CSV files
ratings_df = pd.read_csv('data/ratings.csv', low_memory=False)
movies_df = pd.read_csv('data/movies.csv', low_memory=False)
# Convert movieId in ratings_df and movies_df to string
ratings_df['movieId'] = ratings_df['movieId'].astype(str)
movies_df['movieId'] = movies_df['movieId'].astype(str)

rating = ratings_df['rating']

# Normalize ratings
ratings_df['rating'] = (rating - rating.mean()) / rating.std()

# Merge ratings with movie metadata to get movie titles
merged_df = ratings_df.merge(
    movies_df[['movieId', 'title']],
    left_on='movieId', right_on='movieId', how='inner'
)

# Aggregate ratings to handle duplicate (userId, title) pairs
ratings_agg_df = merged_df.groupby(['userId', 'movieId']).rating.mean().reset_index()

ratings_agg_df.head()
```

|	|userId	    |movieId  |rating   |
|---|-----------|---------|---------|
|0	|1	        |1	      |0.429960 |
|1	|1	        |1036	  |1.369846 |
|2	|1	        |1049	  |-0.509926|
|3	|1	        |1066	  |0.429960 |
|4	|1	        |110	  |0.429960 |

### Convert to sparse

If you want to search across numerous reviews from different users, you can represent these reviews in a sparse matrix. 

```python
# Convert ratings to sparse vectors
user_sparse_vectors = defaultdict(lambda: {"values": [], "indices": []})
for row in ratings_agg_df.itertuples():
    user_sparse_vectors[row.userId]["values"].append(row.rating)
    user_sparse_vectors[row.userId]["indices"].append(int(row.movieId))
```

<link rel="stylesheet" href="/documentation/tutorials/collaborative-filtering/figures.css">

<figure class="collaborative-filtering-figure">
  <picture>
    <source media="(max-width: 600px)" srcset="/documentation/tutorials/collaborative-filtering/collaborative-filtering.mobile.svg" width="856" height="570">
    <img src="/documentation/tutorials/collaborative-filtering/collaborative-filtering.svg" alt="Illustrative user-by-movie matrix: rows are users, columns are movie IDs, filled cells are normalized ratings, and empty cells are movies the user has not rated." width="1480" height="570" loading="lazy">
  </picture>
  <picture class="collaborative-filtering-figure__dark">
    <source media="(max-width: 600px)" srcset="/documentation/tutorials/collaborative-filtering/collaborative-filtering.mobile.dark.svg" width="856" height="570">
    <img class="collaborative-filtering-figure__dark" src="/documentation/tutorials/collaborative-filtering/collaborative-filtering.dark.svg" alt="Illustrative user-by-movie matrix: rows are users, columns are movie IDs, filled cells are normalized ratings, and empty cells are movies the user has not rated." width="1480" height="570" loading="lazy">
  </picture>
</figure>

### Upload the data

Here, you will initialize the Qdrant client and create a new collection to store the data. 
Convert the user ratings to sparse vectors, one point per user.

```python
# Create a collection with one named sparse vector
qdrant_client.create_collection(
    collection_name=collection_name,
    vectors_config={},
    sparse_vectors_config={
        "ratings": models.SparseVectorParams()
    }
)

# Define a data generator
def data_generator():
    for user_id, sparse_vector in user_sparse_vectors.items():
        yield PointStruct(
            id=user_id,
            vector={"ratings": SparseVector(
                indices=sparse_vector["indices"],
                values=sparse_vector["values"]
            )},
            payload={"user_id": user_id}
        )

# Upload points using the data generator
qdrant_client.upload_points(
    collection_name=collection_name,
    points=data_generator()
)
```

### Define query

In order to get recommendations, we need to find users with similar tastes to ours.
Let's describe our preferences by providing ratings for some of our favorite movies.

`1` indicates that we like the movie, `-1` indicates that we dislike it.

```python
# Keys are MovieLens movieId values, the same IDs as in the uploaded vectors
my_ratings = {
    2571: 1,    # The Matrix
    68358: 1,   # Star Trek
    260: 1,     # Star Wars
    2288: -1,   # The Thing
    1: 1,       # Toy Story
    1721: -1,   # Titanic
    296: -1,    # Pulp Fiction
    356: 1,     # Forrest Gump
    4993: 1,    # Lord of the Rings
    2115: -1,   # Indiana Jones
    1036: -1    # Die Hard
}

```

<details>
<summary>Click to see the code for <code>to_vector</code> </summary>

```python
# Create sparse vector from my_ratings
def to_vector(ratings):
    vector = SparseVector(
        values=[],
        indices=[]
    )
    for movie_id, rating in ratings.items():
        vector.values.append(rating)
        vector.indices.append(movie_id)
    return vector
```

</details>


### Run the query

From the uploaded list of movies with ratings, we can perform a search in Qdrant to get the top most similar users to us.

```python
# Perform the search
results = qdrant_client.query_points(
    collection_name=collection_name,
    query=to_vector(my_ratings),
    using="ratings",
    with_vectors=True,  # return each similar user's ratings
    limit=20
).points
```

Now we can find the movies liked by the other similar users, but we haven't seen yet.
Let's combine the results from found users, filter out seen movies, and sort by the score.

Each similar user votes for the movies they rated: their likes push a movie up, their dislikes push it down.

```python
# Convert results to scores and sort by score
def results_to_scores(results, my_ratings):
    movie_scores = defaultdict(lambda: 0)
    for result in results:
        user_ratings = result.vector["ratings"]
        for movie_id, rating in zip(user_ratings.indices, user_ratings.values):
            if movie_id in my_ratings:
                continue  # skip movies you have already rated => seen
            movie_scores[movie_id] += result.score * rating
    return movie_scores

# Convert results to scores and sort by score
movie_scores = results_to_scores(results, my_ratings)
top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)

# Print the top 5 recommendations with their titles
titles = movies_df.set_index('movieId')['title']
for movie_id, score in top_movies[:5]:
    print(f"{titles[str(movie_id)]}, Score: {score:.2f}")
```

<details>

<summary>Optional: show movie posters in a Jupyter Notebook</summary>

To fetch posters, you need an [OMDB API key](https://www.omdbapi.com/apikey.aspx) (free tier) set as `OMDB_API_KEY`, and two more packages:

```bash
pip install requests ipython
```

OMDB looks movies up by IMDb ID, which MovieLens provides in `links.csv`:

```python
import requests
from IPython.display import display, HTML

omdb_api_key = os.getenv("OMDB_API_KEY")

links = pd.read_csv('data/links.csv')
# Format IMDb IDs the way OMDB expects them, for example tt0114709
links['imdbId'] = 'tt' + links['imdbId'].astype(str).str.zfill(7)

# Function to get movie poster using OMDB API
def get_movie_poster(imdb_id, api_key):
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={api_key}"
    data = requests.get(url).json()
    return data.get('Poster'), data

# Create HTML to display top 5 results
html_content = "<div class='movies-container'>"

for movie_id, score in top_movies[:5]:
    imdb_id_row = links.loc[links['movieId'] == int(movie_id), 'imdbId']
    if not imdb_id_row.empty:
        imdb_id = imdb_id_row.values[0]
        poster_url, movie_info = get_movie_poster(imdb_id, omdb_api_key)
        movie_title = movie_info.get('Title', 'Unknown Title')
        
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

</details>

## Recommendations

Running the code prints the top 5 recommendations:

```text
Star Wars: Episode VI - Return of the Jedi (1983), Score: 98.03
Star Wars: Episode V - The Empire Strikes Back (1980), Score: 97.58
Shawshank Redemption, The (1994), Score: 78.51
Dark Knight, The (2008), Score: 73.24
Lord of the Rings: The Return of the King, The (2003), Score: 70.92
```

Your list can differ slightly between runs: several users are equally similar to the query at the 20-result cutoff.

On top of collaborative filtering, we can further enhance the recommendation system by incorporating other features like user demographics, movie genres, or movie tags.

Or, for example, only consider recent ratings via a time-based filter. This way, we can recommend movies that are currently popular among users.

## Conclusion

As demonstrated, it is possible to build an interesting movie recommendation system without intensive model training using Qdrant and Sparse Vectors. This approach not only simplifies the recommendation process but also makes it scalable and interpretable. In future tutorials, we can experiment more with this combination to further enhance our recommendation systems.
