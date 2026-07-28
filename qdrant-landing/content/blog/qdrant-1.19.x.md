---
title: "Qdrant 1.19 - TurboQuant Datatype & Memory Tiers"
draft: false
slug: qdrant-1.19.x
short_description: "Version 1.19 of Qdrant introduces the TurboQuant datatype, a new storage format that reduces disk usage by up to nine times."
description: "Version 1.19 of Qdrant introduces the TurboQuant datatype for major storage savings, unified memory tier configuration, replica read affinity, and full-text search enhancements."
preview_image: /blog/qdrant-1.19.x/social_preview.jpg
social_preview_image: /blog/qdrant-1.19.x/social_preview.jpg
date: 2026-07-28T00:00:00-08:00
author: Andrey Vasnetsov
featured: true
tags:
  - vector search
  - quantization
  - memory management
  - full-text search
---

[**Qdrant 1.19.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.19.0) Let's look at the main features for this version:

**TurboQuant Datatype:** A new storage format that compresses vectors to four bits without keeping their original full-precision representation, reducing storage up to nine times compared to TurboQuant quantization.

**Memory Tiers:** A single `memory` parameter unifies per-component memory tier placement, with three tiers: `pinned`, `cached`, and `cold`.

**Replica Read Affinity:** Pin a user's reads to the same replica across requests, eliminating the read inconsistency that can appear in replicated clusters.

**Full-Text Search Enhancements:** Three new capabilities for full-text search workloads: prefix matching on keyword fields, language-neutral BM25 text processing, and per-query IDF statistics.

**Enhanced Collection Visualizations:** Several improvements to the Collection Visualizer, raising the practical point limit from a few thousand to tens of thousands, with new ways to explore data.

## TurboQuant Datatype

![Section 1](/blog/qdrant-1.19.x/section-1.png)

Version 1.18 introduced [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), a quantization method that compresses vectors at minimal loss to recall. It operates as a secondary layer: Qdrant keeps the original full-precision vectors on disk alongside the compressed copy, using the quantized representation during HNSW traversal and rescoring against the original vectors for accuracy. The two-copy model delivers good recall, but storing both representations increases disk usage.

