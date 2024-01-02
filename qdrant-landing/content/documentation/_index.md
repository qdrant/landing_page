---
title: Qdrant Documentation
weight: 10
---
# Documentation

**Qdrant (read: quadrant)** is a vector similarity search engine. Use our documentation to develop a production-ready service with a convenient API to store, search, and manage vectors with an additional payload. Qdrant's expanding features allow for all sorts of neural network or semantic-based matching, faceted search, and other applications.

## First-Time Users:

There are three ways to use Qdrant:

1. [**Run a Docker image**](quick-start/) if you don't have a Python development environment. Setup a local Qdrant server and storage in a few moments. 
2. [**Get the Python client**](https://github.com/qdrant/qdrant-client) if you're familiar with Python. Just `pip install qdrant-client`. The client uses an in-memory database.
3. [**Spin up a Qdrant Cloud cluster:**](cloud/) the recommended method to run Qdrant in production. Read [Quickstart](cloud/quickstart-cloud/) to setup your first instance.

### Recommended Workflow:

![Local mode workflow](https://raw.githubusercontent.com/qdrant/qdrant-client/master/docs/images/try-develop-deploy.png)

First, try Qdrant locally using the [Qdrant Client](https://github.com/qdrant/qdrant-client) and with the help of our [Tutorials](tutorials/) and Guides. Develop a sample app from our [Examples](examples/) list and try it using a [Qdrant Docker](guides/installation/) container. Then, when you are ready for production, deploy to a Free Tier [Qdrant Cloud](cloud/) cluster.

### Try Qdrant with Practice Data:

You may always use our [Practice Datasets](datasets/) to build with Qdrant. This page will be regularly updated with dataset snapshots you can use to bootstrap complete projects.

## Popular Topics:

| Tutorial                                           | Description                                  | Tutorial| Description      |
|----------------------------------------------------|----------------------------------------------|---------|------------------|
| [Installation](guides/installation/) | Different ways to install Qdrant. | [Collections](concepts/collections/) | Learn about the central concept behind Qdrant. |                  
| [Configuration](guides/configuration/)   | Update the default configuration.    | [Bulk Upload](tutorials/bulk-upload/) |   Efficiently upload a large number of vectors. |                  
| [Optimization](tutorials/optimize/)           | Optimize Qdrant's resource usage. | [Multitenancy](tutorials/multiple-partitions/) | Setup Qdrant for multiple independent users. |                  

## Common Use Cases:

Qdrant is ideal for deploying applications based on the matching of embeddings produced by neural network encoders. Check out the [Examples](examples/) section to learn more about common use cases. Also, you can visit the [Tutorials](tutorials/) page to learn how to work with Qdrant in different ways. 

| Use Case              | Description                                  | Stack  |   
|-----------------------|----------------------------------------------|--------|
| [Semantic Search for Beginners](tutorials/search-beginners/)    | Build a search engine locally with our most basic instruction set. | Qdrant | 
| [Build a Simple Neural Search](tutorials/neural-search/)           | Build and deploy a neural search. [Check out the live demo app.](https://demo.qdrant.tech/#/) | Qdrant, BERT, FastAPI | 
| [Build a Search with Aleph Alpha](tutorials/aleph-alpha-search/)           | Build a simple semantic search that combines text and image data.                  | Qdrant, Aleph Alpha | 
| [Developing Recommendations Systems](https://githubtocolab.com/qdrant/examples/blob/master/qdrant_101_getting_started/getting_started.ipynb)    | Learn how to get started building semantic search and recommendation systems. | Qdrant | 
| [Search and Recommend Newspaper Articles](https://githubtocolab.com/qdrant/examples/blob/master/qdrant_101_text_data/qdrant_and_text_data.ipynb)    | Work with text data to develop a semantic search and a recommendation engine for news articles. | Qdrant | 
| [Recommendation System for Songs](https://githubtocolab.com/qdrant/examples/blob/master/qdrant_101_audio_data/03_qdrant_101_audio.ipynb)    | Use Qdrant to develop a music recommendation engine based on audio embeddings. | Qdrant | 
| [Image Comparison System for Skin Conditions](https://colab.research.google.com/github/qdrant/examples/blob/master/qdrant_101_image_data/04_qdrant_101_cv.ipynb)    | Use Qdrant to compare challenging images with labels representing different skin diseases. | Qdrant | 
| [Question and Answer System with LlamaIndex](https://githubtocolab.com/qdrant/examples/blob/master/llama_index_recency/Qdrant%20and%20LlamaIndex%20%E2%80%94%20A%20new%20way%20to%20keep%20your%20Q%26A%20systems%20up-to-date.ipynb)    | Combine Qdrant and LlamaIndex to create a self-updating Q&A system. | Qdrant, LlamaIndex, Cohere | 
| [Extractive QA System](https://githubtocolab.com/qdrant/examples/blob/master/extractive_qa/extractive-question-answering.ipynb)    | Extract answers directly from context to generate highly relevant answers. | Qdrant | 
| [Ecommerce Reverse Image Search](https://githubtocolab.com/qdrant/examples/blob/master/ecommerce_reverse_image_search/ecommerce-reverse-image-search.ipynb)    | Accept images as search queries to receive semantically appropriate answers. | Qdrant | 