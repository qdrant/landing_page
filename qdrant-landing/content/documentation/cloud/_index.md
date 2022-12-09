---
title: Qdrant Cloud
section_title: How Qdrant Cloud operates
subtitle: 
---


Qdrant Cloud is an official cloud-based managed solution by the creators of the [Qdrant](https://github.com/qdrant/qdrant) Vector Search Engine.
It provides the same fast and reliable similarity search engine, but without a need to maintain your own infrastructure.

The transition from the on-premise to the cloud version of Qdrant does not require changing anything in the way you interact with the service, except for an API key that has to be provided to each request.

The transition is even easier if you use the official client libraries.

For example, the Python Qdrant client has the support of the API key already built-in, so you only need to provide it once, when the QdrantClient instance is created.

Please see Authentication section for details.
