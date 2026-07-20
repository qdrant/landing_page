---
title: "Agent Skills"
short_description: Qdrant agent skills encode solutions architect knowledge for AI coding assistants, helping them diagnose vector search problems, recommend the right configuration, and navigate to the exact documentation without installation.
description: Qdrant agent skills help AI coding assistants diagnose and tune vector search in production. Pass a skill URL from skills.qdrant.tech to your agent to get targeted guidance on scaling, search quality, performance, monitoring, and more.
weight: 303
partition: develop
---

# Agent Skills

Qdrant ships a set of agent skills: structured knowledge files that help your AI coding assistant think like a solutions architect, not just retrieve documentation.

> Skills are hosted at [skills.qdrant.tech](https://skills.qdrant.tech).

The recommended way to get started is the [Qdrant Advisor](#the-qdrant-advisor): install it once, then ask your agent about a Qdrant problem and it loads the matching guidance live.

You can also work with skills directly.
Pass the [skills.qdrant.tech](https://skills.qdrant.tech) URL to your agent and it will use it immediately, no installation required, which keeps your agent’s context focused on the problem at hand.
Or, if you prefer to have skills available offline or without passing URLs manually, you can install them locally in your agent.
Refer to this [README](https://github.com/qdrant/skills/blob/main/README.md) for instructions.

## The Qdrant Advisor

The recommended way to use skills is the Qdrant Advisor, a meta-skill that gives your agent live access to the entire skill hierarchy.
Instead of shipping static content of its own, it searches [skills.qdrant.tech](https://skills.qdrant.tech) at runtime and loads only the guidance relevant to your current problem.

- **Always current**: It fetches fresh skill content each session, with no reinstallation needed when skills change.
- **Contextual loading**: It traverses the skill hierarchy to match your symptoms and loads only the relevant guidance.
- **Single installation**: One skill grants access to the entire, continuously evolving Qdrant knowledge base.

### Installing the Advisor

Using `npx`:

```bash
npx skills add qdrant/skills/meta/qdrant-advisor
```

### Using the Advisor

**Automatic (recommended):** With the Advisor installed, just ask about a Qdrant problem. The Advisor triggers automatically and loads the matching guidance live.

> When you use a web app, the Advisor can't fetch [skills.qdrant.tech](https://skills.qdrant.tech) on its own. Add `Use skills.qdrant.tech` to your prompt.

## Philosophy

Skills are not a second copy of the documentation.
They act as a navigation and decision layer, helping an agent determine which docs apply, when a feature is the right choice, and what pitfalls to avoid.

Documentation answers **“how?”** Skills answer **“when?”**, **“why?”**, and **“what should I check first?”**

For example, the docs explain how to enable scalar quantization.
A skill tells you whether you should, what to check before you do, and what breaks if you get it wrong.

This is the knowledge that comes from seeing the same production problems many times.
It does not fit into product documentation because it is not feature-shaped.
It's diagnostic, situational, and organized by symptoms, not by feature names.

The structure is deliberately problem-oriented and named by symptoms.
Each entry opens with a trigger condition so the agent knows when the section applies, followed by imperative steps with direct links to the relevant documentation.
The highest-value content is often the **“What Not to Do”** sections: mistakes that sound reasonable, but are not.

## Skills Are Hierarchical

Skills are organized in a hierarchy.
Each top-level skill (or hub skill) covers a domain and branches into sub-skills (or leaf skills) for more specific scenarios.

For example, `qdrant-search-quality` branches into:

- **Diagnosis and Tuning**: isolating the source of quality issues, establishing labeled baselines, tuning HNSW parameters, and choosing the right embedding model.
- **Search Strategies**: hybrid search, reranking, relevance feedback, and exploration APIs.

This structure helps agents move to the right level of specificity without loading irrelevant context.
Explore the full hierarchy and search across all skills at [skills.qdrant.tech](https://skills.qdrant.tech).

## Available Hub Skills

| Skill | Use for |
| --- | --- |
| `qdrant-clients-sdk` | SDK setup and code examples across Python, TypeScript, Rust, Go, .NET, Java |
| `qdrant-scaling` | Data volume, QPS targets, latency budgets, horizontal vs. vertical decisions |
| `qdrant-performance-optimization` | Search speed, memory pressure, indexing bottlenecks |
| `qdrant-search-quality` | Bad results, low recall, irrelevant matches, hybrid search trade-offs |
| `qdrant-monitoring` | Metrics, health checks, optimizer issues, cluster debugging |
| `qdrant-deployment-options` | Choosing between local, Docker, self-hosted, Cloud, and embedded |
| `qdrant-edge` | Building on the embedded shard: server sync, on-device BM25, snapshots, reuse vs reimplement |
| `qdrant-model-migration` | Switching embedding models without downtime |
| `qdrant-version-upgrade` | Safe upgrade paths, compatibility guarantees, rolling upgrades |

## Installing and Contributing

For instructions on installing skills in your own coding agent (Cursor, Claude Code, OpenCode, and others), refer to this [README](https://github.com/qdrant/skills/blob/main/README.md).

For guidance on contributing new skills or reporting problems, refer to [CONTRIBUTING.md](https://github.com/qdrant/skills/blob/main/CONTRIBUTING.md) in the repository.
