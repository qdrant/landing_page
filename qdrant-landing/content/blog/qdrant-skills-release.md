---
title: "[Working Title]"
draft: false
slug: qdrant-skills-release
short_description: "Go beyond single-vector embeddings. Our new advanced course covers ColBERT, ColPali, MaxSim, and production-grade multi-vector pipelines in Qdrant."
description: "Go beyond single-vector embeddings. Our new advanced course covers ColBERT, ColPali, MaxSim, and production-grade multi-vector pipelines in Qdrant."
preview_image: /blog/multi-vector-course-release/hero.png
social_preview_image: /blog/multi-vector-course-release/hero.png
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

We gave Claude the same three production questions, once with no skills loaded and once with the relevant Qdrant skill in context. Same model, same system prompt, no cherry-picking. The full prompts and outputs are [reproducible in the repo](https://github.com/qdrant/skills).

---

### "My Qdrant instance memory keeps growing. We're worried about a memory leak."

**Without skills:**

> Memory growth in Qdrant is usually not a leak but expected behavior. Qdrant loads vector indexes (HNSW graphs) and payload indexes into RAM as collections are accessed, and this memory stays resident for fast retrieval. If you recently uploaded a large batch of points, the indexing process builds in-memory structures that will stabilize once complete. Check the /metrics or /telemetry endpoints to see actual memory breakdown across collections.
>
> The most common culprits for genuinely unexpected growth are: keeping too many collections active simultaneously, using very large segment sizes without on_disk_payload enabled, or having vectors stored in RAM when they could move to disk. For large datasets, set on_disk: true for vectors in your collection config, and consider enabling memmap_threshold so segments above a certain size use memory-mapped files instead of loading fully into RAM.
>
> To investigate further, monitor the number of segments per collection (fragmented collections after many updates will have more segments and higher memory use until optimization runs), trigger manual optimization if needed, and make sure your optimizer settings are not too conservative. If memory grows unboundedly even with no new data being added, capture a heap profile or check for any client-side connection pooling issues causing responses to buffer in memory on the application side rather than in Qdrant itself.

**With skills:**

> Start by checking whether what you're seeing is actually a problem. Qdrant uses two types of RAM: resident memory (data structures, quantized vectors) and OS page cache (cached disk reads). Page cache filling available RAM is normal OS behavior and is not a memory leak. Only investigate further if resident memory (RSSAnon) specifically exceeds 80% of total RAM.
>
> If resident memory is genuinely high, check `/metrics` for RSS and allocated bytes, then use `/telemetry` for a per-collection breakdown of point counts and vector configurations. Estimate expected memory with `num_vectors * dimensions * 4 bytes * 1.5` for vectors, plus payload and index overhead. If actual usage far exceeds this estimate, the common culprits are quantized vectors with `always_ram=true`, too many payload indexes, or a large `max_segment_size` during optimization.
>
> Before changing any config, check optimizer status first. Most production issues trace back to active optimizations competing for resources, and making config changes while the optimizer is running causes cascading re-optimizations that can make things worse.

**The difference:** The unskilled agent gives a reasonable wall of generic possibilities. The skilled agent's first sentence is: "check whether what you're seeing is actually a problem." It teaches the diagnostic fork (RSSAnon vs page cache) that prevents hours of chasing phantom leaks.

---

### "Search results are bad. Users complain about irrelevant results."

**Without skills:**

> Poor search quality usually comes from one of three root causes: the embedding model is a poor fit for your domain, you're searching with wrong parameters, or your data pipeline has preprocessing mismatches between indexing and query time.
>
> Start by auditing your embedding model. A general-purpose model trained on web text will perform poorly on specialized domains. Verify you're applying identical preprocessing to both documents and queries. On the search side, check your distance metric, try disabling quantization temporarily, and consider hybrid search combining dense vectors with sparse (BM25) vectors if results are semantically close but contextually wrong.

**With skills:**

> Start by isolating the cause before tuning anything. Run a test query with `exact=true` to bypass HNSW approximation. If exact search also returns bad results, the problem is your embedding model, not Qdrant configuration. If exact search returns good results but approximate search doesn't, the issue is HNSW tuning.
>
> If the model is the problem, test the top 3 MTEB models on 100-1000 sample queries and measure recall@10. Domain-specific models consistently outperform general-purpose ones for specialized content. Do not tune Qdrant parameters until you have confirmed the model is appropriate for your use case.
>
> If the model is fine but approximate search is degraded, increase `hnsw_ef` at query time, raise `ef_construct` to 200+, and consider increasing `m` from the default 16 to 32 for higher recall. If you are using binary quantization, make sure rescore is enabled since binary quantization without rescore causes severe quality loss. Also verify that payload indexes exist on any filtered fields, and check whether filters are too restrictive by testing without them.

**The difference:** Both agents mention the embedding model. But the skilled agent gives you a single diagnostic test (`exact=true`) that cleanly separates "model problem" from "Qdrant problem" before you touch anything. The unskilled agent lists possibilities. The skilled agent gives you a decision tree.

---

### "We have 500 customers. Should we create one collection per customer for isolation?"

**Without skills:**

> For 500 customers, creating one collection per customer is generally not recommended. Each collection carries overhead (memory, file handles, segment management), and 500 collections would create meaningful resource pressure.
>
> The better approach is a single shared collection with a `customer_id` payload field, using filtering at query time for logical isolation. If you need stronger guarantees, use Qdrant's multi-tenancy support or group customers into fewer collections by region or tier. Add a payload index on `customer_id` to keep filtered queries fast.

**With skills:**

> No. One collection per customer does not scale past a few hundred tenants, and with 500 customers you are already at the edge of where this breaks down. We have seen users in our support channels hit the 1000 collection limit after a year of this pattern and have to migrate. The resource waste alone makes it a poor choice.
>
> Use a shared collection with a tenant ID field instead. Add a keyword index on that field, set `is_tenant=true` to co-locate each customer's data for sequential reads, and disable global HNSW (`m: 0`) in favor of `payload_m: 16` for per-tenant indexes. This gives you significantly faster ingestion and query performance at your scale.
>
> If some customers eventually grow large enough to need stronger isolation, Qdrant v1.16+ supports tenant promotion to dedicated shards. Small tenants stay on shared fallback shards, large ones get promoted automatically. That gives you isolation where it matters without the overhead of 500 separate collections from day one.

**The difference:** The unskilled agent gives correct general advice: don't do it, use payload filtering. The skilled agent says "No" in the first word, cites a real production incident (the 1,000 collection limit), and gives the exact config: `is_tenant=true`, `m: 0`, `payload_m: 16`. Then it goes further with tenant promotion for customers that outgrow shared shards. The unskilled agent vaguely mentions "named vectors or partition strategies." The skilled agent gives you the architecture.


## Try it

Skills are open source. Install them, break them, tell us what's wrong. If you have a production debugging pattern we missed, open a PR. The best skills will come from engineers who have already spent the week we are trying to save you.

The piece of the stack between "the API works" and "the system works in production" is where most teams lose time. That gap is a diagnosis problem, not a documentation problem.

[github.com/qdrant/skills](https://github.com/qdrant/skills)



