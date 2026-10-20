---
title: Build a Semantic Search API
short_description: "Build a semantic search service on Qdrant Cloud with free Cloud Inference embeddings, filtering, and a FastAPI search endpoint."
description: "Tutorial: build a neural search service that embeds startup descriptions with Qdrant Cloud Inference, filters startups by city, and serves results through FastAPI."
aliases:
  - /documentation/tutorials/neural-search/
  - /documentation/beginner-tutorials/neural-search/
  - /documentation/tutorials-search-engineering/neural-search/
weight: 30
goal: Get Started
stack:
  - Python
  - Cloud Inference
  - FastAPI
example_resources:
  - label: Open Notebook
    url: https://githubtocolab.com/qdrant/examples/blob/master/neural-search/neural_search.ipynb
---

<link rel="stylesheet" href="/documentation/tutorials-develop/neural-search/figures.css">

# Build a Semantic Search API with Qdrant

| Time: 30 min | Level: Beginner | Output: [GitHub](https://github.com/qdrant/examples/tree/master/neural-search) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/neural-search/neural_search.ipynb)   |
| --- | ----------- | ----------- |----------- |

This tutorial shows you how to build and deploy your own neural search service to look through descriptions of companies from [startups-list.com](https://www.startups-list.com/) and pick the most similar ones to your query. The website contains the company names, descriptions, locations, and a picture for each entry. 

A neural search service uses artificial neural networks to improve the accuracy and relevance of search results. Besides offering simple keyword results, this system can retrieve results by meaning. It can understand and interpret complex search queries and provide more contextually relevant output, effectively enhancing the user's search experience.

## Workflow

To create a neural search service, you will need to transform your raw data and then create a search function to manipulate it. You will:

1. Download a sample dataset
2. Load the data into Qdrant Cloud, which turns each description into a vector with an embedding model
3. Create a neural search API
4. Serve it using FastAPI

<figure class="neural-search-figure">
  <picture>
    <source media="(max-width: 600px)" srcset="/documentation/tutorials-develop/neural-search/workflow.mobile.svg" width="320" height="280">
    <img src="/documentation/tutorials-develop/neural-search/workflow.svg" alt="The client uploads 40,474 startup records as text to Qdrant Cloud. Cloud Inference embeds and stores vectors with their payload. Qdrant embeds query text and returns the five closest startups, optionally filtered by city; FastAPI serves GET /api/search." width="800" height="260" loading="lazy">
  </picture>
  <picture class="neural-search-figure__dark">
    <source media="(max-width: 600px)" srcset="/documentation/tutorials-develop/neural-search/workflow.mobile.dark.svg" width="320" height="280">
    <img src="/documentation/tutorials-develop/neural-search/workflow.dark.svg" alt="The client uploads 40,474 startup records as text to Qdrant Cloud. Cloud Inference embeds and stores vectors with their payload. Qdrant embeds query text and returns the five closest startups, optionally filtered by city; FastAPI serves GET /api/search." width="800" height="260" loading="lazy">
  </picture>
</figure>

## Prerequisites

To complete this tutorial, you will need:

- A [Qdrant Cloud](https://cloud.qdrant.io) account for a Free Tier Qdrant Cloud Cluster.
- [Raw parsed data](https://storage.googleapis.com/generall-shared-data/startups_demo.json) from startups-list.com.
- Python version >=3.10

## Prepare Sample Dataset

To conduct a neural search on startup descriptions, you must first encode the description data into vectors. To process text, you can use any pre-trained embedding model.

In this tutorial, Qdrant Cloud runs the model for you through [Cloud Inference](/documentation/inference/), so you don't need to download it.

You will be using a pre-trained model called `all-MiniLM-L6-v2`, one of the free models on Qdrant Cloud.

> **Note:** Before you begin, create a project directory and a virtual python environment in it.

First you need to download the dataset into the project directory. It is a single JSON file of about 22 MB with all 40,474 startups.

```bash
curl -O https://storage.googleapis.com/generall-shared-data/startups_demo.json
```

## Create a Qdrant Cloud Cluster

Next, you need to manage all of your data using a vector search engine. Qdrant lets you store, update or delete created vectors. Most importantly, it lets you search for the nearest vectors via a convenient API.

1. Register for a [Qdrant Cloud account](https://cloud.qdrant.io) using your email, Google, or GitHub credentials.
2. Under **Create a Free Cluster**, enter a cluster name and select your preferred cloud provider and region. Click **Create Free Cluster**.
3. Copy the **API key** when prompted and store it somewhere safe, as it won't be displayed again.
4. Copy the **Cluster Endpoint**. It should look something like `https://xxx.cloud.qdrant.io`.
5. Store both as environment variables in your terminal, so the code can read them.

```bash
export QDRANT_URL="https://xxx.cloud.qdrant.io"
export QDRANT_API_KEY="your-api-key"
```

> **Note:** To run Qdrant on your own machine instead, follow the [Local Quickstart](/documentation/quickstart/) and generate the embeddings locally, as the [hybrid search tutorial](/documentation/tutorials-develop/hybrid-search-fastembed/) does with FastEmbed.

## Upload Data to Qdrant

1. Install the official Python client to best interact with Qdrant.

```bash
pip install "qdrant-client>=1.19.1"
```

At this point, you should have startup records in the `startups_demo.json` file and a Qdrant Cloud cluster.

Now you need to upload all startup data into the search engine. Start Python in the terminal where you set the environment variables, and run the following steps in that session.

2. Read the raw data file. Each line holds one startup with its name, description, city, and other fields.

```python
import json

with open("startups_demo.json") as file:
    startups = [json.loads(line) for line in file]
```

3. Create a client object for Qdrant. With `cloud_inference=True`, Qdrant Cloud Inference generates the embeddings from the text you send.

```python
import os

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
)
```

4. Related vectors need to be added to a collection. Create a new collection for your startup vectors.

```python
if not client.collection_exists("startups"):
    client.create_collection(
        collection_name="startups",
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    )
```
<aside role="status">

- The `size` parameter defines the size of the vectors for a specific collection. If their size is different, it is impossible to calculate the distance between them. `384` is the output dimensionality of `all-MiniLM-L6-v2`.

- The `distance` parameter lets you specify the function used to measure the distance between two points.

</aside>

5. Create a payload index for the `city` field. You will filter search results by city later, and Qdrant needs a [payload index](/documentation/manage-data/indexing/#payload-index) (a lookup structure for one payload field) to filter on a field efficiently.

```python
client.create_payload_index(
    collection_name="startups",
    field_name="city",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

6. Upload the data. Each `models.Document` holds the text to embed and the model name, and Qdrant Cloud turns it into a vector during the upload, which takes a few minutes.

```python
EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2"

client.upload_collection(
    collection_name="startups",
    vectors=[
        models.Document(
            text=startup["alt"] + ". " + startup["description"],
            model=EMBEDDING_MODEL,
        )
        for startup in startups
    ],
    payload=startups,
    ids=range(len(startups)),  # Stable ids, so a rerun overwrites instead of duplicating
    batch_size=256,  # How many vectors will be uploaded in a single request?
    wait=True,  # Return only after all points are stored
)
```

Vectors are now uploaded to Qdrant. 

## Build the Search API

Now that all the preparations are complete, let's start building a neural search class.

In order to process incoming requests, neural search will need the Qdrant client: it performs search queries, and Cloud Inference converts each query into a vector with the same model as the data.

1. Create a file named `neural_searcher.py` and specify the following.

```python
import os

from qdrant_client import QdrantClient, models

EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2"


class NeuralSearcher:
    def __init__(self, collection_name: str) -> None:
        self.collection_name = collection_name
        # Initialize Qdrant client, Cloud Inference embeds the query text
        self.qdrant_client = QdrantClient(
            url=os.environ["QDRANT_URL"],
            api_key=os.environ["QDRANT_API_KEY"],
            cloud_inference=True,
        )
```

2. Write the search function. Add it to the `NeuralSearcher` class.

```python
    def search(self, text: str) -> list[dict]:
        # Use the query text to search for the closest vectors in the collection
        search_result = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=models.Document(text=text, model=EMBEDDING_MODEL),
            query_filter=None,  # If you don't want any filters for now
            limit=5,  # 5 the most closest results is enough
        ).points
        # `search_result` contains found vector ids with similarity scores along with the stored payload
        # In this function you are interested in metadata only
        payloads = [hit.payload for hit in search_result]
        return payloads
```

3. Add search filters.

With Qdrant it is also feasible to add some conditions to the search.
For example, if you wanted to search for startups in a certain city, replace the `search` function with this version, which takes an optional city:

```python
    def search(self, text: str, city: str | None = None) -> list[dict]:
        city_filter = None
        if city:
            # Define a filter for cities
            city_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="city",  # Store city information in a field of the same name
                        match=models.MatchValue(value=city),  # Check if the payload field has the requested value
                    )
                ]
            )

        search_result = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=models.Document(text=text, model=EMBEDDING_MODEL),
            query_filter=city_filter,
            limit=5,
        ).points
        payloads = [hit.payload for hit in search_result]
        return payloads
```

You have now created a class for neural search queries. Now wrap it up into a service.

## Deploy the Search with FastAPI

To build the service you will use the FastAPI framework. 

1. Install FastAPI.

To install it, use the command

```bash
pip install fastapi uvicorn
```

2. Implement the service.

Create a file named `service.py` and specify the following.

The service will have only one API endpoint and will look like this: 

```python
from fastapi import FastAPI

# The file where NeuralSearcher is stored
from neural_searcher import NeuralSearcher

app = FastAPI()

# Create a neural searcher instance
neural_searcher = NeuralSearcher(collection_name="startups")


@app.get("/api/search")
def search_startup(q: str, city: str | None = None) -> dict:
    return {"result": neural_searcher.search(text=q, city=city)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
```

3. Run the service in the terminal where you set `QDRANT_URL` and `QDRANT_API_KEY`.

```bash
python service.py
```

4. Open your browser at [http://localhost:8000/docs](http://localhost:8000/docs). 

You should be able to see a debug interface for your service.

![FastAPI Swagger interface with the search endpoint and its q and city parameters](/documentation/tutorials-develop/neural-search/fastapi-search.png)

Feel free to play around with it, make queries regarding the companies in our corpus, and check out the results.
For example, [http://localhost:8000/api/search?q=cloud data platform&city=Berlin](http://localhost:8000/api/search?q=cloud%20data%20platform&city=Berlin) returns five Berlin startups, starting with:

```json
{
  "result": [
    {
      "name": "Crate.IO",
      "images": "https://d1qb2nb5cznatu.cloudfront.net/startups/i/432840-0c2f2ca68e49eb8f716bd387a6f4bc86-thumb_jpg.jpg?buster=1404720084",
      "alt": "Crate.IO -  cloud computing storage big data big data analytics",
      "description": "The distributed Database for Docker\nAs big data proliferates, the need for a simple backend for data intensive applications – a data store – is obvious. It is also clear it will need to be 100% open source. This is Crate: an open source, super scalable and quick way to create a backend for the Internet ...",
      "link": "https://crate.io",
      "city": "Berlin"
    },
    ...
  ]
}
```

The other four are CloudWok, CrossCloud, Productsup, and infinipool.

## Next Steps

A [live online demo](https://qdrant.to/semantic-search-demo) searches the same startup dataset.
You can try it to get an intuition for cases when the neural search is useful.
The demo contains a selector between semantic, keyword, and hybrid searches.
You can switch between them to compare your result with a regular keyword search.

To combine both kinds of search in your own service, see [Build a Hybrid Search API](/documentation/tutorials-develop/hybrid-search-fastembed/).

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, publish other examples of neural networks and neural search applications.
