---
title: Neural Search with Fastembed
weight: 2
---

# Create a Neural Search Service with Fastembed

| Time: 20 min | Level: Beginner | Output: [GitHub](https://github.com/qdrant/qdrant_demo/) |
| --- | ----------- | ----------- |----------- |

This tutorial shows you how to build and deploy your own neural search service to look through descriptions of companies from [startups-list.com](https://www.startups-list.com/) and pick the most similar ones to your query.
The website contains the company names, descriptions, locations, and a picture for each entry. 

Alternatively, you can use datasources such as [Crunchbase](https://www.crunchbase.com/), but that would require obtaining an API key from them.

Our neural search service will use [Fastembed](https://github.com/qdrant/fastembed) package to generate embeddings of text descriptions and [FastAPI](https://fastapi.tiangolo.com/) to serve the search API.
Fastembed natively integrates with Qdrant client, so you can easily upload the data into Qdrant and perform search queries.


<aside role="status">
There is a version of this tutorial that uses <a href="https://www.sbert.net/">SentenceTransformers</a> model inference engine instead of Fastembed.
Check it out <a href="/documentation/tutorials/neural-search/">here</a>.
</aside>


## Workflow

To create a neural search service, you will need to transform your raw data and then create a search function to manipulate it. 
First, you will 1) download and prepare a sample dataset using a modified version of the BERT ML model. Then, you will 2) load the data into Qdrant, 3) create a neural search API and 4) serve it using FastAPI. 

![Neural Search Workflow](/docs/workflow-neural-search.png)

