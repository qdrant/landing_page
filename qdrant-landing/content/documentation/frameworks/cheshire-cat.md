---
title: Cheshire Cat
aliases: [ ../integrations/cheshire-cat/ ]
---

# Cheshire Cat

[Cheshire Cat](https://cheshirecat.ai/) is an open-source framework that allows you to develop intelligent agents on top of many Large Language Models (LLM). You can develop your custom AI architecture to assist you in a wide range of tasks.

![Cheshire cat](/documentation/frameworks/cheshire-cat/cat.jpg)

## Cheshire Cat and Qdrant

Cheshire Cat uses Qdrant as the default [Vector Memory](https://cheshire-cat-ai.github.io/docs/faq/llm-concepts/vector-memory/) for ingesting and retrieving documents.

```
# Decide host and port for your Cat. Default will be localhost:1865
CORE_HOST=localhost
CORE_PORT=1865

# Qdrant server
# QDRANT_HOST=localhost
# QDRANT_PORT=6333
```

Cheshire Cat takes great advantage of the following features of Qdrant:

* [Collection Aliases](../../concepts/collections/#collection-aliases) to manage the change from one embedder to another.
* [Quantization](../../guides/quantization/) to obtain a good balance between speed, memory usage and quality of the results.
* [Snapshots](../../concepts/snapshots/) to not miss any information.
* [Community](https://discord.com/invite/tdtYvXjC4h)

![RAG Pipeline](/documentation/frameworks/cheshire-cat/stregatto.jpg)

## How to use the Cheshire Cat

### Requirements

To run the Cheshire Cat, you need to have [Docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/) already installed on your system.

```shell
docker run --rm -it -p 1865:80 ghcr.io/cheshire-cat-ai/core:latest
```

* Chat with the Cheshire Cat on [localhost:1865/admin](http://localhost:1865/admin).
* You can also interact via REST API and try out the endpoints on [localhost:1865/docs](http://localhost:1865/docs)

Check the [instructions on github](https://github.com/cheshire-cat-ai/core/blob/main/README.md) for a more comprehensive quick start.

### First configuration of the LLM

* Open the Admin Portal in your browser at [localhost:1865/admin](http://localhost:1865/admin).
* Configure the LLM in the `Settings` tab.
* If you don't explicitly choose it using `Settings` tab, the Embedder follows the LLM.

## Next steps

For more information, refer to the Cheshire Cat [documentation](https://cheshire-cat-ai.github.io/docs/) and [blog](https://cheshirecat.ai/blog/).

* [Getting started](https://cheshirecat.ai/hello-world/)
* [How the Cat works](https://cheshirecat.ai/how-the-cat-works/)
* [Write Your First Plugin](https://cheshirecat.ai/write-your-first-plugin/)
* [Cheshire Cat's use of Qdrant - Vector Space](https://cheshirecat.ai/dont-get-lost-in-vector-space/)
* [Cheshire Cat's use of Qdrant - Aliases](https://cheshirecat.ai/the-drunken-cat-effect/)
* [Discord Community](https://discord.com/invite/bHX5sNFCYU)
