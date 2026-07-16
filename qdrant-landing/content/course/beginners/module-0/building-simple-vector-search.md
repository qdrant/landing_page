---
title: "Implementing a Basic Vector Search"
short_description: "Walk through your first vector search: connect to Qdrant, create a collection, insert points, and run similarity queries with the Python client."
description: Learn how to build a basic vector search in Qdrant. Create collections, insert vectors, and run your first similarity search step-by-step with Python. 
weight: 3
isLesson: true
---

{{< date >}} Module 0 {{< /date >}}

# Implementing a Basic Vector Search

<!--
TODO (video): the previous embed here (_83L9ZIoOjM) is the Essentials-course
recording — the narration names "Day 0 of the Essentials course," which
contradicts this Beginners Module 0 page. Drop in a beginner-specific cut here,
or leave this commented out until one exists.
-->

In this lesson you'll build your very first search, one small step at a time. You'll connect to Qdrant, create a place to store data, add a few example vectors, and then ask Qdrant to find the closest match. Every step has runnable code, so follow along in a notebook or script.

A quick vocabulary note before you start: a **vector** is just a list of numbers that represents something (a piece of text, an image, a product). Searching by vectors means finding the entries whose numbers are closest to your query's numbers. That's the whole idea, and the code below makes it concrete.

## Step 1: Install the Qdrant Client

The **client** is the Python library that lets your code talk to Qdrant. Install it first:

```python
!pip install qdrant-client
```

## Step 2: Import the Libraries You'll Need

Import two things from the package: `QdrantClient`, which opens the connection, and `models`, which holds the building blocks you'll use to describe collections and points.

```python
from qdrant_client import QdrantClient, models
```

## Step 3: Connect to Qdrant Cloud

Use the cluster URL and API key from the previous lesson. If you saved them in a `.env` file, this reads them automatically:

```python
import os

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))
```

**Tip:** For quick experiments with no cloud account at all, you can use `client = QdrantClient(":memory:")`. It runs entirely in memory, but your data disappears when the program stops.

## Step 4: Create a Collection

A [collection](/documentation/manage-data/collections/) is where your vectors live. It's a lot like a table in a regular database: a named container for related data. When you create one, you tell Qdrant two things:

- **Size:** how many numbers each vector has.
- **Distance metric:** how Qdrant measures whether two vectors are "close."

```python
# Name your collection
collection_name = "my_first_collection"

# Create it, describing the vectors it will hold
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=4,  # each vector has 4 numbers
        distance=models.Distance.COSINE  # how we measure closeness
    )
)
```

This returns `True` when it works.

**What's a distance metric?** It's the rule for deciding how similar two vectors are. Qdrant supports a few, and you can [read the full explanation in the collections documentation](/documentation/manage-data/collections/#distance-metrics):

- **Cosine:** compares the *direction* two vectors point, ignoring their length. This is the most common choice for text search, and the one you'll use here.
- **Euclidean:** the straight-line distance between two points.
- **Dot:** considers both direction and length.

## Step 5: Confirm the Collection Exists

Ask Qdrant for the list of collections to check that yours was created:

```python
collections = client.get_collections()
print("Existing collections:", collections)
```

## Step 6: Add Some Points

A [point](/documentation/manage-data/points/) is one entry in your collection. Each point has three parts:

- **ID:** a unique number or string to identify it.
- **Vector:** the list of numbers.
- **Payload:** optional extra information, such as a name or a category. This is what you'll filter and display later.

```python
points = [
    models.PointStruct(
        id=1,
        vector=[0.1, 0.2, 0.3, 0.4],
        payload={"category": "example"}
    ),
    models.PointStruct(
        id=2,
        vector=[0.2, 0.3, 0.4, 0.5],
        payload={"category": "demo"}
    )
]

client.upsert(
    collection_name=collection_name,
    points=points
)
```

When this finishes, you'll see a result with `status=<UpdateStatus.COMPLETED>`, which means your points are stored.

## Step 7: Check What You Stored

Have a look at the collection to confirm your points landed:

```python
collection_info = client.get_collection(collection_name)
print("Collection info:", collection_info)
```

You'll see `points_count=2` along with the vector settings and index details.

## Step 8: Run Your First Search

Now the payoff. You give Qdrant a **query vector**, and it returns the stored points closest to it. The closest match comes first, ranked by a similarity score:

```python
query_vector = [0.08, 0.14, 0.33, 0.28]

search_results = client.query_points(
    collection_name=collection_name,
    query=query_vector,
    limit=1  # return only the single closest match
)

print("Search results:", search_results)
```

You'll get back something like `points=[ScoredPoint(id=1, score=0.976..., payload={'category': 'example'})]`. The `score` is how close the match is — higher means more similar.

That's a complete vector search, start to finish. In the next lesson you'll take these same pieces and build a small project of your own.
