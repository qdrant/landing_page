---
title: "Qdrant 1.18 - TurboQuant"
draft: false
slug: qdrant-1.18.x
short_description: "Version 1.18 of Qdrant introduces TurboQuant, a novel quantization method."
description: "Version 1.18 of Qdrant introduces TurboQuant, a novel quantization method with better accuracy at every compression ratio."
preview_image: /blog/qdrant-1.18.x/social_preview.jpg
social_preview_image: /blog/qdrant-1.18.x/social_preview.jpg
date: 2026-04-30T00:00:00-08:00
author: Abdon Pijpelink
featured: true
tags:
  - vector search
  - quantization
  - observability
  - memory monitoring
---

[**Qdrant 1.18.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.18.0) Let's look at the main features for this version:

**TurboQuant:** A new quantization method that delivers better accuracy than binary and scalar quantization at equivalent compression ratios, and works with any vector distribution.

**Memory Monitoring:** Inspect a collection's disk, RAM, and page cache usage broken down by component (vectors, payload, indexes, and more) via a new Web UI view and API endpoint.

**Adding and Removing Named Vectors:** Add or remove named vectors to an existing collection's schema without having to recreate it.

Additionally, version 1.18 adds two improvements to audit logging: a new API endpoint to query audit logs, and support for request tracing IDs. It also introduces per-collection API metrics and two new strict mode guardrails.

## TurboQuant

![Section 1](/blog/qdrant-1.18.x/section-1.png)

Quantization is a technique that reduces the memory footprint of a vector collection by compressing floating-point values to a lower bit depth. Smaller vectors fit more readily in memory, which speeds up search and lowers infrastructure costs.

Choosing a quantization method means accepting tradeoffs. Binary quantization is fast but requires a centered vector distribution, and accuracy degrades significantly for smaller vectors. Scalar quantization is reliable but compresses only by a factor of four. Product quantization compresses more aggressively, but at the cost of accuracy and speed. There was no single method that worked well across all vector distributions and dimensions.

Version 1.18 introduces support for [TurboQuant](/documentation/manage-data/quantization/), a new quantization method developed by [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/). TurboQuant applies a fast Hadamard rotation to vectors before compression, which redistributes values evenly across coordinates. Because this rotation normalizes the data distribution, TurboQuant works well with any embedding model.

Qdrant extends the original TurboQuant algorithm with per-segment calibration. For fully indexed (immutable) segments, Qdrant collects per-segment coordinate statistics and uses them to tune quantization levels to the actual data distribution, improving accuracy beyond what the base algorithm provides.

TurboQuant delivers better accuracy than other quantization methods at the same compression ratio. As a new feature, it's worth testing on your data before committing, but we encourage you to try it on new collections.

To get started, refer to the [quantization documentation](/documentation/manage-data/quantization/).

### How TurboQuant Compares

TODO: results of benchmarking.

## Memory Monitoring

![Section 2](/blog/qdrant-1.18.x/section-2.png)

Understanding how much memory a Qdrant collection actually uses has traditionally required cross-referencing OS-level tools, Prometheus gauges, and rough estimates based on collection configuration. There was no straightforward way to see which component (vectors, payload, indexes) was consuming memory, making capacity planning and diagnosing memory pressure difficult.

Version 1.18 introduces [collection memory monitoring](/documentation/ops-monitoring/memory-usage/), offering a detailed breakdown of disk, RAM, and OS page cache usage per component, summed across the whole cluster.

In Web UI, open the collection detail page and select the **Memory** tab to see the memory breakdown.

<figure>
  <img width="75%" src="/blog/qdrant-1.18.x/memory-usage.png" alt="The Memory tab showing a breakdown of disk, RAM, cached, and expected cache values per collection component.">
  <figcaption>
    The Memory tab shows disk, RAM, and cached usage for each component of the collection.
  </figcaption>
</figure>

The same data is available through Qdrant's API.

