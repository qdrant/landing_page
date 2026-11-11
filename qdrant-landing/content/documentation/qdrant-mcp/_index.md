---
title: "Qdrant MCP"
short_description: "Three Model Context Protocol servers from Qdrant: manage Qdrant Cloud, give your assistant a semantic memory, and search the Qdrant documentation."
description: "Qdrant offers three MCP servers for AI assistants. The Qdrant Cloud MCP server manages clusters and billing, the open source Qdrant MCP server stores and retrieves data in a collection, and the Qdrant Docs MCP server searches the official documentation."
weight: 304
partition: develop
---

# Qdrant MCP

The [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an open standard that lets AI assistants call external tools. Qdrant provides three MCP servers. Each one does a different job, and you can connect any combination of them to the same assistant.

| Server | What it does | Runs | Sign-in |
| --- | --- | --- | --- |
| [Qdrant Cloud MCP](/documentation/qdrant-mcp/cloud/) | Manages Qdrant Cloud clusters, serverless spaces, backups, access, and billing. | Remote, hosted by Qdrant | OAuth |
| [Qdrant Docs MCP](/documentation/qdrant-mcp/docs/) | Searches the Qdrant documentation, articles, blog, and courses, and finds code snippets. | Remote, hosted by Qdrant | None |
| [Qdrant MCP (open source)](/documentation/qdrant-mcp/oss/) | Stores and retrieves information in a Qdrant collection, as semantic memory or code search. | On your machine or your infrastructure | Qdrant URL and API key |

## Which One Do I Need?

- **To create, back up, or monitor clusters from your assistant,** use the [Qdrant Cloud MCP server](/documentation/qdrant-mcp/cloud/). It works on infrastructure, not on your data.
- **To have your assistant answer Qdrant questions with current documentation,** use the [Qdrant Docs MCP server](/documentation/qdrant-mcp/docs/). It needs no account and no setup beyond the URL.
- **To give your assistant a memory, or to search your own content or code,** use the [open source Qdrant MCP server](/documentation/qdrant-mcp/oss/). It reads and writes a collection in any Qdrant deployment, including a local one.

The Qdrant Cloud MCP server also exposes documentation search, so if you already use it, you do not need the Docs server as well.

## Related Tools

MCP servers give an assistant the ability to act. [Agent skills](/documentation/agentic-tools/skills/) give it the knowledge to act well. They work together: connect a server, load a skill, and your assistant can both operate Qdrant and tune it.
