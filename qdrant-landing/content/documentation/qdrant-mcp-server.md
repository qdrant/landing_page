---
title: "Qdrant MCP"
short_description: "Manage Qdrant Cloud clusters, backups, and billing from your AI assistant, and search the Qdrant documentation, with the remote Qdrant MCP server."
description: "Connect Claude Code, Claude Desktop, Codex, GitHub Copilot, or any MCP client to the Qdrant MCP server. Manage clusters, serverless spaces, backups, IAM, and billing in plain language, and search the Qdrant docs."
weight: 305
partition: develop
---

# Qdrant MCP

The Qdrant MCP server lets your AI assistant manage your Qdrant Cloud account in plain language. It also searches the official Qdrant documentation, so your assistant can answer questions with current docs and code snippets.

It is a remote server: there is nothing to install or run, and you sign in with OAuth in your browser instead of pasting an API key into a config file.

- **Endpoint:** `https://api.cloud.qdrant.io/mcp`
- **Transport:** HTTP (streamable)
- **Auth:** OAuth. Start with read-only access, and re-authorize with manage access when you want your assistant to make changes.

> This server manages infrastructure only. It cannot read or write collections or points. Support for managing your data is in the works and is expected in the future.

## What You Can Do

| Area | Examples |
| --- | --- |
| Clusters | Create, update, restart, suspend, and delete clusters. Check health, metrics, logs, and alerts. |
| Serverless spaces | Create and manage spaces, and check their quotas and usage. |
| Backups | Take on-demand backups, set schedules, and restore into a new cluster or space. |
| Accounts and access | List members and invites, and manage custom roles and permissions. |
| Hybrid Cloud | Manage environments and generate Kubernetes bootstrap commands. |
| Catalog | Browse cloud providers, regions, packages, and Qdrant releases. |
| Billing | Review invoices, payment methods, credits, and usage. |
| Documentation | Search the Qdrant docs, articles, and blog, and find code snippets. |

## Connect Your Assistant

### Claude Code

```bash
claude mcp add --transport http qdrant-cloud https://api.cloud.qdrant.io/mcp
```

Start `claude`, run `/mcp`, select `qdrant-cloud`, and finish the login in your browser. Always pass `--transport http`, or the login never starts.

### Claude Desktop

1. Open **Settings**, then **Connectors**.
2. Select **Add custom connector**.
3. Enter the name `Qdrant Cloud` and the URL `https://api.cloud.qdrant.io/mcp`.
4. Finish the login in your browser.

### Codex

```bash
codex mcp add qdrant-cloud --url https://api.cloud.qdrant.io/mcp
codex mcp login qdrant-cloud
```

### GitHub Copilot CLI

```bash
copilot mcp add --transport http qdrant-cloud https://api.cloud.qdrant.io/mcp
```

### Other Clients

Any MCP client that supports remote HTTP servers can connect. Add this entry to its configuration. Some clients call the transport `streamable-http` or use `serverUrl` instead of `url`, so check your client's documentation for the exact keys.

```json
{
  "mcpServers": {
    "qdrant-cloud": {
      "type": "http",
      "url": "https://api.cloud.qdrant.io/mcp"
    }
  }
}
```

## Try It

After you sign in, ask your assistant something like:

- "List my Qdrant Cloud accounts."
- "Create a free cluster and tell me when it's healthy."
- "Show me the health of my clusters."
- "Set up a daily backup for my production cluster."
- "Create a serverless space and save its URL to a file."
- "How do I enable hybrid search in Qdrant?"

Your assistant asks for confirmation before it changes anything. Read each request before you approve it, because some actions, such as deleting a cluster or enabling JWT RBAC, cannot be undone.

## Good to Know

- **API keys:** The server cannot create database API keys. Create them in the [Qdrant Cloud Console](https://cloud.qdrant.io), on the **API Keys** tab of your cluster.
- **Free clusters:** Free clusters are suspended after one week without use and deleted after four weeks of inactivity. See [Create a Cluster](/documentation/cloud/create-cluster/).
- **Cleanup:** Resources your assistant creates stay until you delete them, in the Console or by asking your assistant.

## Troubleshooting

- **The login page does not open:** Reconnect from your client. In Claude Code, run `/mcp`. In Codex, run `codex mcp login`. In Claude Desktop, select **Reconnect**.
- **Changes are refused:** The connection is read-only. Re-authorize it with manage access.
- **Tools are missing:** Restart your assistant, because some clients cache the tool list.
- **Results are empty:** Ask your assistant to list your accounts first, then confirm it is using the right one.
