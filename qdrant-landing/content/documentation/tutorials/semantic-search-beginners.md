---
title: Semantic Search for Beginners
weight: 1
---

# Semantic Search for Beginners

| Time: 5 - 15 min | Level: Beginner | Output: [GitHub]() | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)]()   |
| --- | ----------- | ----------- |----------- |

<center><iframe src="https://www.youtube.com/embed/hFc7xv1tsos" width="900" height="500" title="Semantic Search for Beginners" frameborder="0" allowfullscreen></iframe></center>

If you are new to vector databases, this tutorial is for you. In 5 minutes you will build a semantic search engine for science fiction books. After you set it up, you will ask the engine about an impending alien threat. Your creation will recommend books as preparation for a potential space attack.

Before you begin, you need to have a [recent version of Python](https://www.python.org/downloads/) installed. If you don't know how to run this code in a virtual environment, follow [this tutorial](https://towardsdatascience.com/creating-and-using-virtual-environment-on-jupyter-notebook-with-python-db3f5afdd56a) first.

## 1. Installation

You need to process your data so that the search engine can work with it. The [Sentence Transformers] framework gives you access to common [Large Language Models] that turn raw data into embeddings.
```python
pip install -U sentence-transformers
```

Once encoded, this data needs to be kept somewhere. Qdrant lets you store data as embeddings. You can also use Qdrant to run search queries against this data. This means that you can ask the engine to give you relevant answers that go way beyond keyword matching.
```python
pip install qdrant-client
```

### Import the models 

Once the two main frameworks are defined, you need to specify the exact models this engine will use. 
```python
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
```

The [Sentence Transformers] framework contains many Large Language Models. However, [all-MiniLM-L6-v2] is the fastest encoder for this tutorial.
```python
encoder = SentenceTransformer('all-MiniLM-L6-v2') 
```

## 2. Add the dataset

[all-MiniLM-L6-v2] will encode the data you provide. Here you will list all the science fiction books in your library. Each book has metadata, a name, author, publication year and a short description. 

```python
documents = [
{ "name": "The Time Machine", "description": "A man travels through time and witnesses the evolution of humanity.", "author": "H.G. Wells", "year": 1895 },
{ "name": "Ender's Game", "description": "A young boy is trained to become a military leader in a war against an alien race.", "author": "Orson Scott Card", "year": 1985 },
{ "name": "Brave New World", "description": "A dystopian society where people are genetically engineered and conditioned to conform to a strict social hierarchy.", "author": "Aldous Huxley", "year": 1932 },
{ "name": "The Hitchhiker's Guide to the Galaxy", "description": "A comedic science fiction series following the misadventures of an unwitting human and his alien friend.", "author": "Douglas Adams", "year": 1979 },
{ "name": "Dune", "description": "A desert planet is the site of political intrigue and power struggles.", "author": "Frank Herbert", "year": 1965 },
{ "name": "Foundation", "description": "A mathematician develops a science to predict the future of humanity and works to save civilization from collapse.", "author": "Isaac Asimov", "year": 1951 },
{ "name": "Snow Crash", "description": "A futuristic world where the internet has evolved into a virtual reality metaverse.", "author": "Neal Stephenson", "year": 1992 },
{ "name": "Neuromancer", "description": "A hacker is hired to pull off a near-impossible hack and gets pulled into a web of intrigue.", "author": "William Gibson", "year": 1984 },
{ "name": "The War of the Worlds", "description": "A Martian invasion of Earth throws humanity into chaos.", "author": "H.G. Wells", "year": 1898 },
{ "name": "The Hunger Games", "description": "A dystopian society where teenagers are forced to fight to the death in a televised spectacle.", "author": "Suzanne Collins", "year": 2008 },
{ "name": "The Andromeda Strain", "description": "A deadly virus from outer space threatens to wipe out humanity.", "author": "Michael Crichton", "year": 1969 },
{ "name": "The Left Hand of Darkness", "description": "A human ambassador is sent to a planet where the inhabitants are genderless and can change gender at will.", "author": "Ursula K. Le Guin", "year": 1969 },
{ "name": "The Three-Body Problem", "description": "Humans encounter an alien civilization that lives in a dying system.", "author": "Liu Cixin", "year": 2008 }
]
```

## 3. Define storage location

You need to tell Qdrant where to store embeddings. This is a basic demo, so your local computer will use its memory as temporary storage.

```python
qdrant = QdrantClient(":memory:") 
```

## 5. Create a collection

All data in Qdrant is organized by collections. In this case, you are storing books, so we are calling it `my_books`.

```python
qdrant.recreate_collection(
	collection_name="my_books",
	vectors_config=models.VectorParams(
		size=encoder.get_sentence_embedding_dimension(), # Vector size is defined by used model
		distance=models.Distance.COSINE
	)
)
```

### Upload data to collection

Tell the database to upload `documents` to the `my_books` collection. This will give each record an id and a payload. The payload is just the metadata from the dataset.

```python
qdrant.upload_records(
	collection_name="my_books",
	records=[
		models.Record(
			id=idx,
			vector=encoder.encode(doc["description"]).tolist(),
			payload=doc
		) for idx, doc in enumerate(documents)
	]
)
```

## 6.  Ask the engine a question

Now that the data is stored in Qdrant, you can ask it questions and receive semantically relevant results.

```python
hits = qdrant.search(
	collection_name="my_books",
	query_vector=encoder.encode("alien invasion").tolist(),
	limit=3
)
for hit in hits:
	print(hit.payload, "score:", hit.score)
```

### Query with additional filters

How about the most recent book from the early 2000s?

```python
hits = qdrant.search(
	collection_name="my_books",
	query_vector=encoder.encode("alien invasion").tolist(),
	query_filter=models.Filter(
		must=[
			models.FieldCondition(
				key="year",
				range=models.Range(
					gte=2000
				)
			)
		]
	),
	limit=1
)
for hit in hits:
	print(hit.payload, "score:", hit.score)
```
