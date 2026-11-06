---
title: "Qdrant MCP (Open Source)"
short_description: "Run the open source mcp-server-qdrant to give your AI assistant a semantic memory or code search backed by any Qdrant deployment."
description: "Install mcp-server-qdrant with uvx or Docker and connect it to Claude Code, Claude Desktop, Codex, GitHub Copilot CLI, or any MCP client. Your assistant stores information in a Qdrant collection and retrieves it by meaning, using FastEmbed models."
weight: 30
partition: develop
---

# Qdrant MCP (Open Source)

[`mcp-server-qdrant`](https://github.com/qdrant/mcp-server-qdrant) is the official open source MCP server for Qdrant. It acts as a semantic memory layer on top of a Qdrant collection: your assistant stores pieces of information and retrieves them later by meaning.

You run it yourself, next to the assistant or on your own infrastructure, and point it at any Qdrant deployment: [Qdrant Cloud](/documentation/cloud-quickstart/), a [local instance](/documentation/quickstart/), or a local database file. The server creates the collection if it does not exist, and generates embeddings with [FastEmbed](/documentation/fastembed/), so you need no embedding provider key.

Unlike the [Qdrant Cloud MCP server](/documentation/qdrant-mcp/cloud/), which manages infrastructure, this server works on your data.

## Tools

| Tool | What it does |
| --- | --- |
| `qdrant-store` | Stores information in the collection. Takes `information` (a string), optional `metadata` (JSON), and `collection_name`. |
| `qdrant-find` | Retrieves the most relevant stored information for a natural language `query`. Takes `query` and `collection_name`. Each result comes back as a separate message. |

The `collection_name` argument is required only when you do not set a default collection with `COLLECTION_NAME`. When a default is set, the argument is hidden from the assistant.

## Configuration

You configure the server with environment variables. The only command-line argument is `--transport`.

| Variable | Description | Default |
| --- | --- | --- |
| `QDRANT_URL` | URL of the Qdrant server. | None |
| `QDRANT_API_KEY` | API key for the Qdrant server. | None |
| `QDRANT_LOCAL_PATH` | Path to a local Qdrant database, as an alternative to `QDRANT_URL`. | None |
| `COLLECTION_NAME` | Name of the default collection. | None |
| `EMBEDDING_PROVIDER` | Embedding provider. Only `fastembed` is supported. | `fastembed` |
| `EMBEDDING_MODEL` | Name of the FastEmbed model to use. | `sentence-transformers/all-MiniLM-L6-v2` |
| `QDRANT_SEARCH_LIMIT` | Maximum number of results `qdrant-find` returns. | `10` |
| `QDRANT_READ_ONLY` | Disables the `qdrant-store` tool when set to `true`. | `false` |
| `TOOL_STORE_DESCRIPTION` | Custom description of the store tool. | Built-in default |
| `TOOL_FIND_DESCRIPTION` | Custom description of the find tool. | Built-in default |

You cannot set both `QDRANT_URL` and `QDRANT_LOCAL_PATH`.

The server is built on FastMCP, so it also reads the FastMCP environment variables. The most useful are `FASTMCP_SERVER_HOST` (default `127.0.0.1`), `FASTMCP_SERVER_PORT` (default `8000`), and `FASTMCP_LOG_LEVEL` (default `INFO`).

> The tool descriptions tell your assistant when and how to use each tool. Rewriting them turns the same server into a different tool, such as a code snippet library. See [Use It for Code Search](#use-it-for-code-search).

## Install and Run

### With uvx

[`uvx`](https://docs.astral.sh/uv/guides/tools/#running-tools) runs the server without a separate installation step.

```bash
QDRANT_URL="http://localhost:6333" \
COLLECTION_NAME="my-collection" \
uvx mcp-server-qdrant
```

### With Docker

Build the image from the repository, then run it. Setting `FASTMCP_SERVER_HOST` to `0.0.0.0` makes the server listen on all network interfaces, which a container needs.

```bash
docker build -t mcp-server-qdrant .

docker run -p 8000:8000 \
  -e FASTMCP_SERVER_HOST="0.0.0.0" \
  -e QDRANT_URL="http://your-qdrant-server:6333" \
  -e QDRANT_API_KEY="your-api-key" \
  -e COLLECTION_NAME="your-collection" \
  mcp-server-qdrant
```

### Transports

Pick the transport with the `--transport` flag.

| Transport | Use it for |
| --- | --- |
| `stdio` (default) | Local clients that start the server as a subprocess. |
| `sse` | Remote clients, over Server-Sent Events. |
| `streamable-http` | Remote clients, over the newer streamable HTTP transport. |

```bash
QDRANT_URL="http://localhost:6333" \
COLLECTION_NAME="my-collection" \
uvx mcp-server-qdrant --transport streamable-http
```

With a remote transport, the server listens on port 8000 unless you set `FASTMCP_SERVER_PORT`.

## Connect Your Assistant

### Claude Code

```bash
claude mcp add qdrant \
  -e QDRANT_URL="http://localhost:6333" \
  -e COLLECTION_NAME="my-collection" \
  -- uvx mcp-server-qdrant
```

Run `claude mcp list` to confirm the server was added.

### Claude Desktop

Add this entry to the `mcpServers` section of `claude_desktop_config.json`.

```json
{
  "qdrant": {
    "command": "uvx",
    "args": ["mcp-server-qdrant"],
    "env": {
      "QDRANT_URL": "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
      "QDRANT_API_KEY": "your_api_key",
      "COLLECTION_NAME": "your-collection-name",
      "EMBEDDING_MODEL": "sentence-transformers/all-MiniLM-L6-v2"
    }
  }
}
```

To use a local database file instead of a server, replace `QDRANT_URL` and `QDRANT_API_KEY` with `QDRANT_LOCAL_PATH`.

### Codex

```bash
codex mcp add qdrant \
  --env QDRANT_URL="http://localhost:6333" \
  --env COLLECTION_NAME="my-collection" \
  -- uvx mcp-server-qdrant
```

### GitHub Copilot CLI

Add this entry to `~/.copilot/mcp-config.json`.

```json
{
  "mcpServers": {
    "qdrant": {
      "type": "local",
      "command": "uvx",
      "args": ["mcp-server-qdrant"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "my-collection"
      },
      "tools": ["*"]
    }
  }
}
```

### Other Clients

Any MCP client that can start a local server can run `mcp-server-qdrant`. Add this entry to its configuration, and check your client's documentation for the exact keys. For clients that connect to a remote server, start the server with the `sse` or `streamable-http` [transport](#transports) and point the client at its URL, which is `http://localhost:8000/sse` for `sse` on a local machine.

```json
{
  "mcpServers": {
    "qdrant": {
      "command": "uvx",
      "args": ["mcp-server-qdrant"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "my-collection"
      }
    }
  }
}
```

## Use It for Code Search

Setting the tool descriptions turns the server into a store of code snippets that your assistant fills as it works and searches when it needs an example. The natural language description goes in `information`, and the code goes in the `code` property of `metadata`.

```bash
claude mcp add code-search \
  -e QDRANT_URL="http://localhost:6333" \
  -e COLLECTION_NAME="code-repository" \
  -e TOOL_STORE_DESCRIPTION="Store code snippets with descriptions. The 'information' parameter should contain a natural language description of what the code does, while the actual code should be included in the 'metadata' parameter as a 'code' property." \
  -e TOOL_FIND_DESCRIPTION="Search for relevant code snippets using natural language. The 'query' parameter should describe the functionality you're looking for." \
  -- uvx mcp-server-qdrant
```

Adapt the descriptions to your team's workflow and to the kinds of snippets you want to keep.

## Good to Know

- **Embedding models:** Only FastEmbed models are supported. Changing `EMBEDDING_MODEL` on an existing collection does not re-embed what is already stored, so use a new collection when you switch models.
- **Read-only mode:** Set `QDRANT_READ_ONLY=true` to let your assistant search a collection but never change it.
- **Securing a remote server:** The server has no authentication, so you need third-party security if you expose it over SSE or streamable HTTP, such as a reverse proxy with authentication or a private network.
- **Source and issues:** The code is Apache 2.0 licensed. Report bugs and suggestions in the [GitHub repository](https://github.com/qdrant/mcp-server-qdrant).
