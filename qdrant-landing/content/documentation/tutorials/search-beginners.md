---
title: Semantic Search 101
weight: -100
aliases:
  - /documentation/tutorials/mighty.md/
---

# Semantic Search for Beginners

| Time: 5 - 15 min | Level: Beginner |  |   |
| --- | ----------- | ----------- |----------- |

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/AASiqmtKo54" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></p>

## Overview

If you are new to vector databases, this tutorial is for you. In 5 minutes you will build a semantic search engine for science fiction books. After you set it up, you will ask the engine about an impending alien threat. Your creation will recommend books as preparation for a potential space attack.

Before you begin, you need to have a [recent version of Python](https://www.python.org/downloads/) installed. If you don't know how to run this code in a virtual environment, follow Python documentation for [Creating Virtual Environments](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments) first.

This tutorial assumes you're in the bash shell. Use the Python documentation to activate a virtual environment, with commands such as:

```bash
source tutorial-env/bin/activate
``` 

## 1. Installation

You need to process your data so that the search engine can work with it. The [Sentence Transformers](https://www.sbert.net/) framework gives you access to common Large Language Models that turn raw data into embeddings.

```bash
pip install -U sentence-transformers
```

Once encoded, this data needs to be kept somewhere. Qdrant lets you store data as embeddings. You can also use Qdrant to run search queries against this data. This means that you can ask the engine to give you relevant answers that go way beyond keyword matching.

```bash
pip install -U qdrant-client
```

<aside role="status">
This tutorial requires qdrant-client version 1.7.1 or higher.
</aside>

### Import the models 

Once the two main frameworks are defined, you need to specify the exact models this engine will use. Before you do, activate the Python prompt (`>>>`) with the `python` command.

```python
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
```

The [Sentence Transformers](https://www.sbert.net/index.html) framework contains many embedding models. However, [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) is the fastest encoder for this tutorial.

```python
encoder = SentenceTransformer("all-MiniLM-L6-v2")
```

## 2. Add the dataset

[all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) will encode the data you provide. Here you will list all the science fiction books in your library. Each book has metadata, a name, author, publication year and a short description. 

```python
documents = [
    {
        "name": "The Time Machine",
        "description": "A man travels through time and witnesses the evolution of humanity.",
        "author": "H.G. Wells",
        "year": 1895,
    },
    {
        "name": "Ender's Game",
        "description": "A young boy is trained to become a military leader in a war against an alien race.",
        "author": "Orson Scott Card",
        "year": 1985,
    },
    {
        "name": "Brave New World",
        "description": "A dystopian society where people are genetically engineered and conditioned to conform to a strict social hierarchy.",
        "author": "Aldous Huxley",
        "year": 1932,
    },
    {
        "name": "The Hitchhiker's Guide to the Galaxy",
        "description": "A comedic science fiction series following the misadventures of an unwitting human and his alien friend.",
        "author": "Douglas Adams",
        "year": 1979,
    },
    {
        "name": "Dune",
        "description": "A desert planet is the site of political intrigue and power struggles.",
        "author": "Frank Herbert",
        "year": 1965,
    },
    {
        "name": "Foundation",
        "description": "A mathematician develops a science to predict the future of humanity and works to save civilization from collapse.",
        "author": "Isaac Asimov",
        "year": 1951,
    },
    {
        "name": "Snow Crash",
        "description": "A futuristic world where the internet has evolved into a virtual reality metaverse.",
        "author": "Neal Stephenson",
        "year": 1992,
    },
    {
        "name": "Neuromancer",
        "description": "A hacker is hired to pull off a near-impossible hack and gets pulled into a web of intrigue.",
        "author": "William Gibson",
        "year": 1984,
    },
    {
        "name": "The War of the Worlds",
        "description": "A Martian invasion of Earth throws humanity into chaos.",
        "author": "H.G. Wells",
        "year": 1898,
    },
    {
        "name": "The Hunger Games",
        "description": "A dystopian society where teenagers are forced to fight to the death in a televised spectacle.",
        "author": "Suzanne Collins",
        "year": 2008,
    },
    {
        "name": "The Andromeda Strain",
        "description": "A deadly virus from outer space threatens to wipe out humanity.",
        "author": "Michael Crichton",
        "year": 1969,
    },
    {
        "name": "The Left Hand of Darkness",
        "description": "A human ambassador is sent to a planet where the inhabitants are genderless and can change gender at will.",
        "author": "Ursula K. Le Guin",
        "year": 1969,
    },
    {
        "name": "The Three-Body Problem",
        "description": "Humans encounter an alien civilization that lives in a dying system.",
        "author": "Liu Cixin",
        "year": 2008,
    },
]
```

## 3. Define storage location

You need to tell Qdrant where to store embeddings. This is a basic demo, so your local computer will use its memory as temporary storage.

```python
client = QdrantClient(":memory:")
```

## 4. Create a collection

All data in Qdrant is organized by collections. In this case, you are storing books, so we are calling it `my_books`.

```python
client.create_collection(
    collection_name="my_books",
    vectors_config=models.VectorParams(
        size=encoder.get_sentence_embedding_dimension(),  # Vector size is defined by used model
        distance=models.Distance.COSINE,
    ),
)
```

- The `vector_size` parameter defines the size of the vectors for a specific collection. If their size is different, it is impossible to calculate the distance between them. 384 is the encoder output dimensionality. You can also use model.get_sentence_embedding_dimension() to get the dimensionality of the model you are using.

- The `distance` parameter lets you specify the function used to measure the distance between two points.


## 5. Upload data to collection

Tell the database to upload `documents` to the `my_books` collection. This will give each record an id and a payload. The payload is just the metadata from the dataset.

```python
client.upload_points(
    collection_name="my_books",
    points=[
        models.PointStruct(
            id=idx, vector=encoder.encode(doc["description"]).tolist(), payload=doc
        )
        for idx, doc in enumerate(documents)
    ],
)
```

## 6.  Ask the engine a question

Now that the data is stored in Qdrant, you can ask it questions and receive semantically relevant results.

```python
hits = client.query_points(
    collection_name="my_books",
    query=encoder.encode("alien invasion").tolist(),
    limit=3,
).points

for hit in hits:
    print(hit.payload, "score:", hit.score)
```

**Response:**

The search engine shows three of the most likely responses that have to do with the alien invasion. Each of the responses is assigned a score to show how close the response is to the original inquiry.

```text
{'name': 'The War of the Worlds', 'description': 'A Martian invasion of Earth throws humanity into chaos.', 'author': 'H.G. Wells', 'year': 1898} score: 0.570093257022374
{'name': "The Hitchhiker's Guide to the Galaxy", 'description': 'A comedic science fiction series following the misadventures of an unwitting human and his alien friend.', 'author': 'Douglas Adams', 'year': 1979} score: 0.5040468703143637
{'name': 'The Three-Body Problem', 'description': 'Humans encounter an alien civilization that lives in a dying system.', 'author': 'Liu Cixin', 'year': 2008} score: 0.45902943411768216
```

### Narrow down the query

How about the most recent book from the early 2000s?

```python
hits = client.query_points(
    collection_name="my_books",
    query=encoder.encode("alien invasion").tolist(),
    query_filter=models.Filter(
        must=[models.FieldCondition(key="year", range=models.Range(gte=2000))]
    ),
    limit=1,
).points

for hit in hits:
    print(hit.payload, "score:", hit.score)
```

**Response:**

The query has been narrowed down to one result from 2008. 

```text
{'name': 'The Three-Body Problem', 'description': 'Humans encounter an alien civilization that lives in a dying system.', 'author': 'Liu Cixin', 'year': 2008} score: 0.45902943411768216
```

## Next Steps

Congratulations, you have just created your very first search engine! Trust us, the rest of Qdrant is not that complicated, either. For your next tutorial you should try building an actual [Neural Search Service with a complete API and a dataset](../../tutorials/neural-search/).

## Return to the bash shell

To return to the bash prompt:

1. Press Ctrl+D to exit the Python prompt (`>>>`).
1. Enter the `deactivate` command to deactivate the virtual environment.
