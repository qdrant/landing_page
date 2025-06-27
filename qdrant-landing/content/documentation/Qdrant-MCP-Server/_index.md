---
title: Qdrant MCP Server
partition: qdrant
weight: 13
---
# Qdrant MCP Server 
The [Qdrant MCP Server](https://github.com/qdrant/mcp-server-qdrant) is an official [Model Context Protocol server](https://modelcontextprotocol.io/introduction) for keeping and retrieving memories in the Qdrant vector search engine. It acts as a semantic memory layer on top of the Qdrant database.

## Components 
The [Qdrant MCP Server](https://github.com/qdrant/mcp-server-qdrant) is made up of the following tools:

1. `qdrant-store`
   - Store some information in the Qdrant database
   - Input:
     - `information` (string): Information to store
     - `metadata` (JSON): Optional metadata to store
     - `collection_name` (string): Name of the collection to store the information in. This field is required if there are no default collection name.
                                   If there is a default collection name, this field is not enabled.
   - Returns: Confirmation message
2. `qdrant-find`
   - Retrieve relevant information from the Qdrant database
   - Input:
     - `query` (string): Query to use for searching
     - `collection_name` (string): Name of the collection to store the information in. This field is required if there are no default collection name.
                                   If there is a default collection name, this field is not enabled.
   - Returns: Information stored in the Qdrant database as separate messages


## Quickstart
### Using uvx
When using [`uvx`](https://docs.astral.sh/uv/guides/tools/#running-tools) no specific installation is needed to directly run *mcp-server-qdrant*.

```shell
QDRANT_URL="http://localhost:6333" \
COLLECTION_NAME="my-collection" \
EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2" \
uvx mcp-server-qdrant
```

### Using Docker
A Dockerfile is available for building and running the [MCP server](https://github.com/qdrant/mcp-server-qdrant):
```bash
# Build the container
docker build -t mcp-server-qdrant .

# Run the container
docker run -p 8000:8000 \
  -e FASTMCP_HOST="0.0.0.0" \
  -e QDRANT_URL="http://your-qdrant-server:6333" \
  -e QDRANT_API_KEY="your-api-key" \
  -e COLLECTION_NAME="your-collection" \
  mcp-server-qdrant
```

We set `FASTMCP_HOST="0.0.0.0"` to make the server listen on all network interfaces. This is necessary when running the server in a Docker container.

## Environment Variables
The configuration of the server is done using environment variables:

| Name                     | Description                                                         | Default Value                                                     |
|--------------------------|---------------------------------------------------------------------|-------------------------------------------------------------------|
| `QDRANT_URL`             | URL of the Qdrant server                                            | None                                                              |
| `QDRANT_API_KEY`         | API key for the Qdrant server                                       | None                                                              |
| `COLLECTION_NAME`        | Name of the default collection to use.                              | None                                                              |
| `QDRANT_LOCAL_PATH`      | Path to the local Qdrant database (alternative to `QDRANT_URL`)     | None                                                              |
| `EMBEDDING_PROVIDER`     | Embedding provider to use (currently only "fastembed" is supported) | `fastembed`                                                       |
| `EMBEDDING_MODEL`        | Name of the embedding model to use                                  | `sentence-transformers/all-MiniLM-L6-v2`                          |
| `TOOL_STORE_DESCRIPTION` | Custom description for the store tool                               | 
| `TOOL_FIND_DESCRIPTION`  | Custom description for the find tool                                | 

Note: You cannot provide both `QDRANT_URL` and `QDRANT_LOCAL_PATH` at the same time.

## How to get started with the Qdrant MCP Server
|                 | 
|--------------------------------------------|
| [Working With LlamaIndex](/documentation/qdrant-mcp-server/mcp-llamaindex/)        | 

