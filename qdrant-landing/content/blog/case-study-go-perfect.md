---
draft: false
title: "How GoPerfect Built an Agentic Recruiting Workforce with Qdrant Cloud"
short_description: "How GoPerfect Built an Agentic Recruiting Workforce with Qdrant Cloud"
description: "How GoPerfect Built an Agentic Recruiting Workforce with Qdrant Cloud"
preview_image: /blog/case-study-goperfect/social_preview_goperfect.png
social_preview_image: /blog/case-study-goperfect/social_preview_goperfect.png
date: 2026-05-19
author: "Daniel Azoulai"
featured: false

tags:
- Goperfect
- vector search
- semantic search
- multivector
- recruiting
- agentic
- case study
partition: case-studies
---

![bento-box](/blog/case-study-goperfect/go-perfect-bento.png)

GoPerfect mission is to use an AI recruiting workforce that replaces the manual, low-leverage parts of recruiting. Instead, an agent decomposes recruiter intent and runs the work end to end to find top talent.  Their agentic platform handles sourcing, scanning, reviewing, outreach, admin work as well as  candidate conversations for recruiters, hiring managers, agencies, and CEOs who hire at volume. 

![screenshot](/blog/case-study-goperfect/goperfect_screenshot.png)

Recruiting is a needle-in-a-haystack problem with two complications: the haystack is massive (over 100 million people in the US alone, enriched into profiles drawn from professional networks, code repositories, company data, and AI-derived signals), and the definition of the "needle" is more nuanced than any keyword filter can express. A product manager is not a product marketer, even though the two sit close together in any reasonable embedding space.

### Why vector search alone hit a ceiling

Most people assume you can just throw a talent database at GPT and get great candidates back. But LLMs alone can't do this. They can't hold 100M profiles in context, they hallucinate on structured matching, speed and relevance rate. The real breakthrough is combining LLM reasoning with semantic search, vector retrieval, and structured filtering into an orchestrated system. That's the moat.

GoPerfect's previous vector architecture worked at small scale with purely semantic dense embeddings. But as the talent pool grew, the system started returning candidates who looked right semantically and were wrong in practice. GoPerfect measures acceptance rate as the share of surfaced candidates that recruiters accept onto their shortlist. On their previous system, that rate plateaued around 30 percent. For a company whose product thesis is finding unicorns and replacing manual recruiter work, parity wasn't a defensible position.

>"Words can be really close semantically but mean completely different things. A product manager and a product marketer sit right next to each other in embedding space. They're not the same job."    
— Idan Shaked, Head of R\&D, GoPerfect             

Large language models alone could not close the gap either. Even if a recruiter wanted to drop 100 million profiles into a model, the context window will not accommodate that scale, and the model would fail to reason reliably over the corpus. GoPerfect needed a retrieval layer that could narrow a 100 million-profile pool into a high-confidence shortlist before the LLM ever saw it.

### GoPerfect chose Qdrant for Accuracy and Speed

The team needed three things in the retrieval layer: hybrid search that combined semantic and keyword signals to disambiguate close-but-different concepts, multivector support so each candidate could be represented as a structured set of dimensions rather than a single embedding, and predictable retrieval latency under parallel load, so the agent could fan out multiple sub-queries and still return inside an interactive budget.

GoPerfect evaluated multiple vector search engines and ran a structured proof-of-concept against internal KPIs covering acceptance rate, precision at rank one, and pool size. Qdrant won the evaluation. Hybrid search was straightforward to stand up, and the additional retrieval step didn't add the kind of latency that would have broken the agent user experience.

>"Your solution with hybrid search was pretty quick to achieve. It didn't harm anything regarding the search. Qdrant made it much better."    
— Idan Shaked, Head of R\&D, GoPerfect

### The breakthrough: treating each candidate as a structured set of vectors

The initial Qdrant deployment also hit a ceiling. On small pools, recall was strong. Scaled to the full corpus, the system started hallucinating: returning candidates whose overall embedding looked relevant but whose underlying experience didn't match the recruiter's intent.