## Adding and Removing Named Vectors

![Section 4](/blog/qdrant-1.18.x/section-3.png)

When a collection's vector schema needed to change, for example, when adding support for a new embedding model or retiring an old one, there was no way to update it in place. The only option was to recreate the collection from scratch and re-ingest all points.

Version 1.18 makes it possible to [add and remove named vectors](/documentation/manage-data/collections/#update-vectors) to an existing collection's schema without having to recreate it. This makes embedding model migration considerably easier. You can now add a new vector field, populate it in the background, and remove the old one when you're ready.

## Audit Logging Improvements

![Section 3](/blog/qdrant-1.18.x/section-4.png)

[Audit logging](/documentation/security/#audit-logging) was introduced in Qdrant 1.17 to track API operations. Version 1.18 adds two improvements: a new API endpoint to query audit logs, and support for attaching tracing IDs to requests.

### Query Audit Logs

Audit logs were previously only accessible as files on disk, which meant reviewing them required direct server access. There was no way to easily search, filter, or aggregate log entries, making security reviews and compliance audits labor-intensive.

Version 1.18 introduces a [new query audit logs API endpoint](/documentation/security/#query-audit-logs). It returns log entries aggregated across all nodes in a cluster, with each entry covering the timestamp, API method, authentication type, access result, and client details. You can filter results by time range or by any field value.

### Request Tracing IDs

When an audit log entry records a denied request or an unexpected operation, it can be hard to link that entry back to the client-side request that triggered it, making incident response and debugging harder than it needs to be.

Version 1.18 adds support for [request tracing IDs](/documentation/security/#audit-logging). Attach a tracing ID to any request by passing it in the `x-request-id`, `x-tracing-id`, or `traceparent` header. Qdrant records the tracing ID in the corresponding audit log entry, enabling you to correlate client-side and server-side logs.

## Per-Collection API Metrics

![Section 5](/blog/qdrant-1.18.x/section-5.png)

Qdrant's `/metrics` endpoint exposes REST and gRPC response metrics, but they were aggregated across all collections. When response times spiked or error rates climbed, there was no EASY way to identify which collection was responsible.

Version 1.18 adds a [`?per_collection=true` parameter](/documentation/ops-monitoring/monitoring/#per-collection-api-metrics) to the `/metrics` endpoint. When set, the `rest_responses_*` and `grpc_responses_*` metrics include a `collection` label, giving you a per-collection breakdown of request counts, failure counts, and response durations.

## New Strict Mode Guardrails

![Section 6](/blog/qdrant-1.18.x/section-6.png)

[Strict mode](/documentation/ops-configuration/administration/#strict-mode) lets administrators set guardrails to prevent inefficient API requests from overloading your system. Version 1.18 adds two new guardrails to strict mode:

**`max_resident_memory_percent`**: Rejects memory-consuming write operations when the process's resident memory exceeds the specified percentage of total system memory. This protects against out-of-memory situations under sustained data ingestion.

**`search_max_batchsize`**: Caps the number of queries allowed in a single batch search request, preventing oversized batches from degrading other workloads running on the same node.

## Full Change Log

![Section 7](/blog/qdrant-1.18.x/section-7.png)

For a full list of all changes in version 1.18, refer to the [change log](https://github.com/qdrant/qdrant/releases/tag/v1.18.0).

## Upgrading to Version 1.18

![Section 8](/blog/qdrant-1.18.x/section-8.png)

On Qdrant Cloud, navigate to the Cluster Details screen and select Version 1.18 from the dropdown menu. The upgrade process may take a few moments.

We recommend upgrading versions one by one. On Qdrant Cloud, this is done automatically when you select the target version. If you're self-hosting, upgrade to the latest patch version of each intermediate minor version first, for example 1.16.x→1.17.x→1.18.0.

## Engage

![Section 9](/blog/qdrant-1.18.x/section-9.png)

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues).
