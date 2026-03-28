---
title: "[Working Title]"
draft: false
slug: qdrant-skills-release
short_description: "Agent skills for Qdrant: solutions architect knowledge encoded for AI agents. Diagnose, tune, and scale vector search without guessing."
description: "Agent skills for Qdrant: solutions architect knowledge encoded for AI agents. Diagnose, tune, and scale vector search without guessing."
preview_image: /blog/qdrant-skills-release/hero.png
social_preview_image: /blog/qdrant-skills-release/hero.png
date: 2026-03-26
author: Thierry Damiba
featured: true
tags:
  - qdrant
  - agents
  - skills
---

The standard RAG tutorial teaches a simple pattern: embed your documents, store them in a vector database, retrieve the top K, and feed them to the LLM. The vector engine is passive infrastructure. Put vectors in, get neighbors out. Configure once, forget about it forever.

This mental model is why most AI agents treat vector search as a black box. They can call the API. They cannot make the engineering decisions that determine whether it works well.

We built [Qdrant skills](https://github.com/qdrant/skills) to change that: deep Qdrant knowledge, encoded so agents (and humans if you're reading this!) can navigate it.


## Vector search has evolved

Production vector search is built from independent primitives that interact, not a single retrieval call:

- Quantization for memory compression
- HNSW parameter tuning for recall and latency tradeoffs
- Payload filtering with indexed fields
- Fusion strategies for hybrid retrieval (dense + sparse)
- Sharding and replication for scale

Each one of these is a lever. Pull one and it changes the others. Enable binary quantization and you cut memory 32x, but you need oversampling with rescore to preserve recall. Move vectors to disk and you free RAM, but need NVMe and io_uring to keep latency reasonable. Add more shards for throughput, but each shard adds network hops that hurt latency.

These primitives compound. The right combination depends on your data distribution, query patterns, and production constraints.

[Cosmos](https://qdrant.tech/blog/case-study-cosmos/), a visual search platform for creative professionals, is a canonical example of composable vector search in production. By combining multiple Qdrant features, they created a refined, intuitive search experience that understands the users taste. In a single collection using named vectors, they store CLIP vectors (text to image search), CNNs (for style), pHash (to identify duplicates), and color embeddings (for palette search). Color searches leverage five different vectors held in memory for fast distance calculations; text search relies on CLIP vectors. Hybrid queries blend the two.

They started with built-in reciprocal rank fusion, then moved to application-side fusion because they needed custom scoring that balanced relevance, engagement, and aesthetics. Every one of those choices was a tradeoff: memory for color precision, latency for ranking quality, simplicity for control.

Storage is passive. Vector search is a decision space with real engineering tradeoffs: memory vs latency, recall vs throughput, precision vs cost. An agent that only knows how to call `search(query, top_k=10)` is ignoring the entire tradeoff surface.


## The agent gap

AI agents are good at calling APIs. Give an agent documentation for `client.query_points()` and it will write the call correctly.

But production vector search requires a different kind of knowledge:

**"Memory usage is at 85% and climbing. What do I do?"**

A documentation-trained agent might suggest quantization. It is a valid answer. But it is not a good answer, because it skips the diagnostic step: what's actually consuming memory? Is it the vectors? Payload indexes? The HNSW graph? Or just page cache, which is normal OS behavior and not a problem at all?

The right first move is checking `/telemetry` for per-segment breakdown. Not blindly applying quantization because your training remembers that it lowers memory.

This is solutions architect knowledge that cannot be baked into the LLM. It's diagnostic, situational, and built from seeing the same problems hundreds of times.

Documentation says: *"Here's how to enable scalar quantization."*

A solutions architect says: "First check if the vectors are actually the problem. If RSSAnon is high but you already have quantization, look at payload indexes. And you don't need to worry about page cache filling available RAM. That's the OS doing its job."

The gap between "how to use a feature" and "when to use it, and why" is the gap between documentation and expertise. The gap between a toy image search app and Cosmos.


## What we shipped

We built [Qdrant skills](https://github.com/qdrant/skills): solutions architect knowledge encoded in a format that AI agents can navigate. Not better documentation. A diagnostic decision tree that tells agents when to use a feature, why, and what not to do.

We built skills for the problems that generate common questions:

- [**Deployment options**](https://qdrant.tech/documentation/deployment/): Prototyping vs self-hosted vs managed cloud vs edge. Which one, when, and why. (Cosmos chose managed cloud so they could focus on product instead of managing reindexing and scaling. Others need self-hosted for compliance.)
- **Search quality diagnosis**: Results are bad. Is it the model, HNSW approximation, quantization, or filters?
- **Search strategies**: When to use relevance feedback, hybrid search, keyword matching, or late interaction models.
- **Memory optimization**: What's using RAM and how to reduce it without destroying performance.
- **Search speed**: Why search is slow. Latency vs throughput are opposite tuning directions.
- **Scaling**: More nodes, more replicas, or just better configuration? Depends on what you're scaling for.
- **Monitoring and debugging**: How to detect problems before users report them.
- **Version upgrades**: What to check before, during, and after upgrading.


For teams on Qdrant Cloud, [qcloud-cli](https://github.com/qdrant/qcloud-cli) handles cluster creation, API key management, backups, and region selection from the terminal, so deployment fits into CI/CD pipelines instead of a web UI.

Skills are open source and work with any agent that supports the skills format (Cursor, Claude Code, OpenClaw, OpenCode, OpenAI Codex, Pi).

Install with Claude Code:

```
/plugin marketplace add qdrant/skills
```

Or with npx skills:

```
npx skills add https://github.com/qdrant/skills
```


## What skills encode that docs don't

Compare two approaches:

**Documentation-style (bad):**
- Multimodal RAG: Build a multimodal RAG system using embeddings and a vision model for generation
- Basic RAG: Implement basic retrieval and generation with Qdrant
- Advanced RAG: Improve on basic RAG by adding re-ranking, query decomposition, query rewriting

**Skills-style (good):**
- What to do if search quality is bad?
  - Don't know what's wrong yet? Test exact vs approximate search, isolate the layer
  - Approximate worse than exact? Tune HNSW ef, enable oversampling with rescore
  - Exact search also bad? Wrong embedding model. Test top MTEB alternatives.
- What to do if memory is too high?
  - Don't know what's using memory? Check /metrics and /telemetry first
  - Memory exceeds dataset size? Quantization, smaller datatypes, move indexes to disk
  - Want everything on disk? Use mmap, enable async scorer, consider inline HNSW storage

The first approach organizes by **feature**. The second organizes by situation.

Documentation answers **"how?"** Skills answer **"when?"** and **"why?"**

Skills don't replace documentation. They serve as navigation that agents can follow to the right documentation. "You're in THIS situation, so read THAT section, and here's what to watch out for." Every skill bullet links to the relevant docs page. The skill provides judgment; the docs provide detail.

The structure is deliberately simple:

**Problem-oriented sections.** Not "Quantization" or "HNSW Parameters." Instead: "Don't Know What's Using Memory," "Search Was Fast Now It's Slow," "Approximate Search Worse Than Exact." Named by symptoms, not features.

**"Use when:" triggers.** Each section opens with a one-liner that tells the agent when this section applies. Pattern-matching for machines.

**Imperative bullets with doc links.** "Enable scalar int8 quantization with `always_ram=true`" linked directly to the quantization docs. The skill tells you what to do. The docs explain how.

**"What NOT to Do" sections.** The highest-value content. These are the mistakes that sound reasonable but aren't: "Don't tune Qdrant before verifying the embedding model is right (most quality issues are model issues)." "Don't assume memory leak when page cache fills RAM (normal OS behavior)." "Don't put HNSW on disk for latency-sensitive production without NVMe."

The result is a hierarchical navigation system over our documentation, organized by what you're trying to solve, not what features exist. A decision tree, rooted in problems, branching toward the right documentation.


## Real examples: same agent, same question, with and without skills

We ran each question 5 times on Claude Opus 4.6 (1M context), with and without Qdrant skills loaded. Same model, same system prompt, no cherry-picking. With skills: 150/150 assertions passed (100%). Without skills: 78/150 (52%). The full prompts, outputs, and grading are [reproducible in the repo](https://github.com/qdrant/skills/tree/main/skills-eval-workspace).

---

### "We index social media posts and only care about the last 3 months. Our cron job deletes old posts but performance keeps degrading."

*Baseline pass rate: 28% across 5 runs. With skill: 100%. The largest delta in our evaluation.*

**Without skills:**

> The core issue: Qdrant uses soft deletes internally. When you delete points via a cron job, the data is marked as deleted but not immediately reclaimed. The HNSW index still contains the deleted nodes, queries still traverse them, and segment compaction has to work harder. Over time, you accumulate tombstones and both search latency and memory usage climb.
>
> Instead of deleting individual points, rotate entire collections on a schedule. Create monthly collections (`social_posts_2026_01`, `social_posts_2026_02`, ...), point an alias at the active window, search across all active collections in parallel, and merge results client-side. Each month, create the new collection and drop the oldest one.

**With skills:**

> Your performance degradation is expected. Filter-and-delete leaves tombstoned points that degrade search until the optimizer compacts segments. Disk is not reclaimed instantly either. For a 3-month rolling window, this is the wrong strategy.
>
> Switch to user-defined sharding with one shard key per month. Create a collection with `sharding_method: "custom"`, create shard keys `2026-01`, `2026-02`, `2026-03`. Ingest into the current month's shard key. When a new month starts, create the next shard key, redirect writes, and delete the oldest shard key. Deleting a shard key reclaims all resources instantly. No tombstones, no compaction, no degradation. Pre-create the next month's shard key before rotation to avoid write failures during the transition.

**The difference:** Both agents correctly diagnose tombstone degradation. But without the skill, Claude defaults to collection rotation with alias swapping, which requires application-level fan-out search across multiple collections and client-side result merging. The skill teaches shard rotation: a single collection with user-defined shard keys, where queries automatically span all time periods without fan-out and dropping a shard key reclaims resources instantly. The unskilled agent doesn't know this pattern exists.

---

### "We're running Qdrant 1.14 and want to upgrade to 1.17. Our cluster has replication factor 1 and 2 nodes."

*Baseline pass rate: 48% across 5 runs. With skill: 100%.*

**Without skills:**

> With replication factor 1, you have zero redundancy. Each shard exists on exactly one node. Increase replication factor to 2 before upgrading. Upgrade one minor version at a time: 1.14 to 1.15, then 1.15 to 1.16, then 1.16 to 1.17. Do not skip versions. Take snapshots before each hop. Perform rolling upgrades: stop one node, upgrade it, wait for it to rejoin and sync, then do the other.

**With skills:**

> Two critical issues. First: your replication factor of 1 means rolling upgrades cannot guarantee zero downtime. Each shard only exists on one node, so when that node goes down for upgrade, those shards are unavailable. Increase to RF=2 before starting.
>
> Second: Qdrant only guarantees storage compatibility between consecutive minor versions. You must upgrade step by step: 1.14 to 1.15, 1.15 to 1.16, 1.16 to 1.17. For each hop, upgrade the SDK to the target minor version first, then upgrade the server. The server is backward-compatible with the next SDK version for available features. Qdrant Cloud automates this process and can jump directly from 1.14 to 1.17, but self-hosted clusters must do each step manually. Use the [qcloud CLI](https://github.com/qdrant/qcloud-cli) for Cloud upgrades.

**The difference:** The unskilled agent gets the big picture right (step-by-step, increase RF). But it misses three things the skill provides: the explicit storage compatibility guarantee (why you can't skip), the SDK-before-server upgrade ordering, and that Qdrant Cloud can automate multi-version jumps. These are the details that prevent a failed migration at 2am.

---

### "We have 5,000 tenants with 10k-100k vectors each. We've been creating one collection per tenant but hitting limits."

*Baseline pass rate: 48% across 5 runs. With skill: 100%.*

**Without skills:**

> Creating 5,000 separate collections is not sustainable. Each collection carries its own HNSW index, WAL, optimizer threads, and segment management. The correct approach is to consolidate into a single shared collection with payload-based partitioning. Add a `tenant_id` field to every point, create a keyword payload index on it, and filter by `tenant_id` on every query. This drops resource usage dramatically and scales to 100,000+ tenants.

**With skills:**

> One collection per tenant does not scale past a few hundred. One company hit the 1,000 collection limit after a year of collection-per-repo and had to migrate to payload partitioning. Use a shared collection with a `tenant_id` field and create a keyword index with `is_tenant: true`. This is critical: without `is_tenant: true`, Qdrant builds a single global HNSW graph and filters after traversal, which kills performance. With it, Qdrant builds per-tenant HNSW segments so each tenant's search stays fast. Do not build a global HNSW for multi-tenant collections; use `payload_m` instead.
>
> Your tenants range 10x in size (10k to 100k vectors). If some grow significantly larger, use tiered multitenancy to promote large tenants to dedicated shards while keeping small tenants on shared shards. Custom sharding by tenant ID hash becomes relevant at 100k+ tenants, not at your current 5,000.

**The difference:** Both agents give the correct high-level answer: consolidate into one collection with payload filtering. But the unskilled agent misses the specific configuration that makes it work well: `is_tenant: true` for per-tenant HNSW segments, `payload_m` over global HNSW, and tiered multitenancy for uneven tenant sizes. It also lacks the real-world incident (the 1,000 collection limit) that makes the recommendation concrete. The skilled agent gives you the architecture; the unskilled agent gives you the idea.


## Try it

Skills are open source. Install them, break them, tell us what's wrong. If you have a production debugging pattern we missed, open a PR. The best skills will come from engineers who have already spent the week we are trying to save you.

The piece of the stack between "the API works" and "the system works in production" is where most teams lose time. That gap is a diagnosis problem, not a documentation problem.

[github.com/qdrant/skills](https://github.com/qdrant/skills)