The fix was structural. GoPerfect moved to a multivector representation in Qdrant, structuring each candidate's profile to support more granular retrieval. At query time, the GoPerfect agent categorizes the recruiter's intent and runs hybrid search across the relevant subset of vectors. The LLM orchestration layer above sits on top of those results and assembles the final ranking. Splitting the representation got results much more accurate; The LLM orchestration loop on top of Qdrant closed the gap to near-perfect.

A single embedding per candidate collapses the nuances a recruiter needs to evaluate independently. It's what composable vector search is designed for: retrieval primitives that engineers combine at query time, tuned to the specific workload, rather than a fixed pipeline that forces the problem to fit the tool.

### From the industry's 30 percent to near-perfect match accuracy

The combined effect of hybrid search, multivector representation, and the LLM orchestration layer moved GoPerfect's match accuracy from the recruiting industry's baseline 30 percent acceptance rate to close to 100 percent in internal benchmarks. Most customers see results in the 95–100% range after the agent's iterative refinement. That's roughly four times the recruiting industry baseline.

>"After we split the vectors, the results were much more accurate. We added the LLM layer above all of it, and that's where we managed to reach near 100 percent accuracy."   
— Idan Shaked, Head of R\&D, GoPerfect

Speed mattered for a non-obvious reason. The agent doesn't run one search per recruiter request. It runs many in parallel and then reasons over the combined result set. A query like "product marketer in San Francisco with 10 must-haves" gets decomposed into multiple parallel sub-queries that probe different category combinations. 

Within GoPerfect's user-facing interactive, sub-agent-loop latency budget, the agent runs multiple parallel sub-queries against Qdrant and reasons over the union before returning a shortlist. Predictable retrieval latency is what makes the chain-of-thought experience feel agentic instead of laggy.

>"Higher accuracy means fewer searches. Recruiters who used to run dozens of queries per role to assemble a shortlist now run one or two."    
— Idan Shaked, Head of R\&D, GoPerfect

### How it works in production

The production pipeline runs in three layers. Ingestion enriches profile data from multiple sources (professional networks, code repositories, company data, and AI-derived signals) and writes structured multivector points into Qdrant. Retrieval combines hybrid search with multivector queries to return a high-confidence candidate pool. An LLM orchestration layer above Qdrant runs the agent loop: it generates sub-questions, issues parallel searches, evaluates the returned candidates, and assembles the final ranked shortlist.

GoPerfect also runs a candidate scoring and fraud-signal layer that cross-references claims in a resume against external evidence. A candidate who lists a programming language, for example, gets validated against their public code activity. The scoring layer also learns from outcomes: when a candidate flagged with a fraud signal goes on to get hired through normal channels, the system weights similar signals more leniently going forward. Recruiters see a graphical view of each candidate that includes both the ranking and the supporting evidence, with adjustable tolerance for fraud signals depending on the role context.

>"With Qdrant, we can offer customers a full agentic experience: a real chain of thoughts, memory, and context. That's what people expect from a true agent today."   
— Eylon Etshtein, CEO, GoPerfect

![pipeline](/blog/case-study-goperfect/goperfect-pipeline-architecture.png)

### What's next

GoPerfect's roadmap extends Qdrant deeper into the recruiting funnel. Near-term work includes richer search criteria, broader fraud-signal coverage with recruiter-adjustable tolerance, ATS integrations, and "agents operating agents" patterns that turn a single recruiter into the conductor of a small army of specialized agents. Longer term, GoPerfect plans to automate progressively more of the hiring funnel 

### From semantic-only to agentic-grade retrieval

GoPerfect encountered what most retrieval systems bump up against when the corpus grows and the queries get more nuanced. Pure semantic similarity returned candidates that looked right and weren't. The move to hybrid, multivector, agent-orchestrated retrieval on Qdrant changed the product's economics. Instead of 30 percent acceptance rates that mirror the rest of the recruiting industry, GoPerfect ships shortlists that recruiters can act on directly. That's the difference between a faster version of the same job and a different category of product.