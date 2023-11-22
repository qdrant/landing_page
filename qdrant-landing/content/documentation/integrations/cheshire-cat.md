---
title: Cheshire-Cat
weight: 600
---

# Cheshire Cat

[Cheshire Cat](https://cheshirecat.ai/) is an open-source framework that allows you to develop intelligent agents on top of many Large Language Models (LLM). You can develop your custom AI architecture to assist you in a wide range of tasks.

Cheshire Cat uses Qdrant as the default [Vector Memory](https://cheshire-cat-ai.github.io/docs/conceptual/memory/vector_memory/) for ingesting and retrieving documents.
For more information check our articles about Vector Memory:
* [Don’t get lost in Vector Space](https://cheshirecat.ai/dont-get-lost-in-vector-space/)

<br>

![RAG Pipeline](https://cheshirecat.ai/wp-content/uploads/2023/11/stregatto.jpg)

<br>

## How to use the Cheshire Cat
### Requirements
To run the Cheshire Cat, you need to have [Docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/) already installed on your system.

### Setup
Clone [the repository](https://github.com/cheshire-cat-ai/core) on your machine.

```
git clone https://github.com/cheshire-cat-ai/core.git cheshire-cat
```

### Starting the Cat
Enter the created folder

```
cd cheshire-cat
```

Run docker containers

```
docker-compose up
```

### First configuration of the LLM

* Open the Admin Portal in your browser at [localhost:1865/admin](localhost:1865/admin)
* Configure the LLM in the `Settings` tab
* If you don't explicitly choose it using `Settings` tab, the Embedder follows the LLM

## Blog
For more information check our [documentation](https://cheshire-cat-ai.github.io/docs/) and [blog](https://cheshirecat.ai/blog/), here three articles to get started with the Cheshire cat:
* [Getting started](https://cheshirecat.ai/hello-world/)
* [How the Cat works](https://cheshirecat.ai/how-the-cat-works/)
* [Write Your First Plugin](https://cheshirecat.ai/write-your-first-plugin/)

