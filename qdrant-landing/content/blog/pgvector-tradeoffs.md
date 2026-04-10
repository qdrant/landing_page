---
draft: false
title: "Start with pgvector: Why You'll Outgrow It Faster Than You Think"
short_description: "We analyzed 110+ community threads to test the 'just use pgvector' heuristic. Here are the six conditions that must all hold — and why most apps fail at least two."
description: "We analyzed 110+ community threads from Hacker News and Reddit to test the 'just use pgvector' heuristic. pgvector is a reasonable default, but only when six specific conditions hold simultaneously. Most applications hit its limits sooner than expected."
date: 2026-03-17T00:00:00Z
author: Nathan LeRoy
featured: false
preview_image: /blog/pgvector-tradeoffs/preview_image.png
social_image: /blog/pgvector-tradeoffs/preview_image.png
tags:
  - pgvector
  - vector-database
  - postgres
---

The most common advice in every vector database thread online is some version of "start with pgvector, graduate later." We analyzed 110+ community threads from Hacker News and Reddit to see if the data supports this heuristic. The short answer is that it's more nuanced than it sounds, and most applications will hit its limits sooner than expected.

---

## The Appeal of "Just Use pgvector"

This advice is attractive for obvious reasons. If you're already running Postgres — and most teams are — pgvector gives you vector search without new infrastructure, new ops burden, or new sync headaches. One system, one deployment.

> *"My decision tree looks like this: Use pgvector until I have a very specific reason not to."*

> *"Default to pgvector, avoid premature optimization."*

The people giving this advice are usually running Postgres for transactional data and found pgvector sufficient for a few thousand vectors. For that use case it works.

---

## Six Conditions That Must All Hold

After reading through these 110+ threads, a clear pattern emerged. The developers who are happy with pgvector are more than just lucky. They share a specific set of circumstances. We distilled these into six conditions. When all six hold, pgvector is genuinely the right call: you get vector search without operational overhead, and the tradeoffs don't bite you.

However, all six need to hold *simultaneously*. The moment one or two fall away, the pain points that dominate these threads start showing up: slow queries under load, broken filtered search, missing hybrid capabilities. These are scenarios most production applications land in within months of shipping.

Here are the six conditions:

**1. Your vector dataset is under ~1M vectors.** The community's empirical ceiling is around 10M, but the comfortable range is much lower. Above 1M you'll start hitting index-build times, memory pressure, and recall degradation under load.

This threshold is also easier to hit than you'd expect — especially if you're working with **multivectors**. Techniques like ColBERT-style late interaction generate one embedding *per token* rather than one per document, so a corpus of 100K documents can easily balloon into tens of millions of vectors overnight. Qdrant, by contrast, has [native multivector support](/documentation/manage-data/vectors/#multivectors) with dedicated documentation and query APIs built around it.

**2. You don't need accurate metadata filtering.** If every search is against the full collection, post-filtering won't limit you. But the moment you need to scope searches to a user, tenant, category, or any selective predicate, pgvector generates unnecessary search overhead.

> *"I think the most relevant weakness for pgvector is the lack of 'proper' prefiltering on metadata while leveraging the vector index."*

Qdrant takes an entirely different approach to filtering. Specifically, Qdrant utilizes a [filterable HNSW](/documentation/manage-data/indexing/#filtrable-index) which lets you traverse the nearest-neighbor graph while maintaining metadata filters.

**3. Your embeddings are tightly coupled to relational data.** If vectors are just an attribute of a row (e.g., a product description embedding alongside the product), colocation helps. If vectors are first-class entities, the argument for co-location weakens.

**4. You don't need hybrid search.** While pgvector supports dense vector similarity search via HNSW, the Postgres extension ecosystem still lacks a high-quality BM25 implementation — a critical component for hybrid search.

Postgres *does* have full-text search via `tsvector`/`tsquery`, and it's excellent for what it does. But that's lexical search — exact term matches, stemming, and stop words. BM25 is a probabilistic model that considers term frequency, inverse document frequency, and document length. Qdrant supports [native BM25 via sparse vectors](/documentation/manage-data/vectors/#sparse-vectors). They're not the same thing.

**5. Postgres is already doing the heavy lifting for your business logic.** You have existing transactions, schemas, and ACID guarantees that matter. Adding a second data store splits that concern. If Postgres is truly central, the operational argument for colocation is real.

**6. Your team is small and search logic in SQL is manageable.** Embedding search logic in the database is typically an anti-pattern, but for small teams with simple search needs, pgvector's colocation reduces cognitive overhead.

---

## Most Applications Fail at Least Two of These

Individually, each of these six criteria are not hard to satisfy. However, you need *all six* to hold in order to comfortably stay within pgvector, and hitting two or three disqualifiers happens fast.

Consider a typical B2B SaaS product that adds search. You'll almost certainly need tenant-scoped filtering (condition 2 fails). If you're searching structured content — product names, SKUs, technical specs — you'll want hybrid search (condition 4 fails). And your dataset will cross 1M faster than you expect once you're embedding documents, document chunks, and metadata (condition 1 is under pressure).

That's three conditions gone before you've even thought about scale. People are quick to point out that you might not immediately outgrow pgvector in terms of *scale*, but you almost certainly very quickly outgrow it in terms of *features*.

---

## Where Dedicated Stores Win

When the conditions above don't all hold, dedicated vector stores offer concrete advantages:

- **Efficient metadata filtering** — pre-filter on metadata fields before computing similarity, avoiding wasted work on irrelevant vectors
- **Native hybrid search** — combine dense similarity and BM25 keyword matching in a single query with [reciprocal rank fusion](/documentation/search/hybrid-queries/)
- **Scale beyond 10M vectors** — purpose-built sharding, distributed indexing, and memory management
- **Decoupled architecture** — scale, optimize, and evolve your search layer independently of your relational database

---

## The Sync Problem Is Real — But Solvable

There's a reason the "start with pgvector" advice persists despite these limitations. The #1 pain point developers report when running a dedicated vector store alongside Postgres is keeping them in sync:

> *"It was a PITA keeping data synced between pgsql <> qdrant."*

> *"One of the biggest nightmares with Pinecone was keeping the data in sync... With pg_vector integrated directly into my main database, this synchronization problem has completely disappeared."*

This is a legitimate concern, and we don't want to dismiss it. However, it's also a solved problem with well-known patterns, ranging from simple dual-writes for prototypes to transactional outbox patterns for production, to full CDC pipelines for high-throughput systems.

If you've decided you need a dedicated vector store, don't let sync anxiety push you back to pgvector. Our [Postgres-Qdrant Data Synchronization guide](/documentation/data-synchronization/with-postgres/) walks through three progressively robust sync architectures — each with working code, failure mode analysis, and clear guidance on when to use which.