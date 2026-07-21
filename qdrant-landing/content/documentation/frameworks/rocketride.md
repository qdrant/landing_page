---
title: RocketRide
short_description: "Build RAG pipelines and AI agents with RocketRide's multithreaded C++ runtime and Qdrant for vector search, retrieval, and memory."
description: "Use Qdrant in RocketRide to ingest embedded documents, retrieve context for RAG, and expose vector search, upsert, and delete operations to AI agents."
---

# RocketRide

[RocketRide](https://github.com/rocketride-org/rocketride-server) is an open-source AI development environment and runtime for building, running, and integrating AI systems. Pipelines are portable JSON and execute on a multithreaded C++ engine. You can compose them in the visual IDE, run them from the CLI, integrate them through Python or TypeScript SDKs, or expose them as tools over MCP.

RocketRide's native Qdrant node stores embedded documents, retrieves context for retrieval-augmented generation (RAG), and gives agents tools for searching and updating a Qdrant collection. It supports both Qdrant Cloud and self-hosted deployments.

## Run the RAG example

RocketRide includes a complete [Qdrant RAG pipeline](https://github.com/rocketride-org/rocketride-server/blob/develop/examples/rag-pipeline.pipe) with separate ingestion and query flows:

```text
Ingestion: webhook -> parse -> chunk -> embed -> Qdrant
Query:     chat -> embed -> Qdrant -> prompt -> LLM -> response
```

First, install RocketRide by following its [Quick Start](https://github.com/rocketride-org/rocketride-server#quick-start), and start Qdrant by following the [Qdrant Quickstart](/documentation/quickstart/). Then download the example pipeline:

```bash
curl -O https://raw.githubusercontent.com/rocketride-org/rocketride-server/develop/examples/rag-pipeline.pipe
```

Set the values used by the example:

```bash
export ROCKETRIDE_QDRANT_HOST=localhost
export ROCKETRIDE_COLLECTION_NAME=rocketride_docs
export ROCKETRIDE_OPENAI_KEY=your-openai-api-key
```

The example uses a local MiniLM embedding model and OpenAI for answer generation. Start it from the RocketRide CLI:

```bash
rocketride start --pipeline ./rag-pipeline.pipe
```

You can also open the same `.pipe` file in the RocketRide IDE extension or start it through the [Python](https://docs.rocketride.org/sdk/python-sdk/) or [TypeScript](https://docs.rocketride.org/sdk/node-sdk/) SDK.

## Configure the Qdrant node

For a self-hosted Qdrant server, use the `local` profile. This is the ingestion-side Qdrant node from the example:

```json
{
  "id": "qdrant_1",
  "provider": "qdrant",
  "config": {
    "profile": "local",
    "local": {
      "host": "${ROCKETRIDE_QDRANT_HOST}",
      "port": 6333,
      "collection": "${ROCKETRIDE_COLLECTION_NAME}"
    },
    "parameters": {}
  },
  "input": [
    { "lane": "documents", "from": "embedding_transformer_1" }
  ]
}
```

For Qdrant Cloud, select the `cloud` profile and supply your cluster host and API key:

```json
{
  "profile": "cloud",
  "cloud": {
    "host": "${ROCKETRIDE_QDRANT_HOST}",
    "port": 6333,
    "apikey": "${ROCKETRIDE_QDRANT_API_KEY}",
    "collection": "${ROCKETRIDE_COLLECTION_NAME}"
  }
}
```

The Qdrant node creates the collection on the first write and infers its vector dimensions from the first batch of embeddings. Use the same embedding model for every write to a collection.

## How retrieval works

The example uses two Qdrant nodes pointed at the same collection:

- The ingestion node receives document chunks after the embedding step and writes them to Qdrant.
- The query node receives an embedded question, retrieves matching chunks, and sends both the question and retrieved context to the prompt and LLM nodes.

The pipeline can be edited visually without hand-writing its JSON, but the same file is version-controllable and can be run from the [CLI](https://docs.rocketride.org/cli/) or either SDK. Once running, it can also be exposed as a tool to an MCP-compatible assistant.

## Use Qdrant from an agent

The Qdrant node can also connect to a RocketRide agent through its tool interface. By default, it exposes three namespaced tools:

| Tool | Purpose |
| --- | --- |
| `qdrant.search` | Run semantic search and return matching content, scores, and metadata. |
| `qdrant.upsert` | Add or update documents, using the node's configured embedding provider when vectors are not supplied. |
| `qdrant.delete` | Delete documents by object ID. |

This lets an agent decide when to retrieve context or update its knowledge base during a reasoning loop. The tool namespace can be changed when a pipeline contains more than one Qdrant connection.

## Further reading

- [RocketRide Qdrant node reference](https://docs.rocketride.org/nodes/qdrant/)
- [Complete RocketRide RAG example](https://docs.rocketride.org/examples/rag-pipeline/)
- [RocketRide MCP integration](https://docs.rocketride.org/protocols/mcp/)
- [RocketRide source code](https://github.com/rocketride-org/rocketride-server)
