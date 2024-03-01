---
title: DocsGPT
weight: 2600
---

# DocsGPT

[DocsGPT](https://docsgpt.arc53.com/) is an open-source documentation assistant that enables you to build conversational user experiences on top of your data.

Qdrant is supported as vectorstore in DocsGPT to ingest and semantically retrieve documents.

## Configuration

Learn how to setup DocsGPT in the [setup instructions](https://docs.docsgpt.co.uk/Deploying/Quickstart).

DocsGPT configurations are applied using environment variables in a `.env` file.

To configure DocsGPT to use Qdrant as the vector store, set `VECTOR_STORE` to `"qdrant"`.

```bash
echo "VECTOR_STORE=qdrant" >> .env
```

Find the list of all the Qdrant configuration options that can be configured via environment variables [here](https://github.com/arc53/DocsGPT/blob/00dfb07b15602319bddb95089e3dab05fac56240/application/core/settings.py#L46-L59).

## Further reading

- [DocsGPT Reference](https://github.com/arc53/DocsGPT)
