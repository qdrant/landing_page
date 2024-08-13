---
title: "Neural Search 101: A Complete Guide and Step-by-Step Tutorial"
short_description: Step-by-step guide on how to build a neural search service.
description: Discover the power of neural search. Learn what neural search is and follow our tutorial to build a neural search service using BERT, Qdrant, and FastAPI.
# external_link: https://blog.qdrant.tech/neural-search-tutorial-3f034ab13adc
social_preview_image: /articles_data/neural-search-tutorial/social_preview.jpg
preview_dir: /articles_data/neural-search-tutorial/preview
small_preview_image: /articles_data/neural-search-tutorial/tutorial.svg
weight: 50
author: Andrey Vasnetsov
author_link: https://blog.vasnetsov.com/
date: 2021-06-10T10:18:00.000Z
# aliases: [ /articles/neural-search-tutorial/ ]
---
# Neural Search 101: A Comprehensive Guide and Step-by-Step Tutorial

Information retrieval technology is one of the main technologies that enabled the modern Internet to exist.
These days, search technology is the heart of a variety of applications.
From web-pages search to product recommendations.
For many years, this technology didn't get much change until neural networks came into play.

In this guide we are going to find answers to these questions:

* What is the difference between regular and neural search?
* What neural networks could be used for search?
* In what tasks is neural network search useful?
* How to build and deploy own neural search service step-by-step?

## What is neural search?

A regular full-text search, such as Google's, consists of searching for keywords inside a document.
For this reason, the algorithm can not take into account the real meaning of the query and documents.
Many documents that might be of interest to the user are not found because they use different wording.

Neural search tries to solve exactly this problem - it attempts to enable searches not by keywords but by meaning.
To achieve this, the search works in 2 steps.
In the first step, a specially trained neural network encoder converts the query and the searched objects into a vector representation called embeddings.
The encoder must be trained so that similar objects, such as texts with the same meaning or alike pictures get a close vector representation.

