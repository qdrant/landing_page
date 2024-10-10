---
title: Sycamore
---

## Sycamore

[Sycamore](https://sycamore.readthedocs.io/en/stable/) is an LLM-powered data preparation, processing, and analytics system for complex, unstructured documents like PDFs, HTML, presentations, and more. With Aryn, you can prepare data for GenAI and RAG applications, power high-quality document processing workflows, and run analytics on large document collections with natural language.

You can use the Qdrant connector to write into and read documents from Qdrant collections.

<aside role="status">You can find an end-to-end example usage of the Qdrant connector <a a target="_blank" href="https://github.com/aryn-ai/sycamore/blob/main/examples/simple_qdrant.py">here.</a></aside>

## Writing to Qdrant

To write a Docset to a Qdrant collection in Sycamore, use the `docset.write.qdrant(....)` function. The Qdrant writer accepts the following arguments:

- `client_params`: Parameters that are passed to the Qdrant client constructor. See more information in the [Client API Reference](https://python-client.qdrant.tech/qdrant_client.qdrant_client).
- `collection_params`: Parameters that are passed into the `qdrant_client.QdrantClient.create_collection` method. See more information in the [Client API Reference](https://python-client.qdrant.tech/_modules/qdrant_client/qdrant_client#QdrantClient.create_collection).
- `vector_name`: The name of the vector in the Qdrant collection. Defaults to `None`.
- `execute`: Execute the pipeline and write to Qdrant on adding this operator. If `False`, will return a `DocSet` with this write in the plan. Defaults to `True`.
- `kwargs`: Keyword arguments to pass to the underlying execution engine.

```python
ds.write.qdrant(
    {
        "url": "http://localhost:6333",
        "timeout": 50,
    },
    {
        "collection_name": "{collection_name}",
        "vectors_config": {
            "size": 384,
            "distance": "Cosine",
        },
    },
)

```

## Reading from Qdrant

To read a Docset from a Qdrant collection in Sycamore, use the `docset.read.qdrant(....)` function. The Qdrant reader accepts the following arguments:

- `client_params`: Parameters that are passed to the Qdrant client constructor. See more information in the[Client API Reference](https://python-client.qdrant.tech/qdrant_client.qdrant_client).
- `query_params`: Parameters that are passed into the `qdrant_client.QdrantClient.query_points` method. See more information in the [Client API Reference](https://python-client.qdrant.tech/_modules/qdrant_client/qdrant_client#QdrantClient.query_points).
- `kwargs`: Keyword arguments to pass to the underlying execution engine.

```python
docs = ctx.read.qdrant(
    {
        "url": "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
        "api_key": "<paste-your-api-key-here>",
    },
    {"collection_name": "{collection_name}", "limit": 100, "using": "{optional_vector_name}"},
).take_all()

```

## 📚 Further Reading

- [Sycamore Reference](https://sycamore.readthedocs.io/en/stable/)
- [Sycamore](https://github.com/aryn-ai/sycamore/tree/main/examples)
