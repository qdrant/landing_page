---
title: "Agentic Tools"
short_description: "Tools that help AI agents work with Qdrant: llms.txt as the single entry point, agent skills, prompts across the documentation, and the Qdrant CLI and MCP servers."
description: "Qdrant agentic tools for AI coding assistants. Point your agent at qdrant.tech/llms.txt to set up Qdrant Cloud and follow Qdrant best practices, then use agent skills, documentation prompts, the qcloud CLI, and the Qdrant MCP servers to build, operate, and tune a deployment."
weight: 303
partition: develop
---

# Agentic Tools

Qdrant provides tools and resources that help AI agents work with Qdrant more effectively.
Use them to give your agent task-specific guidance, troubleshoot existing deployments, design and evaluate search systems, and apply Qdrant best practices to your specific use case.

## Start with llms.txt

[`qdrant.tech/llms.txt`](https://qdrant.tech/llms.txt) is the single entry point for AI agents.
It tells an agent what Qdrant is, how to set it up, how to use it correctly, and where to find everything else on qdrant.tech.
To get started, copy this into your agent:

```text
set up qdrant with https://qdrant.tech/llms.txt
```

The agent reads the file and takes it from there.
It recommends a free Qdrant Cloud cluster, where nothing needs to run on your machine and you don't need a credit card. **Cloud Inference creates embeddings for free** with the [free Qdrant-hosted models](/documentation/cloud/inference/#qdrant-hosted-models), so you don't need an embedding library or an embedding provider key.
The agent asks before it creates anything, and you never paste a key into the chat.

To run Qdrant on your own machine instead, say so in the prompt. The [Local Quickstart](/documentation/quickstart/) runs Qdrant in Docker, and [FastEmbed](/documentation/fastembed/fastembed-quickstart/) generates embeddings on your machine.

### What llms.txt Contains

The file has a hand-written brief, followed by an index of the site that is generated on every build.

| Part | What it gives your agent |
| --- | --- |
| Overview | What Qdrant is, when to use it, and why to start on Qdrant Cloud. Self-hosted Qdrant is set up only when you ask for it. |
| Setup | The steps to a working Qdrant Cloud cluster: sign up, choose a cluster, connect through the [Qdrant Cloud CLI](#the-cli-and-mcp-servers) or the Cloud Console, store keys in a `.env` file, and test the connection. Coding agents recommend the CLI and install it only after you agree. Hosted assistants such as claude.ai guide you through the Console. |
| MCP servers | When to connect the [Qdrant MCP servers](#the-cli-and-mcp-servers), and how. |
| Core usage | Connection details, a Python example that creates a collection and searches it with Cloud Inference, the Query API for hybrid search, and common `qcloud` commands. |
| Rules | Guardrails that prevent common mistakes, such as filtering on fields without a payload index, choosing the wrong vector size or distance metric, and building multitenancy without access control. The agent also confirms with you before it takes an action that costs money or deletes data. |
| Deep guidance | How to search the [agent skills](#agent-skills) for a specific problem, with or without the Qdrant Advisor installed. |
| Site index | The main pages of the Develop, Deploy, Ecosystem, and Learn parts of the documentation, the articles, and pricing, each with a one-line summary. Each part also links to a full index of every page in it. |
| Optional | `llms-full.txt`, which holds the brief and every page index in one file, plus the agent skills page, the API reference, and legal and security information. |

Every link in the file points to the Markdown version of a page, which agents read more reliably than HTML.
The file changes with the product, so agents should fetch it fresh rather than rely on a saved copy.

## Agent Skills

[Agent skills](/documentation/agentic-tools/skills/) encode solutions architect knowledge as structured files your agent loads on demand.
They're organized around symptoms, so they answer "why is this happening, and what should I check first?"
Reach for skills when something is already running and behaving unexpectedly: slow search, growing memory, a stuck optimizer, poor relevance.

When you set up through the CLI, `llms.txt` also installs the [Qdrant Advisor](/documentation/agentic-tools/skills/#the-qdrant-advisor), a skill that searches [skills.qdrant.tech](https://skills.qdrant.tech) and loads only the guidance that matches your problem.
In claude.ai, where skills can't be installed this way, the agent asks you to add `Use skills.qdrant.tech` to your prompt instead.

## Prompts in the Docs

Short, ready-to-use prompts appear directly on the documentation pages where they are relevant, so you can use the prompts when you need them instead of looking for them elsewhere.
Each prompt points to the agent skill your assistant should load. The prompt gets the task started; the skill provides the deeper Qdrant-specific guidance.
The [prompt index](/documentation/agentic-tools/prompts/) lists all available prompts.

Where `llms.txt` gets you started, a prompt in the docs is for a specific task once you're building, such as designing a collection or setting up monitoring.

## The CLI and MCP Servers

Skills and prompts tell your agent what to do. The Qdrant Cloud CLI and the Qdrant MCP servers let it act.

| Tool | What your agent can do with it | Works with |
| --- | --- | --- |
| [Qdrant Cloud CLI](/documentation/cloud-cli/) (`qcloud`) | Create and manage clusters, database API keys, and backups from the command line. You log in once in your browser with `qcloud auth login`. | Qdrant Cloud |
| [Qdrant Cloud MCP](/documentation/qdrant-mcp/cloud/) | Manage clusters, serverless spaces, backups, access, and billing through tool calls. You sign in with OAuth. It also searches the documentation. | Qdrant Cloud |
| [Qdrant Docs MCP](/documentation/qdrant-mcp/docs/) | Search the documentation, articles, blog, and courses, and find code snippets. No account needed. | Any deployment |
| [Qdrant MCP (open source)](/documentation/qdrant-mcp/oss/) | Store and retrieve information in a Qdrant collection, as semantic memory or code search. | Any deployment, including local |

The CLI suits coding agents that can run shell commands, such as Claude Code, Cursor, or Codex. It is also the only one of these tools that creates database API keys.
The Qdrant Cloud MCP server suits assistants that can't run commands, such as claude.ai and Claude Desktop. If you run open source Qdrant on your own machine or servers, the CLI and the Qdrant Cloud MCP server don't apply: use the Docs MCP server and the open source MCP server.
