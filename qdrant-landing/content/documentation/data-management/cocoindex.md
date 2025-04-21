---
title: CocoIndex
---

# CocoIndex

[CocoIndex](https://cocoindex.com) is a high performance ETL framework to transform data for AI, with real-time incremental processing.

Qdrant is available as a native built-in vector database to store and retrieve embeddings.


Install CocoIndex:
```bash
pip install -U cocoindex
```

Install Postgres with [Docker Compose](https://docs.docker.com/compose/install/):
```bash
docker compose -f <(curl -L https://raw.githubusercontent.com/cocoindex-io/cocoindex/refs/heads/main/dev/postgres.yaml) up -d
```
CocoIndex is a stateful ETL framework and only processes data that has changed. It uses Postgres as a metadata store to track the state of the data.

```python
import cocoindex

doc_embeddings.export(
    "doc_embeddings",
    cocoindex.storages.Qdrant(
        collection_name="cocoindex",
        grpc_url="https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6334/",
        api_key="<your-api-key-here>",
    ),
    primary_key_fields=["id_field"],
    setup_by_user=True,
)
```

The spec takes the following fields:

- `collection_name` (type: str, required): The name of the collection to export the data to.
- `grpc_url` (type: str, optional): The gRPC URL of the Qdrant instance. Defaults to http://localhost:6334/.
- `api_key` (type: str, optional). API key to authenticate requests with.

Before exporting, you must create a collection with a vector name that matches the vector field name in CocoIndex, and set `setup_by_user=True` during export.

## Further Reading

- [CocoIndex Documentation](https://cocoindex.io/docs/ops/storages#qdrant)
- [Example Code to build text embeddings with Qdrant](https://github.com/cocoindex-io/cocoindex/tree/main/examples/text_embedding_qdrant)
