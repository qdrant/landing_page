---
title: "How Bayer Built an Enterprise-Scale Search Engine with Qdrant"
draft: false
slug: case-study-bayer
short_description: "Bayer serves 116,000 employees and grounds deep agents on a Qdrant Hybrid Cloud deployment."
description: "How Bayer built myGenAssist on Qdrant Hybrid Cloud: 135M points, hybrid search for deep agents, semantic caching, multitenancy, and a 20% efficiency gain."
preview_image: /blog/case-study-bayer/social_preview.png
social_preview_image: /blog/case-study-bayer/social_preview.png
date: 2026-08-13T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Bayer
  - case study
  - vector search
  - hybrid search
  - hybrid cloud
  - agentic AI
  - enterprise search
  - life sciences
partition: case-studies
---

![How Bayer Built an Enterprise-Scale Search Engine with Qdrant](/blog/case-study-bayer/bento_box.png)

Bayer is a global life sciences company operating at the intersection of two of the most consequential fields in human life: health and nutrition. Its pharmaceutical work supports drug discovery and patient care, while its crop science work supports food production at planetary scale. The company's guiding ambition, "Health for all, hunger for none," frames how it thinks about technology: AI is not a side project, but a lever applied across the entire organization, from improving the productivity of colleagues to accelerating yield prediction and drug discovery.

Turning that ambition into production systems for 116,000 employees is a hard infrastructure problem. It requires retrieval that stays fast under sustained load, grounds large language models (LLMs) in real data to suppress hallucinations, satisfies strict life sciences compliance requirements, and adapts as the underlying AI workloads shift from simple chatbots to autonomous agents. This is the story of how Bayer built that foundation, and why Qdrant has sat at the center of it for nearly three years.

{{< quote
  text="If you don't have a Qdrant vector store behind the scenes, it's very difficult to ground LLMs into reality. If you remove the search from the agent, the results go back to two years ago."
  name="Hooman Sedghamiz"
  role="Senior Director AI/ML, Precision Medicine & Insights"
  company="Bayer"
  avatar="/img/customers/hooman-sedghamiz.svg"
  logo="/img/brands/bayer.svg"
  featured="true" >}}

## A Platform Born Weeks After ChatGPT

Hooman Sedghamiz has spent roughly 15 years applying AI across healthcare, from medical devices to drug discovery research. For most of that time, AI was a tool for specialists running research projects. At Bayer, that changed once ChatGPT's chat interface made AI useful to almost every employee.

Bayer moved quickly. Within three months, Sedghamiz's team stood up myGenAssist, an internal generative AI platform. At the time, the vector search landscape was small: only a handful of companies offered it. myGenAssist started with a thousand users and a focused set of natural language processing applications for drug discovery, drawing on data sources such as the FDA and PubMed.

From there, it scaled into a full platform layer. Today, myGenAssist serves the entire company, processes over 1.5 million messages a month, and has ingested more than 450,000 uploaded documents, all while keeping the complexity of RAG hidden from the end user.

{{< quote
  text="The whole stack of RAG is hidden from users. For them it's just a file upload, but it ends up going through several layers of retrieval-augmented generation, Qdrant being part of it. That has proven to be quite successful to bring grounding and reduce hallucinations for LLM applications."
  name="Hooman Sedghamiz"
  role="Senior Director AI/ML, Precision Medicine & Insights"
  company="Bayer"
  avatar="/img/customers/hooman-sedghamiz.svg"
  logo="/img/brands/bayer.svg" >}}

## Choosing a Vector Search Engine, Three Years Ago

Three years ago, Bayer evaluated vector search. The company's first prototype, MVP1, ran on Redis. But Redis was not scalable enough for what Bayer needed, so the team benchmarked across other providers, including Qdrant.

The team evaluated across several dimensions: price-performance ratio, latency, and openness. Qdrant was open source, which meant the team could test it fast without procurement friction. Latency was strong. And it was written in Rust, a signal of the memory efficiency and predictable performance that life sciences workloads would later demand.

{{< quote
  text="There weren't many options back then. We did benchmarking across price-performance, latency, and other aspects. The first points we really liked: it was open source, we could test it very fast, latency was good, and it was written in Rust. We ended up going with Qdrant."
  name="Hooman Sedghamiz"
  role="Senior Director AI/ML, Precision Medicine & Insights"
  company="Bayer"
  avatar="/img/customers/hooman-sedghamiz.svg"
  logo="/img/brands/bayer.svg" >}}

