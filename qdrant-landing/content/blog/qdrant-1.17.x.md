---
title: "Qdrant 1.17 - Relevance Feedback & Search Latency Improvements"
draft: false
slug: qdrant-1.17.x
short_description: "Version 1.17 of Qdrant features a new Relevance Feedback Query and search latency improvements."
description: "Version 1.17 of Qdrant features a new Relevance Feedback Query, search latency improvements, and better operational observability."
preview_image: /blog/qdrant-1.17.x/social_preview.jpg
social_preview_image: /blog/qdrant-1.17.x/social_preview.jpg
date: 2026-02-12T00:00:00-08:00
author: Abdon Pijpelink
featured: true
tags:
  - vector search
  - relevance feedback
  - search performance
  - observability
---

[**Qdrant 1.17.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.17.0) Let’s look at the main features for this version:

**Relevance Feedback Query:** Improve the quality of search results by incorporating information about their relevance.

**Search Latency Improvements:** Two search latency improvements: a change to improve search latency under high write loads, and delayed fan-outs to reduce tail latency.

**Greater Operational Observability:** Improved insights into operational metrics and faster troubleshooting with a new cluster-wide telemetry API and segment optimization monitoring.

## Relevance Feedback Query

![Section 1](/blog/qdrant-1.17.x/section-1.png)

Crafting queries is hard: users often struggle to precisely formulate search queries. At the same time, judging the relevance of a given search result is often much easier. Retrieval systems can leverage this [relevance feedback](/articles/search-feedback-loop/) to iteratively refine results toward user intent.

