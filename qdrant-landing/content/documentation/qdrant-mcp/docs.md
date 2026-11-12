---
title: "Qdrant Docs MCP"
short_description: "Search the Qdrant documentation, articles, blog, and courses from your AI assistant, with no account and no setup beyond a URL."
description: "Connect Claude Code, Claude Desktop, Codex, or any MCP client to the Qdrant Docs MCP server. Your assistant searches qdrant.tech, reads full pages, and finds code snippets in every client language, so it answers from current documentation instead of memory."
weight: 20
partition: develop
---

# Qdrant Docs MCP

The Qdrant Docs MCP server gives your AI assistant read access to the content on qdrant.tech: the documentation, technical articles, the blog, and Qdrant Academy courses. Documentation changes between releases. With this server, your assistant looks up current behavior instead of answering from what it remembers.

It is a remote server with no authentication, so there is nothing to install and no key to paste.

- **Endpoint:** `https://search.qdrant.tech/mcp`
- **Transport:** HTTP (streamable)
- **Auth:** None

## Tools

| Tool | What it does |
| --- | --- |
| `list_docs` | Browses the structure of the content. Without arguments, it lists the top-level sections. With a section path such as `/documentation/search/`, it lists that section's pages with short descriptions. |
| `search_docs` | Searches the documentation, articles, blog, and courses. Narrow it with `sources` to one or more of `documentation`, `articles`, `blog`, and `course`, or with `partition` to `develop`, `deploy`, `ecosystem`, or `learn` to search one part of the documentation. |
| `get_page` | Reads one page in full as Markdown, including its code examples. Pass a qdrant.tech URL or a path such as `/documentation/search/hybrid-queries/`. |
| `search_snippets` | Finds code examples by what they do. Pass a `language`, such as `python`, `typescript`, `rust`, `java`, `csharp`, `go`, `http`, or `shell`, to get examples for one client. |

A typical lookup runs in two steps. The assistant calls `search_docs` to find the relevant pages, then `get_page` to read them. Search results are short excerpts, so the assistant reads the page before it relies on the answer. When your question is about code, it calls `search_snippets` first, and then `get_page` on the snippet page, which shows the same example in every client language.

## Connect Your Assistant

### Claude Code

```bash
claude mcp add --transport http qdrant-docs https://search.qdrant.tech/mcp
```

### Claude Desktop

1. Open **Settings**, then **Connectors**.
2. Select **Add custom connector**.
3. Enter the name `Qdrant Docs` and the URL `https://search.qdrant.tech/mcp`.

### Codex

```bash
codex mcp add qdrant-docs --url https://search.qdrant.tech/mcp
```

### GitHub Copilot CLI

```bash
copilot mcp add --transport http qdrant-docs https://search.qdrant.tech/mcp
```

### Other Clients

Any MCP client that supports remote HTTP servers can connect. Add this entry to its configuration. Some clients call the transport `streamable-http` or use `serverUrl` instead of `url`, so check your client's documentation for the exact keys.

```json
{
  "mcpServers": {
    "qdrant-docs": {
      "type": "http",
      "url": "https://search.qdrant.tech/mcp"
    }
  }
}
```

## Try It

Ask your assistant questions that depend on current documentation:

- "How do I set up hybrid search in Qdrant? Use the Qdrant docs."
- "Show me a Python example that creates a collection with sparse vectors."
- "What does the Qdrant documentation say about choosing between scalar and binary quantization?"
- "List the pages in the Qdrant Cloud documentation."

To make your assistant reach for the server on its own, add a line to your project instructions, such as "For any question about Qdrant, search the qdrant-docs MCP server before answering."

## Good to Know

- **Read-only:** The server only reads public content. It never touches your clusters or your data.
- **Sources:** Documentation is the authority on current behavior. Articles and blog posts can be older than the release they describe.
- **Plain Markdown:** Every page is also available as Markdown at its URL with `index.md` added, and `https://qdrant.tech/llms.txt` indexes the content for agents that prefer to fetch pages directly.

## Troubleshooting

- **Tools are missing:** Restart your assistant, because some clients cache the tool list.
- **Results are off-topic:** Ask for a narrower source, for example "search only the documentation," or name the section you expect the answer in.
