---
title: "Two Approaches to Helping AI Agents Use Your API (And Why You Need Both)"
short_description: "Mintlify's skill.md and Armin Ronacher's REPL-first MCP solve different failure modes. Together, they define how agents should interact with developer tools."
description: "Two emerging patterns for agent-assisted development: static knowledge files and dynamic tool access. How they complement each other using Qdrant as a case study."
preview_dir: /articles_data/skill-md-meets-repl/preview
social_preview_image: /articles_data/skill-md-meets-repl/preview/social_preview.jpg
author: Thierry Damiba
draft: false
date: 2026-01-28T00:00:00-08:00
weight: -200
category: rag-and-genai
---

AI coding agents fail in predictable ways when working with APIs. Two recent approaches from Mintlify and Armin Ronacher attack different failure modes. Understanding both reveals something useful about how agents should interact with developer tools.

## Two Failure Modes

When an agent writes code against your API, it can fail because:

1. **It doesn't know what it doesn't know.** The agent uses a deprecated method, misconfigures a parameter, or violates a constraint that isn't obvious from type signatures. This is the "known unknowns" problem: things the API maintainer knows but the agent doesn't.

2. **It can't discover what exists.** The agent doesn't know what collections exist, what the payload schema looks like, or what data is actually in the system. This is the "unknown unknowns" problem: things specific to the user's environment that no amount of documentation covers.

Most agent failures trace back to one of these. Mintlify's SKILL.md aproach addresses the first. Armin Ronacher's REPL-first MCP addresses the second.

## What skill.md Gives You

