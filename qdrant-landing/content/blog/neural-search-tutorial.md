---
draft: true
title: Neural Search Tutorial
slug: neural-search-tutorial
short_description: Neural Search Tutorial
description: Step-by-step guide on how to build a neural search service.
preview_image: /blog/from_cms/1_vghoj7gujfjazpdmm9ebxa.webp
date: 2024-01-05T14:09:57.544Z
author: Andrey Vasnetsov
featured: false
tags: []
---
<!--StartFragment-->

Step-by-step guide on how to build a neural search service.

<!--EndFragment-->

![](/blog/from_cms/1_yoyuyv4zrz09skc8r6_lta.webp "How to build a neural search service with BERT + Qdrant + FastAPI")

Information retrieval technology is one of the main technologies that enabled the modern Internet to exist. These days, search technology is the heart of a variety of applications. From web-pages search to product recommendations. For many years, this technology didn’t get much change until neural networks came into play.

In this tutorial we are going to find answers to these questions:

* What is the difference between regular and neural search?
* What neural networks could be used for search?
* In what tasks is neural network search useful?
* How to build and deploy own neural search service step-by-step?

**What is neural search?**

A regular full-text search, such as Google’s, consists of searching for keywords inside a document. For this reason, the algorithm can not take into account the real meaning of the query and documents. Many documents that might be of interest to the user are not found because they use different wording.

Neural search tries to solve exactly this problem — it attempts to enable searches not by keywords but by meaning. To achieve this, the search works in 2 steps. In the first step, a specially trained neural network encoder converts the query and the searched objects into a vector representation called *embeddings*. The encoder must be trained so that similar objects, such as texts with the same meaning or alike pictures get a close vector representation.

![](/blog/from_cms/1_vghoj7gujfjazpdmm9ebxa.webp "Neural encoder places cats closer together")

