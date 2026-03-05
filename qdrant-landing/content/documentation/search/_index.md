---
title: Search
weight: 203
partition: develop
---
# Search

Qdrant provides a rich set of search capabilities — from simple nearest-neighbor lookup to advanced hybrid and filtered queries.

- **[Search](/documentation/search/search/)** — Similarity search using dense vectors; configure top-k, score thresholds, and result pagination.
- **[Search Relevance](/documentation/search/search-relevance/)** — Score boosting, MMR, decay functions, and relevance feedback for custom ranking.
- **[Low-Latency Search](/documentation/search/low-latency-search/)** — Horizontal scaling, delayed fan-outs, and indexed-only queries for consistent low latency.
- **[Explore](/documentation/search/explore/)** — Recommendation and discovery APIs: find similar points or explore the vector space without a query vector.
- **[Hybrid Queries](/documentation/search/hybrid-queries/)** — Fuse dense and sparse vector scores (e.g., semantic + keyword) in a single query.
- **[Filtering](/documentation/search/filtering/)** — Combine vector search with structured payload filters for precise, conditional retrieval.
- **[Full-Text Search](/documentation/search/text-search/)** — Keyword search over payload fields using Qdrant's built-in text index.