This release introduces a new [Relevance Feedback Query](/documentation/concepts/search-relevance/#relevance-feedback) as a scalable, vector‑native approach to incorporating relevance feedback. The Relevance Feedback Query uses a small amount of model‑generated feedback to guide the retriever through the entire vector space, effectively nudging search toward “more relevant” results without requiring expensive loops, expensive retrievers, or human labeling. This enables the engine to traverse billions of vectors with improved recall without having to retrain models.

This method works by collecting lightweight feedback on just a few top results, creating “context pairs” of more‑ and less‑relevant examples. These pairs define a signal that adjusts the scoring function during the next retrieval pass. Instead of rewriting queries or rescoring large batches of documents, Qdrant modifies how similarity is computed. [Experiments](/articles/relevance-feedback) demonstrate substantial gains, especially when pairing expressive retrievers with strong feedback models.

<figure>
  <img width="75%" src="/blog/qdrant-1.17.x/relevance_feedback_scoring.png">
  <figcaption>
    Feedback-based scoring combines a candidate’s similarity to a query with its relative distances (delta) to the positive and negative items in context pairs.
  </figcaption>
</figure>

## Search Latency Improvements

![Section 2](/blog/qdrant-1.17.x/section-2.png)

This release includes several changes that reduce search latency. To improve query response times in environments with high write loads, Qdrant can now be configured to avoid creating large unoptimized segments. Additionally, delayed fan-outs help reduce tail latency by querying a second replica if the first does not respond within a configurable latency threshold.

### Improved Search Performance Under High Write Loads

A common pattern with search engines like Qdrant involves periodically refreshing data from an external source of truth, for example, using nightly batch updates. Newly ingested data needs to be indexed, which is a resource-intensive operation. When the data ingestion rate exceeds the indexing rate, this can lead to issues such as:

- Back-pressure and rejected update operations due to a full update queue.
- Slow queries over data that has not yet been indexed.

This release addresses these issues by changing how data is ingested. Shards still process data through the familiar stages: WAL persistence, queued updates, application to unoptimized segments, and eventual full indexing, but two new features reshape how systems behave under heavy write load. 

A new [update queue](/documentation/guides/low-latency-search/#query-indexed-data-only) tracks up to one million pending changes. When the queue fills, back pressure slows incoming writes, preventing runaway load and helping clusters stay stable even during large batch operations or recovery after downtime.

For applications that demand consistently low-latency search, indexed‑only mode ensures queries touch only fully indexed segments. A side-effect of using indexed-only queries was that they could temporarily hide the newest updates, before they were indexed. A new [`prevent_unoptimized` optimizer setting](/documentation/guides/low-latency-search/#query-indexed-data-only) solves this by throttling updates to match the indexing rate, reducing the creation of large unoptimized segments. 

Together, these features give developers tighter control over write throughput, indexing behavior, and search performance, especially in high‑volume environments.

### Reduced Tail Latency with Delayed Fan-Outs

By default, a search operation queries a single replica of each shard within a collection. If one of these replicas responds slowly due to load or network issues, this negatively impacts the overall search latency. This phenomenon, where a single slow replica increases the 95th or 99th percentile latency of the entire system, is known as “tail latency.” High tail latency can noticeably degrade the user experience.

To mitigate tail latency for read operations, this release introduces a new [delayed fan-out](/documentation/guides/low-latency-search/#use-delayed-fan-outs) feature. With delayed fan-outs, if the initial request to a replica exceeds a configurable latency threshold, an additional read request is sent to another replica, and Qdrant will use the first available response. Delayed fan-outs help your application provide a consistent, low latency experience to end-users.

## Greater Operational Observability

![Section 3](/blog/qdrant-1.17.x/section-3.png)

We are continuously working to enhance the operational observability of Qdrant clusters. In this release, we introduce two new features: a new cluster-wide telemetry API and segment optimization monitoring.

### Cluster-Wide Telemetry

Qdrant’s API exposes a `/telemetry` endpoint which provides information about the current state of a peer in a cluster, including the number of vectors, shards, and other useful information. However, obtaining a complete view of the entire cluster using this endpoint is not straightforward, requiring querying each peer and piecing together a complete view yourself.

In version 1.17, we’re introducing a new [`/cluster/telemetry` endpoint](/documentation/guides/monitoring/#cluster-wide-telemetry). This API provides information about all peers in a cluster, offering insights into cluster-wide operations such as leader elections, resharding, and shard transfers.

### Segment Optimization Monitoring

Optimization is a background process where Qdrant removes data marked for deletion, merges segments, and creates indexes. To improve visibility into this process, this release introduces [segment optimization monitoring capabilities](/documentation/concepts/optimizer/#optimization-monitoring).

A new `/collections/{collection_name}/optimizations` API endpoint provides the current optimization status, as well as detailed information for current and past optimization operations. Because the output of the API can be verbose, we’ve added a new Optimizations tab to the Collections interface in the Web UI that makes it easier to analyze the data. Here, you can find an overview of the current optimization status, a timeline of current and past optimization operations, and a breakdown of the tasks in a specific cycle and their durations.

<figure>
  <img width="75%" src="/blog/qdrant-1.17.x/optimizer-web-ui.png">
  <figcaption>
    The new user interface in the Web UI provides an overview of the current optimization status and a timeline of current and past optimization cycles.
  </figcaption>
</figure>

## Redesigned Web UI Point Search

![Section 5](/blog/qdrant-1.17.x/section-4.png)

[Web UI](/documentation/web-ui/) is Qdrant’s user interface for managing deployments and collections. It enables you to create and manage collections, run API calls, import sample datasets, and learn about Qdrant's API through interactive tutorials.

In this release, we have redesigned the point search interface in the Web UI to make exploring your data and discovering relevant points easier and more intuitive. The new two-field layout enables searching for points similar to another point, filtering by payload values, and finding points by ID. 

<figure>
  <img src="/blog/qdrant-1.17.x/web-ui-search.png">
  <figcaption>
    The redesigned point search interface in the Web UI provides a way to find points similar to another point and filter on payload values.
  </figcaption>
</figure>

## Honorable Mentions

![Section 5](/blog/qdrant-1.17.x/section-5.png)

As an open source project, we welcome contributions from the Qdrant community. This release features two contributions from community members:

- Not all payload field indexes are used in combination with dense vector queries. With this release, you can [specify whether individual payload field indexes should be reflected in the HNSW index](/documentation/concepts/indexing/#disable-the-creation-of-extra-edges-for-payload-fields).
- A new API endpoint is available to [list all user-defined shard keys](/documentation/guides/distributed_deployment/#user-defined-sharding).

Additionally, this release adds the following features:

- Upserts now support an [update mode](/documentation/concepts/points/#update-mode) for insert-only or update-only operations.
- To speed up the recovery of the replicas after they’ve been down, shards will [increase the size of their write-ahead log](https://github.com/qdrant/qdrant/pull/7834) when they detect that one of their remote replicas is unavailable.
- Reciprocal Rank Fusion (RRF) combines multiple query results into one list, but its default equal weighting can let weaker rankers dilute stronger ones. [Weighted RRF](/documentation/concepts/hybrid-queries/#reciprocal-rank-fusion-rrf) in Qdrant 1.17 addresses this by letting you assign weights to individual queries.
- A new [user interface in the Web UI enables resharding collections](https://github.com/qdrant/qdrant-web-ui/pull/341) on Qdrant Cloud.
- Qdrant now supports [audit logging](/documentation/guides/security/#audit-logging) to track all API operations that require authentication or authorization.
- [External provider API keys for inference requests](/documentation/concepts/inference/#external-embedding-model-providers) can now be provided in the request header.

For a full list of all changes in version 1.17, please refer to the [change log](https://github.com/qdrant/qdrant/releases/tag/v1.17.0).

## Upgrading to Version 1.17

![Section 6](/blog/qdrant-1.17.x/section-6.png)

In Qdrant Cloud, navigate to the Cluster Details screen and select Version 1.17 from the dropdown menu. The upgrade process may take a few moments.
We recommend upgrading versions one by one, for example, 1.15->1.16->1.17. On Qdrant Cloud, the required intermediate updates are automatically performed to ensure a supported upgrade path.

## Engage

![Section 7](/blog/qdrant-1.17.x/section-7.png)

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues).