Having this vector representation, it is easy to understand what the second step should be. To find documents similar to the query you now just need to find the nearest vectors. The most convenient way to determine the distance between two vectors is to calculate the cosine distance. The usual Euclidean distance can also be used, but it is not so efficient due to the [curse of dimensionality](https://en.wikipedia.org/wiki/Curse_of_dimensionality).

**Which model could be used?**

It is ideal to use a model specially trained to determine the closeness of meanings. For example, models trained on Semantic Textual Similarity (STS) datasets. Current state-of-the-art models could be found on this [leaderboard](https://paperswithcode.com/sota/semantic-textual-similarity-on-sts-benchmark?p=roberta-a-robustly-optimized-bert-pretraining).

However, not only specially trained models can be used. If the model is trained on a large enough dataset, its internal features can work as embeddings too. So, for instance, you can take any pre-trained on ImageNet model and cut off the last layer from it. In the penultimate layer of the neural network, as a rule, the highest-level features are formed, which, however, do not correspond to specific classes. The output of this layer can be used as an embedding.

**What tasks is neural search good for?**

Neural search has the greatest advantage in areas where the query cannot be formulated precisely. Querying a table in a SQL database is not the best place for neural search.

On the contrary, if the query itself is fuzzy, or it cannot be formulated as a set of conditions — neural search can help you. If the search query is a picture, sound file or long text, neural network search is almost the only option.

If you want to build a recommendation system, the neural approach can also be useful. The user’s actions can be encoded in vector space in the same way as a picture or text. And having those vectors, it is possible to find semantically similar users and determine the next probable user actions.

**Let’s build our own**

With all that said, let’s make our neural network search. As an example, I decided to make a search for startups by their description. In this demo, we will see the cases when text search works better and the cases when neural network search works better.

I will use data from [startups-list.com](https://www.startups-list.com/). Each record contains the name, a paragraph describing the company, the location and a picture. Raw parsed data can be found at [this link](https://storage.googleapis.com/generall-shared-data/startups_demo.json).

**Prepare data for neural search**

To be able to search for our descriptions in vector space, we must get vectors first. We need to encode the descriptions into a vector representation. As the descriptions are textual data, we can use a pre-trained language model. As mentioned above, for the task of text search there is a whole set of pre-trained models specifically tuned for semantic similarity.

One of the easiest libraries to work with pre-trained language models, in my opinion, is the [sentence-transformers](https://github.com/UKPLab/sentence-transformers) by UKPLab. It provides a way to conveniently download and use many pre-trained models, mostly based on transformer architecture. Transformers is not the only architecture suitable for neural search, but for our task, it is quite enough.

We will use a model called **`distilbert-base-nli-stsb-mean-tokens**\`. DistilBERT means that the size of this model has been reduced by a special technique compared to the original BERT. This is important for the speed of our service and its demand for resources. The word \`stsb` in the name means that the model was trained for the Semantic Textual Similarity task.

The complete code for data preparation with detailed comments can be found and run in [Colab Notebook](https://colab.research.google.com/drive/1kPktoudAP8Tu8n8l-iVMOQhVmHkWV_L9?usp=sharing).

![](/blog/from_cms/1_lotmmhjfexth1ucmtuhl7a.webp "What tasks is neural search good for?  Neural search has the greatest advantage in areas where the query cannot be formulated precisely. Querying a table in a SQL database is not the best place for neural search.  On the contrary, if the query itself is fuzzy, or it cannot be formulated as a set of conditions — neural search can help you. If the search query is a picture, sound file or long text, neural network search is almost the only option.  If you want to build a recommendation system, the neural approach can also be useful. The user’s actions can be encoded in vector space in the same way as a picture or text. And having those vectors, it is possible to find semantically similar users and determine the next probable user actions.  Let’s build our own  With all that said, let’s make our neural network search. As an example, I decided to make a search for startups by their description. In this demo, we will see the cases when text search works better and the cases when neural network search works better.  I will use data from startups-list.com. Each record contains the name, a paragraph describing the company, the location and a picture. Raw parsed data can be found at this link.  Prepare data for neural search  To be able to search for our descriptions in vector space, we must get vectors first. We need to encode the descriptions into a vector representation. As the descriptions are textual data, we can use a pre-trained language model. As mentioned above, for the task of text search there is a whole set of pre-trained models specifically tuned for semantic similarity.  One of the easiest libraries to work with pre-trained language models, in my opinion, is the sentence-transformers by UKPLab. It provides a way to conveniently download and use many pre-trained models, mostly based on transformer architecture. Transformers is not the only architecture suitable for neural search, but for our task, it is quite enough.  We will use a model called `distilbert-base-nli-stsb-mean-tokens`. DistilBERT means that the size of this model has been reduced by a special technique compared to the original BERT. This is important for the speed of our service and its demand for resources. The word `stsb` in the name means that the model was trained for the Semantic Textual Similarity task.  The complete code for data preparation with detailed comments can be found and run in Colab Notebook.")

**Vector search engine**

Now as we have a vector representation for all our records, we need to store them somewhere. In addition to storing, we may also need to add or delete a vector, save additional information with the vector. And most importantly, we need a way to search for the nearest vectors.

The vector search engine can take care of all these tasks. It provides a convenient API for searching and managing vectors.

In our tutorial we will use [Qdrant](/) vector search engine. It not only supports all necessary operations with vectors but also allows to store additional payload along with vectors and use it to perform filtering of the search result. Qdrant has a client for python and also defines the API schema if you need to use it from other languages.

The easiest way to use Qdrant is to run a pre-built image. So make sure you have Docker installed on your system.

To start Qdrant, use the instructions on its [homepage](https://github.com/qdrant/qdrant).

Download image from [DockerHub](https://hub.docker.com/r/generall/qdrant):

`docker pull qdrant/qdrant`

And run the service inside the docker:

`docker run -p 6333:6333 \`\
`-v $(pwd)/qdrant_storage:/qdrant/storage \`\
`qdrant/qdrant`

You should see output like this

```abuild
`...`\
`[...] Starting 12 workers`\
`[...] Starting "actix-web-service-0.0.0.0:6333" service on 0.0.0.0:6333`
```

This means that the service is successfully launched and listening port 6333. To make sure you can test <http://localhost:6333/> in your browser and get qdrant version info.

All uploaded to Qdrant data is saved into the `*./qdrant_storage*` directory and will be persisted even if you recreate the container.

**Upload data to Qdrant**

Now once we have the vectors prepared and the search engine running, we can start uploading the data. To interact with Qdrant from python, I recommend using an out-of-the-box client library.

To install it, use the following command

`pip install qdrant-client`

At this point, we should have startup records in file `*startups.json*\`, encoded vectors in file `*startup_vectors.npy*`, and running Qdrant on a local machine. Let’s write a script to upload all startup data and vectors into the search engine.

First, let’s create a client object for Qdrant.

```abuild
# Import client library
from qdrant_client import QdrantClient
from qdrant_client import models
qdrant_client = QdrantClient(host=’localhost’, port=6333)
```

Qdrant allows you to combine vectors of the same purpose into collections. Many independent vector collections can exist on one service at the same time.

Let’s create a new collection for our startup vectors.

```abuild
`if not qdrant_client.collection_exists('startups'):
    `qdrant_client.create_collection(`\
    `collection_name='startups',`\
    `vectors_config=models.VectorParams(size=768, distance="Cosine")`\
    `)`
```

The `*vector_size*\` parameter is very important. It tells the service the size of the vectors in that collection. All vectors in a collection must have the same size, otherwise, it is impossible to calculate the distance between them. `*768*` is the output dimensionality of the encoder we are using.

The `*distance*` parameter allows specifying the function used to measure the distance between two points.

The Qdrant client library defines a special function that allows you to load datasets into the service. However, since there may be too much data to fit a single computer memory, the function takes an iterator over the data as input.

Let’s create an iterator over the startup data and vectors.

```
import numpy as np
import json

fd = open('./startups.json')

# payload is now an iterator over startup data
payload = map(json.loads, fd)

# Here we load all vectors into memory, numpy array works as iterable for itself.
# Other option would be to use Mmap, if we don't want to load all data into RAM
vectors = np.load('./startup_vectors.npy')

# And the final step - data uploading
qdrant_client.upload_collection(
  collection_name='startups',
  vectors=vectors,
  payload=payload,
  ids=None,  # Vector ids will be assigned automatically
  batch_size=256  # How many vectors will be uploaded in a single request?
```

Now we have vectors, uploaded to the vector search engine. On the next step we will learn how to actually search for closest vectors.

The full code for this step could be found [here](https://github.com/qdrant/qdrant_demo/blob/master/qdrant_demo/init_vector_search_index.py).

**Make a search API**

Now that all the preparations are complete, let’s start building a neural search class.

First, install all the requirements:

`pip install sentence-transformers numpy`

In order to process incoming requests neural search will need 2 things. A model to convert the query into a vector and Qdrant client, to perform a search queries.

```
# File: neural_searcher.py

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer


class NeuralSearcher:

    def __init__(self, collection_name):
        self.collection_name = collection_name
        # Initialize encoder model
        self.model = SentenceTransformer('distilbert-base-nli-stsb-mean-tokens', device='cpu')
        # initialize Qdrant client
        self.qdrant_client = QdrantClient(host='localhost', port=6333)

    # The search function looks as simple as possible:

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

With Qdrant it is also feasible to add some conditions to the search. For example, if we wanted to search for startups in a certain city, the search query could look like this:

We now have a class for making neural search queries. Let’s wrap it up into a service.

**Deploy as a service**

To build the service we will use the FastAPI framework. It is super easy to use and requires minimal code writing.

To install it, use the command

`pip install fastapi uvicorn`

Our service will have only one API endpoint and will look like this:

Now, if you run the service with

`python service.py`

[ttp://localhost:8000/docs](http://localhost:8000/docs) , you should be able to see a debug interface for your service.

![](/blog/from_cms/1_f4gzrt6rkyqg8xvjr4bdtq-1-.webp "FastAPI Swagger interface")



Feel free to play around with it, make queries and check out the results.

This concludes the tutorial.

**Online Demo**

The described code is the core of this [online demo](https://demo.qdrant.tech/).

You can try it to get an intuition for cases when the neural search is useful. The demo contains a switch that selects between neural and full-text searches. You can turn neural search on and off to compare the result with regular full-text search. Try to use startup description to find similar ones.

**Conclusion**

In this tutorial, I have tried to give minimal information about neural search, but enough to start using it. Many potential applications are not mentioned here, this is a space to go further into the subject.

Subscribe to my [telegram channel](https://t.me/neural_network_engineering), where I talk about neural networks engineering, publish other examples of neural networks and neural search applications.

Subscribe to the [Qdrant user’s group](https://discord.gg/tdtYvXjC4h) if you want to be updated on latest Qdrant news and features.