In version 1.19, we have applied the same innovative method to storage itself: the **[TurboQuant datatype](/documentation/manage-data/vectors/#turbo4)** (`datatype: turbo4`), a new storage type that applies 4-bit TurboQuant compression as the only vector representation, without keeping a full-precision copy.

Storing only the 4-bit representation drops storage from 36 bits per coordinate (the full float32 original plus the 4-bit compressed copy) to just four bits, resulting in a ninefold reduction. This reduces data reads and writes per operation, improving throughput. The same compression applies to multi-vector collections used for ColBERT-style late interaction search, where the benefit is proportionally larger.

That ninefold storage reduction comes at a cost: without a full-precision copy, Qdrant cannot rescore top candidates against the original vectors. This makes the TurboQuant datatype the right choice when reducing disk usage is the primary goal. When maximum recall is the priority, TurboQuant quantization on top of a full-precision storage type remains the better option.

## Memory Tiers

![Section 2](/blog/qdrant-1.19.x/section-2.png)

Every component of a Qdrant collection has its own memory footprint: vectors, the HNSW index, quantized vectors, the sparse index, payloads, and payload indexes. Until now, each had its own way to configure whether that data is loaded into RAM or served from disk: `on_disk`, `always_ram`, and `on_disk_payload`. This release replaces these parameters with a single, unified `memory` parameter. It works the same way on every component, giving you one consistent way to configure the memory tier for any part of a collection.

There are three memory tiers: `pinned` loads the component entirely into memory, where it's never evicted (for components that support it); `cached` keeps data on disk and pre-populates the OS disk cache at startup for fast first reads while remaining evictable under memory pressure; and `cold` loads it lazily on first access. The existing per-component flags remain functional but are deprecated.

Beyond cleaner configuration, version 1.19 also adds new capabilities: HNSW graph links can now be pinned in memory, sparse indexes have gained a new `cached` tier, and quantized vectors can now be pinned, cached, or cold independently of the original vectors' placement.

## Replica Read Affinity

![Section 3](/blog/qdrant-1.19.x/section-3.png)

In a Qdrant cluster with multiple replicas, updates don't always become visible at exactly the same time across every replica. This can cause a "blinking" problem: if sequential read requests from the same client land on different replicas, a point that appeared in the first response might disappear in the next. For search pipelines that issue multiple requests per user action, this inconsistency can produce confusing results or break downstream logic entirely.

Version 1.19 introduces replica read affinity. You can now provide an `X-Qdrant-Route-Affinity` HTTP header with each read request, which Qdrant uses as a seed to deterministically order the replicas for each shard. The same seed value consistently prefers the same replica regardless of which node received the request, though a change in replica availability can shift where a given seed routes. A user ID or session ID makes a good seed, since it keeps each user's own reads pinned to the same replica. Different values are spread across replicas, so read load is still balanced across users.

## Full-Text Search Enhancements

![Section 4](/blog/qdrant-1.19.x/section-4.png)

While Qdrant is primarily a vector search engine, many applications require a combination of vector search and traditional full-text search. For that reason, we're continuously enhancing Qdrant's full-text search capabilities. In this release, we're introducing three new features to improve the full-text search experience.

### Prefix Matching on Keyword Fields

Keyword indexes store values verbatim for exact matching, which is the right choice for identifiers like URLs, file paths, and SKUs. Filtering by prefix over these values, like *"find all entries where the URL starts with **`https://qdrant.`**"*, wasn't possible without either a full payload scan or switching to a text index, which tokenizes values and breaks exact matching.

This release adds **prefix matching** to keyword indexes. Enable it with `"prefix": true` in the keyword index configuration, then use the `prefix` condition in your filter. Prefix queries are served from a dedicated index structure, making them as fast as any other indexed filter.

### BM25: Language-Neutral Text Processing

[BM25 text processing](/documentation/search/text-search/full-text-search/#bm25-text-processing) applies English stemming and stopword removal by default. You can change the language to one of the other supported languages, but in some cases (technical content, product identifiers, or multilingual text), you may want to disable stemming and stopword removal entirely. Until this release, Qdrant did not have a clean way to do that.

Version 1.19 lets you turn off stemming entirely. Paired with disabling stopword removal, that gives you a clean, [language-neutral text search pipeline](/documentation/search/text-search/full-text-search/#language-neutral-text-processing).

### Per-Query IDF Statistics

Sparse vector search commonly uses the inverse document frequency (IDF) to score matching documents, giving rarer terms more weight than common ones. Calculating the IDF requires two statistics: the total number of documents and the number of documents containing each term.

Qdrant computes these statistics for the complete dataset in each shard being queried, which creates a problem for multi-tenant collections. If tenant A's documents use different vocabulary than tenant B's, blending both populations into one set of statistics distorts a term's IDF, so it no longer reflects how rare that term is within either tenant's data.

Version 1.19 lets you narrow the corpus that the IDF statistics are computed over, for example down to a single tenant, so the IDF reflects term rarity within that tenant's data rather than the whole collection.

## Enhanced Collection Visualizations

![Section 5](/blog/qdrant-1.19.x/section-5.png)

The Qdrant Web UI lets you manage deployments and collections. One of its tools, the Collection Visualizer, shows interactive 2D visualizations of your vectors, so you can visually explore your data and see how your data clusters.

In this release, the Collection Visualizer has moved from a browser-side pipeline to a server-driven one. Qdrant now computes distances through the Distance Matrix API instead of the browser downloading raw vectors, and the layout engine runs in WebAssembly for a much more responsive experience. Together, these changes raise the practical point limit from a few thousand to tens of thousands, and a new WebGL2 renderer keeps panning and zooming smoothly at that scale.

The Collection Visualizer also gains new ways to explore a collection: click a point to see its nearest neighbors highlighted, or Shift+drag to select a region of points to open a selection panel listing them, with one-click copy for their IDs, JSON, or a matching filter. You can also apply a filter to highlight matching points.

![Screenshot of the improved Collection Visualizer in the Qdrant Web UI](/blog/qdrant-1.19.x/web-ui-1.19.png)

## Also in This Release

![Section 6](/blog/qdrant-1.19.x/section-6.png)

- **Slice Filter Condition**: A new [`slice` filter condition](/documentation/search/filtering/#slice) that groups a collection's points into deterministic, disjoint subsets. Use it to scroll through a collection in parallel across multiple workers, or to reproducibly sample the same subset of points across queries.
- **Faster Faceting**: [Faceting](/documentation/manage-data/payload/#facet-counts) is a query feature that counts how many points match each distinct value of a payload field within a filtered result set. In 1.19, facet queries are faster, especially on large collections with high-cardinality fields.
- **[Strict Mode: `max_disk_usage_percent`](/documentation/ops-configuration/administration/#maximum-disk-usage)**: A new [strict mode](/documentation/ops-configuration/administration/#strict-mode) guardrail that blocks disk-consuming write operations, such as upserts and payload or vector updates, once disk usage exceeds a configured percentage. Deletes remain allowed so you can free up space, and the goal is to prevent nodes from running out of disk space mid-operation.
- **Removal of deprecated endpoints**: The legacy `/search`, `/recommend`, and `/discover` endpoints have now been removed. The unified `/query` API [superseded these endpoints in version 1.10](/blog/qdrant-1.10.x/#one-endpoint-for-all-queries). If you still use these endpoints, migrate to the [`/query` API](/documentation/search/search/#query-api) before upgrading to 1.19.

For a full list of all changes in version 1.19, see the [changelog](https://github.com/qdrant/qdrant/releases/tag/v1.19.0).

## Upgrading to Version 1.19

![Section 7](/blog/qdrant-1.19.x/section-7.png)

On Qdrant Cloud, navigate to the Cluster Details screen and select Version 1.19 from the dropdown menu. The upgrade process may take a few moments.

We recommend upgrading versions one by one. On Qdrant Cloud, this is done automatically when you select the target version. If you're self-hosting, upgrade to the latest patch version of each intermediate minor version first, for example 1.17.x→1.18.x→1.19.0.

> If you still use the legacy `/search`, `/recommend`, or `/discover` endpoints, migrate to the [`/query` API](/documentation/search/search/#query-api) before upgrading to 1.19.

## Engage

![Section 8](/blog/qdrant-1.19.x/section-8.png)

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues).
