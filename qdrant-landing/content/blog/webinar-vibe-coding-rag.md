---
title: "Vibe Coding RAG with our MCP server"
draft: false
slug: webinar-vibe-coding-rag
short_description: "Coding Youtube In-Video Search with AI agents"
description: "Check out how the MCP server can give you more control over the quality of vibe coding with AI agents like Cursor, and Claude Code!"
preview_image: /blog/webinar-vibe-coding-rag/preview.jpg
date: 2025-03-21T12:02:00+01:00
author: Kacper Łukawski
featured: false
tags:
  - news
  - blog
  - webinar
---

Another month means another webinar! This time [Kacper Łukawski](https://www.linkedin.com/in/kacperlukawski/) put some of the popular AI coding agents to the 
test. There is a lot of excitement around tools such as Cursor, GitHub Copilot, Aider and Claude Code, so we wanted to 
see how they perform in implementing something more complex than a simple frontend application. Wouldn't it be awesome 
if LLMs could code Retrieval Augmented Generation on their own? 

## Vibe coding

**Vibe coding** is a development approach introduced by Andrej Karpathy where developers surrender to intuition rather 
than control. It leverages AI coding assistants for implementation while developers focus on outcomes. Through voice 
interfaces and complete trust in AI suggestions, the process prioritizes results over code comprehension. 

[![There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and 
forget that the code even exists. It's possible because the LLMs (e.g. Cursor Composer w Sonnet) are getting too good. 
Also I just talk to Composer with SuperWhisper so I barely even touch the keyboard. I ask for the dumbest things like 
"decrease the padding on the sidebar by half" because I'm too lazy to find it. I "Accept All" always, I don't read the 
diffs anymore. When I get error messages I just copy paste them in with no comment, usually that fixes it. The code 
grows beyond my usual comprehension, I'd have to really read through it for a while. Sometimes the LLMs can't fix a bug 
so I just work around it or ask for random changes until it goes away. It's not too bad for throwaway weekend projects, 
but still quite amusing. I'm building a project or webapp, but it's not really coding - I just see stuff, say stuff, run 
stuff, and copy paste stuff, and it mostly works.](/blog/webinar-vibe-coding-rag/karpathy-tweet.png)](https://x.com/karpathy/status/1886192184808149383)

That sounds appealing, as code might be written by less technical people, and that's what we wanted to achieve during 
our live vibe coding session to see if it’s really that easy. 

**Disclaimer:** We couldn't promise the application will even run at the very end of the webinar, but we gave it a try 
either way! It's less than an hour, and even having somehow functional demo within that time can already be considered a 
great success. 

## Understanding the Model Context Protocol (MCP)

Before diving into the tools, it's important to understand what powers our approach. The [Model Context Protocol 
(MCP)](https://modelcontextprotocol.io/introduction) is an open protocol that enables seamless integration between LLM 
applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, 
or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

Our [`mcp-server-qdrant`](https://github.com/qdrant/mcp-server-qdrant) implementation acts as a semantic memory layer on 
top of [Qdrant](https://qdrant.tech/). This combination allows AI agents to:

1. Store and retrieve memories (code snippets, documentation, etc.)
2. Perform semantic searches across your codebase
3. Find the most relevant context for generating new code

The server provides two primary tools:
- `qdrant-store`: Stores information with optional metadata in the Qdrant database
- `qdrant-find`: Retrieves relevant information using semantic search

This architecture enables AI coding agents to maintain context awareness throughout your development process.

## AI coding assistants

There isn't a clear winner of the AI coding tools, and the choice depends on your preferences and requirements. We
did some initial research and decided to test the following tools:

![Cursor](/blog/webinar-vibe-coding-rag/cursor.png)

There's been a lot of excitement around **Cursor** recently, and for good reason. It's a powerful IDE-integrated tool 
built on Visual Studio Code that promises to transform how we code with AI assistance. But those of you who had a 
somewhat complicated relationship with VS Code, like me, may prefer to stick with the familiar tools where you're most
productive, e.g. JetBrains IDEs. A huge benefit of Cursor is that it can integrate with the **MCP servers**, such as 
`mcp-server-qdrant`, which allows you to provide your own context to the AI model.

![GitHub Copilot](/blog/webinar-vibe-coding-rag/github-copilot.png)

GitHub Copilot might be an interesting option for you, especially if you are an open source contributor and qualify 
for the Pro plan at no cost. This is quite appealing, as the Pro plan comes without any usage limits. This is a 
significant advantage over Cursor, which does have certain usage limits. From a pure economics standpoint, Copilot would 
make a lot of sense if it delivered comparable results.

![Aider](/blog/webinar-vibe-coding-rag/aider.png)

Another contender we considered was **Aider** - a terminal-based agent for coding. It is a terminal-based tools that 
works directly with your git repository, making edits across multiple files. What's particularly compelling is its 
flexibility - you can connect it to almost any LLM of your choice, including local models if you're concerned about 
privacy or working offline. And it’s fully open source, which might be a huge benefit!

![Claude Code](/blog/webinar-vibe-coding-rag/claude-code.png)

Last but not least, we have **Claude Code** - another terminal AI coding assistant, but the only one tightly integrated
with the specific model family - Claude models from Anthropic. Since it's baked by the same team that created the
models, it might be the most optimized for the task. The tool is still in beta preview, but the built-in support for
the Model Context Protocol is a huge advantage, and we eventually decided to use it for our vibe coding session!

## Building the project

The idea behind **vibe coding** is to let the AI do the heavy lifting while you focus on the outcome. However, real 
software development is more than just writing code. It's about understanding the problem, designing a solution, and
choosing the right tools and libraries. We don't want the model to use an outdated version of the library it was 
possibly trained on, so we need to provide it with the right context. That's why building an inline RAG (Retrieval
Augmented Generation) for the AI coding agent may take it to the next level, as it can bring the context to the model
when it needs it. 

In our case, we really wanted to use [DaisyUI](https://daisyui.com/), a Tailwind CSS component library, to use semantic
class names in CSS. The latest version (5.0.6, as of the webinar) is the preferred one, however all the LLMs we used
were rather generating code based on the older 4.x version. Imagine, the LLM would not start with generating the code
from scratch, but rather search for the most relevant examples in our knowledge base and generate the code based on
the extracted examples, or even reuse the code snippets, if possible. That's why we decided to use the **MCP server**
to provide the context to the AI coding assistant.

### Setting up the MCP server

The Qdrant MCP server acts as a semantic memory layer that can:

- Store code snippets, documentation, and implementation details using the `qdrant-store` tool
- Retrieve the most relevant information based on natural language queries with the `qdrant-find` tool

For our live coding session, we configured Claude Code to work with this MCP server. When Claude needs to generate code, 
it can automatically search for relevant examples in our codebase and create new code based on the extracted examples. 
Moreover, when the assistant is done with generating the code, it can also store it in Qdrant for further reference. And 
if configured correctly, it will only do that when we accept the change.

The latest version of the `mcp-server-qdrant` allows to specify the instructions for the AI agent, so it can understand 
when to use which of the tools. This way, the MCP server can not only be used for coding but virtually to any semantic 
search task, where the context is crucial. This is how we did that during the webinar:

```bash
export TOOL_FIND_DESCRIPTION="Use this tool ALWAYS before generating any FRONTEND code. \
It lets you search for relevant code snippets based on natural language descriptions. \
The 'query' parameter should describe what you're looking for, and the tool will return the most relevant code \
snippets. If this tool finds something similar, then create your code so it is consistent. Reuse existing code \
as much as you can."

export TOOL_STORE_DESCRIPTION="Store reusable FRONTEND code snippets for later retrieval. \
The 'information' parameter should contain a natural language description of what the code does, while the actual \
code should be included in the 'metadata' parameter as a 'code' property. The value of 'metadata' is a Python \
dictionary with strings as keys. Use this always when you generate some code to store it for further reference."
```

Both descriptions might be configured while you run the server:

```bash
claude mcp add qdrant-code-search \
  -e QDRANT_URL="http://localhost:6333" \
  -e COLLECTION_NAME="mcp-server-qdrant-knowledge-base" \
  -e TOOL_FIND_DESCRIPTION="$TOOL_FIND_DESCRIPTION" \
  -e TOOL_STORE_DESCRIPTION="$TOOL_STORE_DESCRIPTION" \
  -- uvx mcp-server-qdrant
```

The MCP server configuration is primarily done through environment variables. For those looking to set up their own 
instance, here are the key configuration options:

| Name                 | Description                                                     | Default Value                            |
|----------------------|-----------------------------------------------------------------|------------------------------------------|
| `QDRANT_URL`         | URL of the Qdrant server                                        | None                                     |
| `QDRANT_API_KEY`     | API key for the Qdrant server                                   | None                                     |
| `COLLECTION_NAME`    | Name of the collection to use                                   | *Required*                               |
| `QDRANT_LOCAL_PATH`  | Path to the local Qdrant database (alternative to `QDRANT_URL`) | None                                     |
| `EMBEDDING_PROVIDER` | Embedding provider to use                                       | `fastembed`                              |
| `EMBEDDING_MODEL`    | Name of the embedding model to use                              | `sentence-transformers/all-MiniLM-L6-v2` |

By default, the server uses the `sentence-transformers/all-MiniLM-L6-v2` embedding model from 
[FastEmbed](https://qdrant.github.io/fastembed/) to encode memories, which offers a good balance between performance and
accuracy.

### Building the knowledge base of the DaisyUI components

[DaisyUI](https://daisyui.com/) comes with a collection of components, and their documentation is LLM-friendly as they 
provide the [`llms.txt`](https://daisyui.com/llms.txt) file with all the components listed. 

![DaisyUI](/blog/webinar-vibe-coding-rag/daisyui.png)

That makes it really easy to extract all the code snippets with the corresponding meaning and store for the reference 
while we vibe code an app. This extraction process is easy with LLMs, but we will skip this part for now. [Qdrant 
snapshot](https://github.com/qdrant/webinar-vibe-coding-rag/raw/refs/heads/main/.data/mcp-server-qdrant-knowledge-base.snapshot)
contains the knowledge base we used during the webinar, so you can just import it to your Qdrant instance and start
using it right away.

### Scoping the project: YouTube In-Video Search

When learning a new skill, YouTube videos can be a great resource. However, in-depth content is often lengthy and may 
assume no prior knowledge. What if you could have a smart assistant to help you navigate through videos and find exactly 
what you need? This project aims to create a search engine for video content, helping you skim through and focus on what 
matters specifically to you.

Would you like to recreate our vibe coded project? The [repository](https://github.com/qdrant/webinar-vibe-coding-rag) 
contains all the necessary instructions and code to get you started.

## The vibe coding session

If you are interested to see how well Claude Code performed in action, you can watch the full webinar recording below:

<iframe width="560" height="315" src="https://www.youtube.com/embed/rL1wlYIyJho" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

No matter if you build an MVP, or want to build a more complex application with the help of AI, it's key to give your
agent a reliable source of information. That's why we've built our MCP server, so you can easily connect your 
documentation and codebase to Claude Code, Cursor, Windsurf or any other AI agent that supports the Model Context 
Protocol.