## From Self-Hosted to Hybrid Cloud: Meeting Compliance Without Drowning in Ops

Bayer began with self-hosted Qdrant. That worked at first, but as the platform scaled from a thousand users toward the full company of 116,000, the operational burden grew. Strict requirements made the picture more complex. As a life sciences company, Bayer needs systems running in its own certified cloud, with data that does not leave its premises.

Pure self-hosting satisfied the compliance side but became demanding for a team that, in Sedghamiz's words, is not large. The answer was [Hybrid Cloud](https://qdrant.tech/documentation/hybrid-cloud/), using the Kubernetes operator. The arrangement keeps data inside Bayer's environment to meet its compliance posture, while offloading the heavy lifting of cluster management. Bayer has run this hybrid model for more than two years.

![Timeline of Bayer's path from a Redis prototype through benchmarking and self-hosted Qdrant to the current Qdrant Hybrid Cloud deployment, with the scale, infrastructure, and compliance pressures that drove each step](/blog/case-study-bayer/bayer-qdrant-timeline.png)

> "Life science companies want data to stay inside and use the platform self-hosted if possible. But self-hosting was already quite demanding for us. Our team is not that big, so we decided to use hybrid management." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

## Scaling to Millions of Messages and an Evolving Data Model

The scale of the deployment is substantial. Behind it sits a four-node Qdrant Hybrid Cloud cluster holding roughly 135 million points across seven collections. The largest single collection, the user file store, holds 91 million points as dense plus sparse hybrid vectors.

Much of the operational strain has come not from Qdrant itself but from the surrounding pipeline. Users treat the platform like a file drive, re-uploading and revising the same documents, which means vectors must stay continuously synced with the source documents. Document parsing, which runs before vectorization, is heavy and has been a recurring source of load. Keeping the vector store backfilled and consistent as documents change has been one of the central engineering challenges.

The data model itself is also expanding. Bayer is migrating toward an omnimodal approach, driven by the reality of life sciences data: medical images, X-rays, CT scans, and molecular databases sit alongside text. With embedding models that handle multiple modalities, the team can now treat search as a problem across all enterprise assets, not just documents.

> "For every enterprise, it's very important to be able to find assets no matter what format they're in: images, text, a molecular image, anything. We've started looking at these not just for simple RAG applications, but to let people search across all the assets they're dealing with." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

The omnimodal pipeline is concrete, not aspirational. When a scientific PDF enters the system, a vision model generates search-optimized descriptions of every figure (content summary, OCR'd labels, key concepts) and injects them into the text stream before chunking.

So searching "receptor binding affinity curve" returns the figure itself, not just paragraphs that mention it. Audio and video recordings are chunked, transcribed via Whisper, and vector-indexed alongside text documents. A lab meeting from three months ago becomes searchable in Qdrant within minutes of upload.

## What Users Actually Care About: Latency and Grounded Answers

For the people querying the platform, two things matter most. The first is latency. Users expect responses in under 10 seconds, so a research query that takes longer to return a simple answer erodes the experience. Fast retrieval is a core part of that budget, and Qdrant is a major component of it.

The second is retrieval quality. Grounded, high-quality answers are what keep users satisfied and drive measurable productivity gains. Hallucinations do the opposite. This is where [hybrid search](https://qdrant.tech/documentation/concepts/hybrid-queries/) became decisive. Two years ago, semantic search alone was not enough. The combination of keyword and semantic retrieval in a single query proved far more capable, and it is now central to how Bayer's agents find relevant context.

> "You want your retrieval to be very fast. A low-latency platform helps the user experience a lot. And the second point is the quality of retrieval inside that latency. It's important that your vector search supports hybrid search, for example. That's great." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

![Qdrant as enterprise retrieval backbone: four layers from 116K employees through the deep agent harness to Qdrant Hybrid Cloud and GxP-ready observability](/blog/case-study-bayer/qdrant-enterprise-retrieval-backbone.png)

## Composable Retrieval for Agents: Exposing Qdrant Directly to the Model

The most significant shift in Bayer's architecture is the move from chatbot-style interactions to deep agents. Bayer now runs agentic applications on a LangGraph-based harness, comparable to the deep research and coding agents that have become common, and these agents are far hungrier for search than the simpler systems that preceded them. A single deep research run unrolls a long tool-calling loop, hundreds of steps deep, and can fire thousands of retrieval queries before it returns, which makes per-query latency matter even more than it did before. Every one of those tools, from web search to PubMed to the FDA connector, is itself backed by a Qdrant collection.

Crucially, Bayer exposes the Qdrant API directly to the model. Whether the requester is a human or an agent, the same interface is available, and the agent can choose how to retrieve based on the task. This is exactly the composable model Qdrant is designed for: retrieval primitives the caller combines at query time, rather than a fixed pipeline hidden behind an opaque API. Under the hood, the hybrid path runs dense and sparse queries in parallel and fuses them with Reciprocal Rank Fusion before a BGE reranker sharpens the final ordering. The agent sees a clean set of tools, not that machinery.

![Flow diagram of Bayer's composable retrieval: a deep agent chooses keyword, semantic, or hybrid search through the Qdrant API across four collections, returning grounded answers from roughly 135M points on four nodes](/blog/case-study-bayer/composable-retrieval-agents.png)

A feature Bayer calls knowledge bases makes this concrete. Users start a project, drop in folders of data in any format, and the agent works against that data much like a coding agent works against a file system. Bayer extended the agent's command set so that when keyword search fails, it can escalate to semantic or hybrid search through the Qdrant API. It can also fan a single question into several reformulations (keywords, a question form, a hypothetical answer) and search them at once. The agent decides which retrieval strategy fits the moment.

> "This is very powerful because the agent now decides: I didn't find anything with keyword search, so I can switch to semantic search, or I can use hybrid search that the API exposes to me. Two years ago, semantic search alone wasn't enough. Now with hybrid search it's way more powerful." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

This is also where the omnimodal direction pays off. Users upload meeting transcripts, images, audio, and video, and the agent discovers and connects them. Qdrant increasingly serves as the agent's memory, letting it recall what a user has been working on and tailor answers accordingly. Teams elsewhere in the company can point their own applications at a shared collection to build their own search experiences, from molecule search to internal enterprise search.

> "People used to look at vector databases only for RAG applications. Now they're solving enterprise search problems. No one had an omnimodal search engine where you could search videos, audio, and every asset the company generates. We realized Qdrant was turning into that." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

Retrieval quality benefits from a parallel query expansion strategy. A single user question generates four Qdrant searches simultaneously: the verbatim query, a question-form rewrite, extracted keywords, and a HYDE hypothetical answer. Results are fused, deduplicated with a diversity cap of three chunks per document, and optionally reranked. The approach is particularly effective for pharmaceutical literature, where the same concept appears under different nomenclatures across regulatory filings, clinical protocols, and marketing materials.

Document parsing itself is agentic. Rather than pre-processing every upload through expensive OCR, the platform defers extraction until the agent actually needs a document's content. A lightweight sandbox-local parser handles simple formats instantly; complex PDFs with tables and figures fall through to server-side Docling OCR on demand. Results are cached and indexed into Qdrant on first use. With 450,000 documents uploaded and most never read beyond their metadata, this lazy parsing strategy cuts compute costs by roughly 80 percent compared to eager processing. This agentic parsing pipeline (the tiered extraction, the lazy on-demand OCR, and the path that turns a raw upload into Qdrant-indexed content the moment an agent reaches for it) was built by Balkrushn Hirani, myGenAssist's backend developer lead.

The filesystem metaphor runs deeper than an API wrapper. myGenAssist mounts each knowledge base as a virtual directory, `/kb/{id}/`, and exposes standard Unix operations: `ls`, `read_file`, `grep`, `glob`. The critical innovation is that `grep semantic:drug interaction` transparently dispatches to Qdrant hybrid search. The agent decides at runtime whether a literal grep or a semantic search will answer the question better, switching strategies mid-task without human intervention. Researchers interact with their document collections the way a developer interacts with a codebase. Much of this retrieval architecture (the knowledge base backend, the chunking strategy that decides how documents are split and embedded, and the semantic-grep dispatch into Qdrant) is the work of Wiktor Sobanski, one of myGenAssist's senior backend engineers, who owns how documents move from raw upload to searchable vector.

## The AI Hub: One Search Fabric for People and Agents

The composable philosophy does not stop at documents. As the platform grew, the assets worth finding were no longer just files. They were the things people built on top of myGenAssist: assistants, tools, MCP servers and their tools, workflows, knowledge bases, skills, and artifacts.

Bayer unified all of them into a single searchable catalog it calls the AI Hub, where more than 83,000 of these reusable building blocks now live behind one search box: roughly 28,000 assistants, 22,000 artifacts, 20,000 knowledge bases, and close to 10,000 workflows among them.

The Hub runs the same hybrid search playbook Bayer proved on its vector infrastructure: every solution carries a 1024-dimension BGE-M3 embedding, and a single search function fuses dense vector similarity with full-text keyword matching using Reciprocal Rank Fusion. The fused results are then re-ranked by live quality signals (popularity, star ratings, reliability, and recency) so the best-loved, most reliable tools rise to the top. Employees lean on it hard: the Hub serves roughly 49,000 searches a month across more than 7,500 distinct people.

![Diagram of the AI Hub search fabric: humans and agents send queries through one RRF hybrid index that fuses semantic and keyword search across 83,000+ reusable solutions](/blog/case-study-bayer/ai-hub-search-fabric.png)

And agents use the exact same search to equip themselves. When a session exposes more than a handful of tools, a tool-discovery layer embeds the user's request, searches the Hub, and hands the model only the dozen or so tools that fit the step. The agent can call a `discover_tools` command to pull in more on the fly, or find a specialist assistant and delegate to it as a subagent.

That same search decides which of a 430-tool surface to build eagerly versus defer, cutting agent startup from more than five seconds to under two. A personal recommendations feed closes the loop, surfacing solutions a given user has not found yet. Build something once, and it becomes discoverable everywhere, by every colleague and every agent on the platform.

The scale of the tool ecosystem creates its own retrieval problem. With more than 100 enterprise tools available, from FDA databases to chemistry engines to internal ServiceNow connectors, sending all tool definitions in every LLM call would consume most of the context window.

Instead, a discovery middleware runs the user's message through AI Hub's Qdrant-backed search on every turn, surfaces only the 12 most relevant tools, and maintains a sticky memory of previously discovered tools via LangGraph checkpoints. The effect is a 70 percent reduction in prompt tokens while keeping every tool reachable.

## Caching Search to Control Agent Cost

Deep agents do not just stress latency; they stress cost. Bayer's agents sometimes run thousands of online search queries, and repeatedly calling external APIs for the same large articles is expensive. To control this, the agent's web-scraping connector writes the chunks it fetches straight back into a dedicated Qdrant collection. The next time a similar question comes in, the agent checks the vector store for something close to what it read before, rather than paying to call the external API again.

![Loop diagram of the Qdrant semantic cache: a deep agent's query hits the cache and reuses stored chunks, or on a miss pays the external search API, chunks and embeds the result, and stores it back for reuse](/blog/case-study-bayer/qdrant-semantic-cache.png)

This turns Qdrant into a semantic cache layer for agentic workloads, reducing both cost and latency on repeated queries. It also surfaces a hard open problem: keeping cached content fresh when the underlying source changes. If an article read last week is edited the week after, the cached version drifts. Managing that synchronization, alongside improving recall, is an ongoing area of work. The semantic cache layer is part of that same body of backend work led by Sobanski, who has focused on keeping agent retrieval both cheap and fresh as the platform scaled.

Qdrant also powers the agent's persistent memory. A dedicated collection stores user-assistant message pairs as hybrid vectors, scoped by account and assistant identity. When a user returns days or weeks later, the agent proactively searches this collection using Reciprocal Rank Fusion with temporal weighting: recent interactions rank higher, but nothing is forgotten. A daily background job backfills any gaps. Now, a researcher can say "continue the analysis we started last Tuesday" and the agent picks up exactly where it left off, grounded in the actual prior exchange rather than a summary.

## Scaling Retrieval: Lessons From the Road to 116K Employees

When myGenAssist served a thousand users, a single Qdrant collection with default settings was sufficient. Documents went in, vectors came out, and search simply worked. Scaling to 116,000 employees meant moving from an experimental prototype to a full-scale production system, one that tests the absolute limits of the surrounding architecture.

Instead of a hard migration, the team adopted a dual-collection strategy. They stood up the new collection alongside the legacy one and routed all new uploads there. At query time, the retriever fans out to both collections, merges the results, and deduplicates them. The legacy collection remains unaware of the new embedder, and the new collection knows nothing of the legacy documents. Over time, as data retention policies deleted older files, the legacy collection naturally aged out and was eventually shut down completely. This meant no expensive recomputation of historical vectors was ever needed: the only overhead was a single additional embedding call for the user's query, a marginal cost for a seamless, zero-downtime migration.

The team's indexing strategy also evolved to match access patterns. For knowledge base collections, the global HNSW index is disabled entirely (`m=0`). Because every query is scoped to a single tenant, building a global graph connecting documents that will never be searched together is wasted compute. Instead, Qdrant relies on payload indexes to build per-tenant subgraphs, ensuring one team's 50,000 documents do not slow down another team's 500. Conversely, curated global datasets like PubMed retain the global index because they are searched without tenant filters.

To manage the memory footprint of this growing dataset, Bayer relies on binary quantization. Quantized vectors remain in RAM for fast initial retrieval, while the full-precision originals are kept on disk. Searches hit the compact index first, then rescore the top candidates against the originals using 3x oversampling to maintain high recall. This architecture allows the cluster to fit within memory limits without doubling infrastructure costs.

![Four scaling lessons from Bayer's deployment: dual-collection migration without re-embedding, count-after-write reconciliation, per-tenant HNSW indexing with m=0, and binary quantization with rescoring](/blog/case-study-bayer/scaling-lessons.png)

These solutions were not about chasing the latest algorithmic trends; they were the practical, battle-tested realities of scaling a system for an enterprise workforce. By solving for state, consistency, and memory at scale, Bayer transitioned from a promising experiment to a hardened, enterprise-grade retrieval engine, one capable of supporting the company's shift toward autonomous agents and delivering measurable business impact.

The collection schema itself reflects enterprise realities. Named vector spaces, dense and sparse, coexist in a single collection. A full-text payload index with word tokenization enables MatchText filtering for exact regulatory identifiers. And Qdrant's native `is_tenant` flag on `knowledge_base_id` partitions query execution so that a single shared collection serves more than 10,000 knowledge bases with per-tenant isolation. No cross-contamination, no per-tenant infrastructure overhead.

Operational resilience at this scale demands coordination across pods. A distributed circuit breaker, implemented with Redis Lua atomics for state transitions, protects all Qdrant operations. If indexing workers detect latency spikes, API pods fail fast within milliseconds rather than queuing requests behind a stalled connection. The circuit's half-open probing ensures automatic recovery without human intervention.

## Measured Outcomes: 20% Efficiency, and a Moving Target

Bayer measures impact through KPI surveys run every six months across two user groups: general users seeking time savings, and researchers running deeper, higher-budget agentic workflows. The headline result so far is a roughly 20% efficiency gain from using the AI platform.

The team is careful not to over-attribute. It does not isolate which component drives which fraction of the gain. But the connection to retrieval is direct: a large part of the efficiency comes from getting grounded responses, and grounding is impossible without the vector store underneath. Hallucinated answers tank survey scores; grounded answers lift them.

> "We've seen 20% efficiency when it comes to using AI platforms. A big part of that gain is that you have to get results from AI that are grounded. If you get hallucinations, people are not satisfied. It wouldn't be possible without the components." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

With the recent shift to more autonomous agents, the measurement problem itself is evolving. Earlier chatbot-style systems delivered incremental time savings: a faster email summary, a quicker draft. The new agents can run for 10 to 15 minutes unattended and return a completed task: research done, document written, a notification sent to the user's phone. That changes the question from "how much time did we save" to "how well was the whole task done," a harder thing to quantify but a larger prize.

That last mile, meeting people where they already work, runs through myGenAssist Claw, the Microsoft Teams integration built by Hendrik Hogertz (myGenAssist senior developer), which lets an employee @-mention the assistant inside a Teams channel and hand it a task without ever leaving the conversation.

But efficiency is a means, not an end. The real question for a company like Bayer is whether the platform can accelerate what the company exists to do.

In 2026, the ambition moves beyond efficiency. The platform is orienting toward the core missions of a life sciences company: agentic drug discovery pipelines where autonomous agents navigate literature, chemical databases, and clinical evidence to surface novel hypotheses; chemical research workflows where agents propose, evaluate, and iterate on molecular candidates with human scientists in the loop; and regulatory preparation where agents assemble submission packages from scattered internal knowledge, every claim grounded and every citation verified. The retrieval layer, Qdrant, becomes the connective tissue that makes these workflows possible, because an agent that cannot find the right paper, the right structure, or the right prior result at the right moment cannot do science.

The collaboration model itself is bidirectional and auditable. When an agent produces an artifact (a research report, a data visualization, a presentation, or a structured analysis), it renders live in the user interface. The scientist can edit it directly: refine a conclusion, correct a chemical structure, adjust a figure. The agent sees those edits on the next turn and incorporates them, creating a transparent co-authoring loop between human expertise and machine scale. Every step of this exchange, every retrieval, every generation, every human edit, is traced in Langfuse with full cost attribution and latency breakdowns. For scientific discovery, where reproducibility and audit trails are non-negotiable, this means any result can be reconstructed: which sources were consulted, which model produced the synthesis, and where the human refined the output.

In a regulated industry, trust is not optional. Every retrieval hit from Qdrant surfaces as an inline citation in the user interface: a clickable reference that reveals the exact chunk text, source document, and a deep link into the knowledge base viewer. Users can inspect and even edit the source data without leaving the conversation. For pharmaceutical compliance, where every claim must trace back to an authoritative source, this closes the loop between AI-generated answers and auditable evidence.

Traceability extends beyond user-facing citations into the infrastructure itself. Every agent session, from tool selection through retrieval to final response, is captured as a structured trace in Langfuse, with cost attribution per model call and latency breakdowns per middleware hop. Prometheus metrics track Qdrant operation health in real time: query latency percentiles, circuit breaker state transitions, RRF fallback rates, and collection-level indexing throughput. For a life sciences company operating under GxP expectations, this observability layer is not a luxury. It means that when a regulatory auditor asks how a particular answer was generated, the platform can reconstruct the full retrieval path, which collections were queried, which chunks scored highest, and which model produced the synthesis, down to the millisecond.

## Staying Current: Quantization, Indexing, and Feature Velocity

The Bayer team actively tracks Qdrant releases and adopts performance features as they ship. It uses incremental HNSW indexing to absorb the constant stream of document updates without full reindexing. It adopted binary quantization to compact points and reduce the memory footprint shortly after release. One engineer recently went through the latest Qdrant publications to update the team's search strategy and apply current optimizations.

> "Qdrant is one of the more feature-rich platforms where you can do all those things directly inside the vector store. We always try to be on top of the features you push out to reduce the memory footprint and the latency." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

This matters to Bayer because it reduces the gap between a published optimization and a deployed one. When Qdrant ships something like improved compression, Bayer can fold it into a live, compliance-bound, enterprise-scale platform without re-architecting.

## Why a Composable Engine, Not a Black Box

Bayer's experience drove an architectural conviction to focus on retrieval rather than agent orchestration. Even when Bayer ships an end-to-end agent that handles everything, its users still prefer access to the underlying pieces. Developers building on the platform's API want lower-level components they can inspect and optimize, not an opaque pipeline they have to trust blindly.

> "People still prefer to have access to these pieces themselves, like Qdrant. It's very important to give developers a platform that's composable, where they can optimize each part and build their own workflows. Not all agentic pipelines are applicable to all use cases." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer

That preference is sharpened by the proliferation of hyperscaler agent frameworks. With Google, AWS, and Azure each pushing their own solutions, teams struggle to manage and optimize systems they cannot see into. A composable engine that exposes its retrieval primitives lets engineers build pipelines tuned to their specific workload, rather than accepting opaque defaults.

## What's Next

Bayer's roadmap continues to push on the dimensions that drew it to Qdrant in the first place: lower and more predictable latency, higher retrieval quality, and broader deployment options. The team plans to scale its clusters further as data and application count grow, expand its omnimodal search capabilities, and deepen the observability and regression testing around its retrieval pipeline.

## From Prototype to Enterprise Search Engine

Bayer started with a Redis prototype and a thousand users. Three years later, it runs a compliance-bound, Hybrid Cloud deployment serving 116,000 employees, processing millions of messages a month, grounding autonomous agents, and increasingly searching across every modality the company produces. Qdrant has been the constant underneath that evolution: the retrieval layer that keeps answers grounded, the API the agents call directly, and the composable foundation that has adapted as Bayer's AI workloads shifted from chatbots to agents.

> "We're turning into the AI search engine for the company. There are various applications for a vector database even beyond simple RAG, beyond the chatbot. It supports memory for the agent, it powers enterprise search, and it lets any team build their own multimodal search engine on top." - Hooman Sedghamiz, Senior Director AI/ML - Precision Medicine & Insights, Bayer
