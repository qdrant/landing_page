---
title: Kotaemon
---

# Kotaemon

[Kotaemon](https://github.com/Cinnamon/kotaemon) is open-source clean & customizable RAG UI for chatting with your documents. Built with both end users and developers in mind.

Qdrant is supported as a vectorstore in Kotaemon for ingesting and retrieving documents.

## Configuration

- Refer to [Getting started](https://cinnamon.github.io/kotaemon/) guide to set up Kotaemon.

- To configure Kotaemon to use Qdrant as the vector store, update the `flowsettings.py` as follows.

```python
KH_VECTORSTORE = {
    "__type__": "kotaemon.storages.QdrantVectorStore",
    "url": "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
    "api_key": "<provide-your-own-key>'",
    "client_kwargs": {} # Additional options to pass to qdrant_client.QdrantClient
}
```

- Restart Kotaemon for the changes to take effect.

The reference for all the Qdrant client options can be found [here](https://python-client.qdrant.tech/qdrant_client.qdrant_client)

## Further reading

- [Kotaemon Documentation](https://cinnamon.github.io/kotaemon/)
- [Source](https://github.com/Cinnamon/kotaemon)