> **Note**: The code for this tutorial can be found here: [Step 2: Full Code for Neural Search](https://github.com/qdrant/qdrant_demo/).

## Prerequisites

To complete this tutorial, you will need:

- Docker - The easiest way to use Qdrant is to run a pre-built Docker image.  
- [Raw parsed data](https://storage.googleapis.com/generall-shared-data/startups_demo.json) from startups-list.com.
- Python version >=3.8

## Prepare sample dataset 

To conduct a neural search on startup descriptions, you must first encode the description data into vectors. 
Fastembed integration into qdrant client combines encoding and uploading into a single step.

It also takes care of batching and parallelization, so you don't have to worry about it.

Let's start by downloading the data and installing the necessary packages.


1. First you need to download the dataset.

```bash
wget https://storage.googleapis.com/generall-shared-data/startups_demo.json
```

## Run Qdrant in Docker

Next, you need to manage all of your data using a vector engine. Qdrant lets you store, update or delete created vectors. Most importantly, it lets you search for the nearest vectors via a convenient API. 

> **Note:** Before you begin, create a project directory and a virtual python environment in it.

1. Download the Qdrant image from DockerHub.

```bash
docker pull qdrant/qdrant
```
2. Start Qdrant inside of Docker.

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

Test the service by going to [http://localhost:6333/](http://localhost:6333/). You should see the Qdrant version info in your browser.

All data uploaded to Qdrant is saved inside the `./qdrant_storage` directory and will be persisted even if you recreate the container.


## Upload data to Qdrant

1. Install the official Python client to best interact with Qdrant.

```bash
pip install qdrant-client[fastembed]
```

Note, that you need to install the `fastembed` extra to enable Fastembed integration.
At this point, you should have startup records in the `startups_demo.json` file and Qdrant running on a local machine.

Now you need to write a script to upload all startup data and vectors into the search engine.

2. Create a client object for Qdrant.

```python
# Import client library
from qdrant_client import QdrantClient

qdrant_client = QdrantClient("http://localhost:6333")
```

3. Select model to encode your data.

You will be using a pre-trained model called `sentence-transformers/all-MiniLM-L6-v2`.

```python
qdrant_client.set_model("sentence-transformers/all-MiniLM-L6-v2")
```


4. Related vectors need to be added to a collection. Create a new collection for your startup vectors.

```python
qdrant_client.recreate_collection(
    collection_name="startups",
    vectors_config=qdrant_client.get_fastembed_vector_params(),
)
```

Note, that we use `get_fastembed_vector_params` to get the vector size and distance function from the model.
This method automatically generates configuration, compatible with the model you are using.
Without fastembed integration, you would need to specify the vector size and distance function manually. Read more about it [here](/documentation/tutorials/neural-search/).

Additionally, you can specify extended configuration for our vectors, like `quantization_config` or `hnsw_config`.


5. Read data from the file.

```python
payload_path = os.path.join(DATA_DIR, "startups_demo.json")
metadata = []
documents = []

with open(payload_path) as fd:
    for line in fd:
        obj = json.loads(line)
        documents.append(obj.pop("description"))
        metadata.append(obj)
```

In this block of code, we read data we read data from `startups_demo.json` file and split it into 2 lists: `documents` and `metadata`.
Documents are the raw text descriptions of startups. Metadata is the payload associated with each startup, such as the name, location, and picture.
We will use `documents` to encode the data into vectors.


6. Encode and upload data.

```python
client.add(
    collection_name="startups",
    documents=documents,
    metadata=metadata,
    parallel=0,  # Use all available CPU cores to encode data
)
```

The `add` method will encode all documents and upload them to Qdrant.
This is one of two fastembed-specific methods, that combines encoding and uploading into a single step.

The `parallel` parameter controls the number of CPU cores used to encode data.

Additionally, you can specify ids for each document, if you want to use them later to update or delete documents.
If you don't specify ids, they will be generated automatically and returned as a result of the `add` method.

You can monitor the progress of the encoding by passing tqdm progress bar to the `add` method.

```python
from tqdm import tqdm

client.add(
    collection_name="startups",
    documents=documents,
    metadata=metadata,
    ids=tqdm(range(len(documents))),
)
```

> **Note**: See the full code for this step [here](https://github.com/qdrant/qdrant_demo/blob/master/qdrant_demo/init_collection_startups.py).


## Build the search API

Now that all the preparations are complete, let's start building a neural search class.

In order to process incoming requests, neural search will need 2 things: 1) a model to convert the query into a vector and 2) the Qdrant client to perform search queries.
Fastembed integration into qdrant client combines encoding and uploading into a single method call.


1. Create a file named `neural_searcher.py` and specify the following.

```python
from qdrant_client import QdrantClient


class NeuralSearcher:
    def __init__(self, collection_name):
        self.collection_name = collection_name
        # initialize Qdrant client
        self.qdrant_client = QdrantClient("http://localhost:6333")
        self.qdrant_client.set_model("sentence-transformers/all-MiniLM-L6-v2")
```

2. Write the search function.

```python
def search(self, text: str):
    search_result = self.qdrant_client.query(
        collection_name=self.collection_name,
        query_text=text,
        query_filter=None,  # If you don't want any filters for now
        limit=5,  # 5 the closest results are enough
    )
    # `search_result` contains found vector ids with similarity scores along with the stored payload
    # In this function you are interested in payload only
    metadata = [hit.metadata for hit in search_result]
    return metadata
```

3. Add search filters.

With Qdrant it is also feasible to add some conditions to the search.
For example, if you wanted to search for startups in a certain city, the search query could look like this:

```python
from qdrant_client.models import Filter

    ...

    city_of_interest = "Berlin"

    # Define a filter for cities
    city_filter = Filter(**{
        "must": [{
            "key": "city", # Store city information in a field of the same name 
            "match": { # This condition checks if payload field has the requested value
                "value": "city_of_interest"
            }
        }]
    })

    search_result = self.qdrant_client.query(
        collection_name=self.collection_name,
        query_text=text,
        query_filter=city_filter,
        limit=5
    )
    ...
```

You have now created a class for neural search queries. Now wrap it up into a service.

## Deploy the search with FastAPI

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
def search_startup(q: str):
    return {"result": neural_searcher.search(text=q)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
```

3. Run the service.

```bash
python service.py
```

4. Open your browser at [http://localhost:8000/docs](http://localhost:8000/docs). 

You should be able to see a debug interface for your service.

![FastAPI Swagger interface](/docs/fastapi_neural_search.png)

Feel free to play around with it, make queries regarding the companies in our corpus, and check out the results.

## Next steps

The code from this tutorial has been used to develop a [live online demo](https://qdrant.to/semantic-search-demo).
You can try it to get an intuition for cases when the neural search is useful.
The demo contains a switch that selects between neural and full-text searches.
You can turn the neural search on and off to compare your result with a regular full-text search.

> **Note**: The code for this tutorial can be found here: [Full Code for Neural Search](https://github.com/qdrant/qdrant_demo/).

Join our [Discord community](https://qdrant.to/discord), where we talk about vector search and similarity learning, publish other examples of neural networks and neural search applications.
