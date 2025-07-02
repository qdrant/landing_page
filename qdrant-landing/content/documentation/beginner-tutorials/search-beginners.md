---
title: Semantic Search 101
weight: 1
aliases:
  - /documentation/tutorials/mighty.md/
  - /documentation/tutorials/search-beginners/
  - /articles/neural-search-tutorial/
---

# Build Your First Semantic Search Engine in 5 Minutes

| Time: 5 - 15 min | Level: Beginner |  |   |
| --- | ----------- | ----------- |----------- |

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/AASiqmtKo54" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></p>

## Overview

If you are new to vector databases, this tutorial is for you. In 5 minutes you will build a semantic search engine for science fiction books. After you set it up, you will ask the engine about an impending alien threat. Your creation will recommend books as preparation for a potential space attack.

Before you begin, you need to have a [recent version of Python](https://www.python.org/downloads/) installed. If you don't know how to run this code in a virtual environment, follow Python documentation for [Creating Virtual Environments](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments) first.

## What is neural search?

A regular full-text search, such as Google's, consists of searching for keywords inside a document.
For this reason, the algorithm can not take into account the real meaning of the query and documents.
Many documents that might be of interest to the user are not found because they use different wording.

Neural search tries to solve exactly this problem - it attempts to enable searches not by keywords but by meaning.
To achieve this, the search works in 2 steps.
In the first step, a specially trained neural network encoder converts the query and the searched objects into a vector representation called embeddings.
The encoder must be trained so that similar objects, such as texts with the same meaning or alike pictures get a close vector representation.

![Encoders and embedding space](/blog/neural-search/encoders.png)

Having this vector representation, it is easy to understand what the second step should be.
To find documents similar to the query you now just need to find the nearest vectors.
The most convenient way to determine the distance between two vectors is to calculate the cosine distance.
The usual Euclidean distance can also be used, but it is not so efficient due to [the curse of dimensionality](https://en.wikipedia.org/wiki/Curse_of_dimensionality).

## Which model could be used?

It is ideal to use a model specially trained to determine the closeness of meanings.
For example, models trained on Semantic Textual Similarity (STS) datasets.
Current state-of-the-art models can be found on this [leaderboard](https://paperswithcode.com/sota/semantic-textual-similarity-on-sts-benchmark?p=roberta-a-robustly-optimized-bert-pretraining).

However, not only specially trained models can be used.
If the model is trained on a large enough dataset, its internal features can work as embeddings too.
So, for instance, you can take any pre-trained on ImageNet model and cut off the last layer from it.
In the penultimate layer of the neural network, as a rule, the highest-level features are formed, which, however, do not correspond to specific classes.
The output of this layer can be used as an embedding.

## What tasks is neural search good for?

Neural search has the greatest advantage in areas where the query cannot be formulated precisely.
Querying a table in an SQL database is not the best place for neural search.

On the contrary, if the query itself is fuzzy, or it cannot be formulated as a set of conditions - neural search can help you.
If the search query is a picture, sound file or long text, neural network search is almost the only option.

If you want to build a recommendation system, the neural approach can also be useful.
The user's actions can be encoded in vector space in the same way as a picture or text.
And having those vectors, it is possible to find semantically similar users and determine the next probable user actions.

To be able to search for our descriptions in vector space, we must get vectors first.
We need to encode the descriptions into a vector representation.
As the descriptions are textual data, we can use a pre-trained language model.
As mentioned above, for the task of text search there is a whole set of pre-trained models specifically tuned for semantic similarity.

## Step-by-step neural search tutorial using Qdrant
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

Once the two main frameworks are defined, you need to specify the exact models this engine will use.

```python
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
```

The [Sentence Transformers](https://www.sbert.net/index.html) framework contains many embedding models. We'll take [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) as it has a good balance between speed and embedding quality for this tutorial.

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

Congratulations, you have just created your very first search engine! Trust us, the rest of Qdrant is not that complicated, either. For your next tutorial you should try building an actual [Neural Search Service with a complete API and a dataset](/documentation/tutorials/neural-search/).
