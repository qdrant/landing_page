---
title: "Creating Your First Collection"
short_description: "Install the Python client, connect to Qdrant, and create your first collection."
description: "Set up the Qdrant Python client, connect to your cluster, and create a collection with a vector size and distance metric."
weight: 4
isLesson: true
---

{{< date >}} Module 0 {{< /date >}}

# Creating Your First Collection

<!--
TODO (video): the previous embed here (_83L9ZIoOjM) is the Essentials-course
recording — the narration names "Day 0 of the Essentials course," which
contradicts this Beginner Course Module 0 page. Drop in a beginner-specific cut here,
or leave this commented out until one exists.
-->

In this lesson you'll prepare for vector search, one small step at a time. You'll install the Python client, connect to Qdrant, and create a collection to store vectors. Follow along in a notebook or script. In [Module 2's ingestion pipeline](/course/beginners/module-2/ingestion-pipeline/), you'll add data and run a filtered search.

A quick vocabulary note before you start: a **vector** is just a list of numbers that represents something (a piece of text, an image, a product). Searching by vectors means finding the entries whose numbers are closest to your query's numbers.

## Before You Start

This course requires Python 3.11 or above installed

## Step 1: Install the Qdrant Client

The **client** is the Python library that lets your code talk to Qdrant. Choose the installation command for your environment.

In a Jupyter/IPython notebook cell:

```python
%pip install qdrant-client
```

Or, in your terminal using the Python environment that will run your script:

```bash
python -m pip install qdrant-client
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

If completed correctly, you will now have an established Qdrant environment for the rest of the course. Later modules will explain collections, points, distance metrics, and more. Keep going to find out more!

 **Congratulations! You've completed Module 0.** 🎉