[SKILL.md](https://github.com/AgenticSkills/skills) is an emerging open standard for shipping knowledge to agents before they write code. The idea has roots in the [Cloudflare RFC](https://blog.cloudflare.com/ai-agents-open-standard), the [agentskills proposal](https://agentskills.org), and Vercel's skills CLI. [Mintlify's blog post](https://mintlify.com/blog/skill-md) by [Michael Ryaboy](https://www.linkedin.com/in/michael-ryaboy-software-engineer) showed how to apply it in practice. Decision tables for component selection, explicit gotchas sections, and auto-generating skill files from existing docs. A skill.md isn't documentation. It's a briefing. Decision tables, not tutorials. Gotchas, not explanations.

For Qdrant, a skill.md might include:

<div style="max-width: 640px; margin: 2rem auto; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);">
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #dc3545;">Decision Table</div>
  <div style="background: #16213e; padding: 0;">
    <table style="width: 100%; border-collapse: collapse; color: #e0e0e0; font-size: 14px;">
      <thead>
        <tr style="border-bottom: 1px solid #2a2a4e;">
          <th style="text-align: left; padding: 12px 20px; color: #8890a8; font-weight: 400;">Want to...</th>
          <th style="text-align: left; padding: 12px 20px; color: #8890a8; font-weight: 400;">Do</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #2a2a4e;">
          <td style="padding: 10px 20px; color: #e0e0f0;">Search</td>
          <td style="padding: 10px 20px;"><code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">client.query_points(col, query=vec, limit=10)</code></td>
        </tr>
        <tr style="border-bottom: 1px solid #2a2a4e;">
          <td style="padding: 10px 20px; color: #e0e0f0;">Filter</td>
          <td style="padding: 10px 20px;">Add <code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">query_filter=Filter(must=[...])</code></td>
        </tr>
        <tr style="border-bottom: 1px solid #2a2a4e;">
          <td style="padding: 10px 20px; color: #e0e0f0;">Hybrid</td>
          <td style="padding: 10px 20px;"><code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">prefetch</code> dense+sparse, <code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">FusionQuery(Fusion.RRF)</code></td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; color: #e0e0f0;">Multi-tenant</td>
          <td style="padding: 10px 20px;"><code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">create_payload_index(field, is_tenant=True)</code></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div style="background: #1a1a2e; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-top: 1px solid #2a2a4e; border-bottom: 2px solid #dc3545; color: #e0e0e0;">Gotchas</div>
  <div style="background: #16213e; padding: 16px 20px; line-height: 1.8; color: #c0c0d8;">
    <span style="color: #dc3545;">&#x2716;</span> <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">query_points</code> not <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">search</code> - all search variants deprecated<br>
    <span style="color: #dc3545;">&#x2716;</span> Never one collection per user - use <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">is_tenant=True</code> index<br>
    <span style="color: #dc3545;">&#x2716;</span> BM25 requires <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">Modifier.IDF</code> - sparse search needs it
  </div>
</div>

This prevents the agent from using `client.search()` (deprecated), creating a collection per user (anti-pattern), or misconfiguring sparse vectors (common mistake). The guidance for all of these exists across Qdrant's tutorials, docs, and community discussions. However, finding it requires existing Qdrant context because you need to already know enough to ask the right questions. Skills package that accumulated product intuition so agents don't need to build it from scratch.

## What REPL-First MCP Gives You

[Armin Ronacher](https://lucumr.pocoo.org/), creator of Flask and now building [Earendil](https://earendil.dev/), proposed a [different approach](https://lucumr.pocoo.org/2025/1/22/what-i-want-for-ai-tools/). Instead of 30 narrow MCP tools, give the agent a Python shell with the SDK pre-configured:

```python
# Agent can just run this
collections = client.get_collections()
print([c.name for c in collections.collections])

# Then inspect the actual schema
info = client.get_collection("products")
print(info.config.params.vectors)
```

The agent discovers what exists by asking the system directly. No tool for "list collections." No tool for "get schema." Just Python. The REPL handles the unknown unknowns: what's actually in your Qdrant instance right now.

## Why Neither Alone Works

**skill.md without REPL:** The agent knows *how* to use `query_points` but not *what* to query. It guesses collection names. It assumes payload fields. It writes syntactically correct code that fails at runtime.

**REPL without skill.md:** The agent can discover what exists but still uses deprecated methods. It creates collections with wrong configurations. It makes the same mistakes it would have made without the REPL, just with more information about the data.

Together, the agent workflow looks like this:

<div style="max-width: 640px; margin: 2rem auto; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);">
  <div style="background: #1a1a2e; color: #e0e0e0; padding: 12px 20px; text-align: center; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #dc3545;">Agent Workflow</div>
  <div style="background: #16213e; padding: 24px 28px;">
    <div style="margin-bottom: 20px;">
      <div style="color: #dc3545; font-weight: 700; margin-bottom: 6px;">1. Read skill.md</div>
      <div style="padding-left: 20px; line-height: 1.7;">
        <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">"Use query_points, not search"</code><br>
        <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">"Never one collection per user"</code><br>
        <code class="repl" style="color: #7fdbca !important; background: rgba(127,219,202,0.1) !important;">"BM25 needs Modifier.IDF"</code>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <div style="color: #dc3545; font-weight: 700; margin-bottom: 6px;">2. Use REPL</div>
      <div style="padding-left: 20px; line-height: 1.7;">
        <code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">client.get_collections()</code><br>
        <code class="repl" style="color: #addb67 !important; background: rgba(173,219,103,0.1) !important;">client.scroll("products", limit=1)</code><br>
        <span style="color: #8890a8;"># Now knows: collection exists, payload has "category" field</span>
      </div>
    </div>
    <div>
      <div style="color: #dc3545; font-weight: 700; margin-bottom: 6px;">3. Write code</div>
      <div style="padding-left: 20px; line-height: 1.7;">
        <span style="color: #e0e0f0;">Correct method + correct collection + correct filter fields</span>
      </div>
    </div>
  </div>
</div>

The skill.md prevents known mistakes. The REPL handles environment-specific discovery. Both failure modes addressed.

## Implementation

The skill.md is just a file you drop into your project. The REPL is an MCP tool. A minimal implementation:

```python
@server.call_tool()
async def handle_tool_call(name: str, arguments: dict):
    if name == "qdrant-repl":
        code = arguments["code"]
        # client, models pre-configured in repl_globals
        try:
            result = eval(compile(code, "<repl>", "eval"), repl_globals)
            return repr(result) if result else "(ok)"
        except SyntaxError:
            exec(compile(code, "<repl>", "exec"), repl_globals)
            return "(executed)"
```

State persists between calls. The agent builds up context incrementally.

## The Broader Pattern

This isn't specific to Qdrant. Any API with:

- Deprecated methods or migration paths → needs skill.md
- User-specific state (databases, collections, schemas) → needs REPL

The two approaches complement because they address orthogonal problems. Static knowledge for static mistakes. Dynamic access for dynamic discovery.

Most developer tools need both.

## This Doesn't Make It Easy

Adding skill.md and a REPL doesn't mean agents suddenly work flawlessly. They still hallucinate. They still misunderstand requirements. They still write code that technically runs but doesn't do what you wanted.

What these tools do is eliminate *unnecessary* failures. The agent won't fail because it used a deprecated method. That's a solved problem with skill.md. It won't fail because it guessed a collection name. The REPL lets it check. But it can still fail because it misunderstood what you meant by "similar products" or because the embedding model you're using doesn't capture the semantics you care about.

You might ask: why not just pull context from docs automatically? Tools like [mcp-code-snippets](https://github.com/qdrant/mcp-code-snippets), Qdrant's MCP server for searching documentation and code examples, solve a real problem, but they solve a different one. Auto-generated context gives you API surface area. A SKILL.md gives you judgment. "Don't create one collection per user" isn't obvious from any API reference. "BM25 needs Modifier.IDF" is documented, but you have to know to look for it. Skills distill that intuition into a format agents can use immediately. The two approaches aren't in competition. Use both.

The goal isn't perfect agents. The goal is agents that fail for interesting reasons instead of boring ones. Deprecated API calls are boring failures. Wrong collection names are boring failures. Skill.md and REPL handle the boring stuff so you can focus on the hard problems.

## Try It

The [Qdrant Python skill](https://github.com/qdrant/skills/tree/main/skills/qdrant-python) is just 94 lines, and there's also a [Rust skill](https://github.com/qdrant/skills/tree/main/skills/qdrant-rust) for the gRPC client. Both are minimal, adaptable examples for your own setup. The repo also includes the `AGENTS.md` format alongside `SKILL.md` for flexible configuration.

Drop it into your project:

```bash
mkdir -p .claude/skills/qdrant
curl -o .claude/skills/qdrant/SKILL.md \
  https://raw.githubusercontent.com/qdrant/skills/main/skills/qdrant-python/SKILL.md
```

For the REPL side, configure the [Qdrant MCP server with REPL](https://github.com/thierrypdamiba/mcp-server-qdrant-repl). It's a fork of the official [Qdrant MCP server](https://github.com/qdrant/mcp-server-qdrant) that adds a `qdrant-repl` tool giving agents a stateful Python shell with a pre-configured `QdrantClient`. For docs lookup, [mcp-code-snippets](https://github.com/qdrant/mcp-code-snippets) gives agents semantic search over Qdrant documentation and code examples. The REPL fork layers exploratory access on top. The agent gets the briefing, the docs, and the toolkit.

Your agents will stop using deprecated methods. They'll stop guessing collection names. They'll write correct queries on the first attempt. Not because they got smarter, but because they got the right information at the right time.

We'd love to hear how you're using Qdrant with AI agents. What's working, what's breaking, what patterns you've found. If you want to stay ahead of the curve on this stuff, [sign up for our newsletter](https://qdrant.tech/subscribe/). And thanks to you, our readers, for pushing us to make the developer experience better for everyone.