![Encoders and embedding space](https://gist.githubusercontent.com/generall/c229cc94be8c15095286b0c55a3f19d7/raw/e52e3f1a320cd985ebc96f48955d7f355de8876c/encoders.png)

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

## Step-by-step neural search tutorial using Qdrant

With all that said, let's make our neural network search.
As an example, I decided to make a search for startups by their description.
In this demo, we will see the cases when text search works better and the cases when neural network search works better.


I will use data from [startups-list.com](https://www.startups-list.com/).
Each record contains the name, a paragraph describing the company, the location and a picture. 
Raw parsed data can be found at [this link](https://storage.googleapis.com/generall-shared-data/startups_demo.json).

### Step 1: Prepare data for neural search

To be able to search for our descriptions in vector space, we must get vectors first.
We need to encode the descriptions into a vector representation.
As the descriptions are textual data, we can use a pre-trained language model.
As mentioned above, for the task of text search there is a whole set of pre-trained models specifically tuned for semantic similarity.

One of the easiest libraries to work with pre-trained language models, in my opinion, is the [sentence-transformers](https://github.com/UKPLab/sentence-transformers) by UKPLab.
It provides a way to conveniently download and use many pre-trained models, mostly based on transformer architecture.
Transformers is not the only architecture suitable for neural search, but for our task, it is quite enough.

We will use a model called `all-MiniLM-L6-v2`.
This model is an all-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.
It is optimized for low memory consumption and fast inference.

The complete code for data preparation with detailed comments can be found and run in [Colab Notebook](https://colab.research.google.com/drive/1kPktoudAP8Tu8n8l-iVMOQhVmHkWV_L9?usp=sharing).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1kPktoudAP8Tu8n8l-iVMOQhVmHkWV_L9?usp=sharing)

### Step 2: Incorporate a Vector search engine

Now as we have a vector representation for all our records, we need to store them somewhere.
In addition to storing, we may also need to add or delete a vector, save additional information with the vector.
And most importantly, we need a way to search for the nearest vectors.

The vector search engine can take care of all these tasks. 
It provides a convenient API for searching and managing vectors. 
In our tutorial, we will use [Qdrant vector search engine](https://github.com/qdrant/qdrant) vector search engine.
It not only supports all necessary operations with vectors but also allows you to store additional payload along with vectors and use it to perform filtering of the search result.
Qdrant has a client for Python and also defines the API schema if you need to use it from other languages.

The easiest way to use Qdrant is to run a pre-built image.
So make sure you have Docker installed on your system.

To start Qdrant, use the instructions on its [homepage](https://github.com/qdrant/qdrant).

Download image from [DockerHub](https://hub.docker.com/r/qdrant/qdrant):

```bash
docker pull qdrant/qdrant
```

And run the service inside the docker:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```
You should see output like this

```text
...
[2021-02-05T00:08:51Z INFO  actix_server::builder] Starting 12 workers
[2021-02-05T00:08:51Z INFO  actix_server::builder] Starting "actix-web-service-0.0.0.0:6333" service on 0.0.0.0:6333
```

This means that the service is successfully launched and listening port 6333.
To make sure you can test [http://localhost:6333/](http://localhost:6333/) in your browser and get qdrant version info.

All uploaded to Qdrant data is saved into the `./qdrant_storage` directory and will be persisted even if you recreate the container.

### Step 3: Upload data to Qdrant

Now once we have the vectors prepared and the search engine running, we can start uploading the data.
To interact with Qdrant from python, I recommend using an out-of-the-box client library.

To install it, use the following command

```bash
pip install qdrant-client
```

At this point, we should have startup records in file `startups.json`, encoded vectors in file `startup_vectors.npy`, and running Qdrant on a local machine.
Let's write a script to upload all startup data and vectors into the search engine.

First, let's create a client object for Qdrant.

```python
# Import client library
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

qdrant_client = QdrantClient(host='localhost', port=6333)
```

Qdrant allows you to combine vectors of the same purpose into collections.
Many independent vector collections can exist on one service at the same time.

Let's create a new collection for our startup vectors.

```python
if not qdrant_client.collection_exists('startups'):
    qdrant_client.create_collection(
        collection_name='startups', 
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
```

The `vector_size` parameter is very important.
It tells the service the size of the vectors in that collection.
All vectors in a collection must have the same size, otherwise, it is impossible to calculate the distance between them.
`384` is the output dimensionality of the encoder we are using.

The `distance` parameter allows specifying the function used to measure the distance between two points.

The Qdrant client library defines a special function that allows you to load datasets into the service.
However, since there may be too much data to fit a single computer memory, the function takes an iterator over the data as input.

Let's create an iterator over the startup data and vectors.

```python
import numpy as np
import json

fd = open('./startups.json')

# payload is now an iterator over startup data
payload = map(json.loads, fd)

# Here we load all vectors into memory, numpy array works as iterable for itself.
# Other option would be to use Mmap, if we don't want to load all data into RAM
vectors = np.load('./startup_vectors.npy')
```

And the final step - data uploading

```python
qdrant_client.upload_collection(
    collection_name='startups',
    vectors=vectors,
    payload=payload,
    ids=None,  # Vector ids will be assigned automatically
    batch_size=256  # How many vectors will be uploaded in a single request?
)
```

Now we have vectors uploaded to the vector search engine.
In the next step, we will learn how to actually search for the closest vectors.

The full code for this step can be found [here](https://github.com/qdrant/qdrant_demo/blob/master/qdrant_demo/init_collection_startups.py).

### Step 4: Make a search API

Now that all the preparations are complete, let's start building a neural search class.

First, install all the requirements:
```bash
pip install sentence-transformers numpy
```

In order to process incoming requests neural search will need 2 things.
A model to convert the query into a vector and Qdrant client, to perform a search queries.

```python
# File: neural_searcher.py

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer


class NeuralSearcher:

    def __init__(self, collection_name):
        self.collection_name = collection_name
        # Initialize encoder model
        self.model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        # initialize Qdrant client
        self.qdrant_client = QdrantClient(host='localhost', port=6333)
```

The search function looks as simple as possible:

```python
    def search(self, text: str):
        # Convert text query into vector
        vector = self.model.encode(text).tolist()

        # Use `vector` for search for closest vectors in the collection
        search_result = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=vector,
            query_filter=None,  # We don't want any filters for now
            top=5  # 5 the most closest results is enough
        )
        # `search_result` contains found vector ids with similarity scores along with the stored payload
        # In this function we are interested in payload only
        payloads = [hit.payload for hit in search_result]
        return payloads
```

With Qdrant it is also feasible to add some conditions to the search.
For example, if we wanted to search for startups in a certain city, the search query could look like this:

```python
from qdrant_client.models import Filter

    ...

    city_of_interest = "Berlin"

    # Define a filter for cities
    city_filter = Filter(**{
        "must": [{
            "key": "city", # We store city information in a field of the same name 
            "match": { # This condition checks if payload field have requested value
                "keyword": city_of_interest
            }
        }]
    })

    search_result = self.qdrant_client.search(
        collection_name=self.collection_name,
        query_vector=vector,
        query_filter=city_filter,
        top=5
    )
    ...

```

We now have a class for making neural search queries. Let's wrap it up into a service.


### Step 5: Deploy as a service

To build the service we will use the FastAPI framework.
It is super easy to use and requires minimal code writing.

To install it, use the command

```bash
pip install fastapi uvicorn
```

Our service will have only one API endpoint and will look like this: 

```python
# File: service.py

from fastapi import FastAPI

# That is the file where NeuralSearcher is stored
from neural_searcher import NeuralSearcher

app = FastAPI()

# Create an instance of the neural searcher
neural_searcher = NeuralSearcher(collection_name='startups')

@app.get("/api/search")
def search_startup(q: str):
    return {
        "result": neural_searcher.search(text=q)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

```

Now, if you run the service with

```bash
python service.py
```

and open your browser at [http://localhost:8000/docs](http://localhost:8000/docs) , you should be able to see a debug interface for your service.

![FastAPI Swagger interface](https://gist.githubusercontent.com/generall/c229cc94be8c15095286b0c55a3f19d7/raw/d866e37a60036ebe65508bd736faff817a5d27e9/fastapi_neural_search.png)

Feel free to play around with it, make queries and check out the results.
This concludes the tutorial.


### Experience Neural Search With Qdrant’s Free Demo
Excited to see neural search in action? Take the next step and book a [free demo](https://qdrant.to/semantic-search-demo) with Qdrant! Experience firsthand how this cutting-edge technology can transform your search capabilities.

Our demo will help you grow intuition for cases when the neural search is useful. The demo contains a switch that selects between neural and full-text searches. You can turn neural search on and off to compare the result with regular full-text search.
Try to use a startup description to find similar ones. 

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, and publish other examples of neural networks and neural search applications.
