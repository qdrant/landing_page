---
title: Serverless
short_description: "Run vector search on Qdrant Serverless with no nodes to provision, no capacity to plan, and no index parameters to tune."
description: "Qdrant Serverless offers cloud-based vector search that scales with demand. Learn what the platform manages, what you decide, and how Serverless compares with a dedicated cluster."
weight: 270
partition: deploy
---

# About Qdrant Serverless

Qdrant Serverless is vector search with no nodes to provision, no capacity to plan, and no index parameters to tune. You choose a precision tier for each vector. Qdrant handles quantization and HNSW tuning, and scales capacity with demand.

Serverless has the same retrieval features as a dedicated cluster: dense and sparse vectors, multivectors, payload filtering, and hybrid queries.

Qdrant and you split the responsibilities as follows:

| Area | Owner |
|---|---|
| Quantization and memory tiering | Qdrant |
| HNSW index parameters | Qdrant |
| Optimizer scheduling and segment layout | Qdrant |
| Scaling, up and down | Qdrant |
| Sharding and replication | Qdrant |
| Spaces and collections | You |
| Vector schema of each collection | You |
| Precision tier of each vector | You |
| Payload indexes | You |

## When to Use Serverless

Serverless fits workloads where data size and traffic are hard to predict, or vary widely from one part of the workload to another. The platform scales capacity up and down with demand, so you don't size for the peak and then carry that capacity through quiet periods.

- **Large multi-tenant applications.** Many tenants, each with different data sizes and traffic patterns, are hard to size on a fixed cluster. On Serverless, small and large tenants share a space without per-tenant capacity planning. A space supports far more collections than a dedicated cluster, so use one collection per tenant.
- **Low or uneven search traffic.** Workloads with low query volume, or traffic that arrives in bursts, don't need a cluster sized for the busiest hour. Capacity follows the traffic as it rises and falls.
- **Constantly changing data volumes.** When the amount of data grows and shrinks all the time, you don't resize nodes or plan storage ahead. The platform adjusts quantization, indexing, and memory tiering as your collections change.

Use a dedicated cluster instead for larger single-tenant workloads, especially where low latency is critical. A dedicated cluster is also the choice when you need:

- A choice of cloud provider (AWS, GCP, or Azure), for example for compliance, instead of only a region
- Fine control over index and quantization settings
- Update or delete by filter
- Audit logging, private links, or encryption with customer-managed keys

For all differences, see [Limitations and Differences](#limitations-and-differences). For a side-by-side comparison, see [Dedicated Clusters or Serverless](/documentation/managed-cloud/#dedicated-clusters-or-serverless).

## Qdrant Serverless Concepts

### Spaces

The central concept in Qdrant Serverless is the ***space***, the serverless equivalent of a cluster. A space is the container of your collections. It's the unit you secure, monitor, and back up. You can access the collections in a space with an API key.

Each space has:

- A unique name
- An endpoint
- One or more API keys
- A set of collections

You can create multiple spaces to logically separate sets of collections. You can use spaces to logically separate use cases, applications, or deployment environments.

### Precision Tiers

Instead of configuring index parameters and quantization directly, Serverless replaces that with one setting per vector: the precision tier. Each precision tier corresponds to a datatype, quantization method and memory tier configuration.

These tiers are available:

- Full
- High (default)
- Medium
- Low

We do not publish the exact configuration for each tier. To choose a precision tier, benchmark against your data to get to the precision you need.

## Limitations and Differences

Serverless exposes a smaller surface than a dedicated cluster. Some features aren't supported. Other differences are the trade you're making: the platform can only take capacity, tuning, and scaling off your hands by owning them outright.

To move collections from a dedicated cluster to Serverless, see [Migrate to Serverless](/documentation/serverless/migrate/).

### Not Supported

**Changing a collection after creation.** You can't add or remove a named vector, add a payload index, or change vector parameters. Declare the full schema when you create the collection.

To change a schema, create a new collection with the configuration you want, upload your points again, then delete the old collection. This mainly affects embedding model migration: plan to upload your points again instead of adding a new vector in place.

**Other features.** Collection aliases, private links, data encryption with customer-managed keys, and audit logging aren't supported.

### Differences by Design

- **No cluster management.** There are no nodes, shards, or replicas to operate, and no version to pin or upgrade.
- **Updates by ID only.** Upserts and deletes take point IDs. Update by filter and delete by filter are rejected, which keeps writes cheap and independent of search.
- **Read consistency and shard selection are ignored.** The query API accepts both parameters and ignores them, so existing query code ports over unchanged.
- **No snapshots API.** Use managed [backups](/documentation/serverless/backups/) instead.
- **Stricter quotas.** Serverless limits spaces per account, vectors per collection, storage per collection, and request sizes. See [Quotas and Limits](/documentation/serverless/quotas-and-limits/).

#### Delayed Update Visibility

Serverless separates the write path from the read path. An update goes onto a queue, a background updater applies it to storage, and search workers reload changed data on their next check. With `wait=false`, a point isn't searchable the moment the update call returns.

- Setting `wait=true` makes the call return only after the update is applied and the search workers have loaded it, so the point is searchable when the call returns. The client libraries don't all default to the same `wait` value. See [Updates](/documentation/interfaces/#updates) in API & SDKs.
- Under a heavy write load, Serverless defers new points until they're indexed. Deferred points aren't searchable yet, and an updated point keeps returning its previous version until the new one is indexed. `wait=true` doesn't wait for indexing, so this can happen even with `wait=true`.
- The point count reflects the last applied write. On a new collection it's absent until the updater has written statistics; a missing or stale count is normal.

Write your application so it tolerates this delay. Reading a point back immediately after writing it and treating a miss as an error will produce false failures.

For a side-by-side comparison of Serverless and dedicated clusters, see [Dedicated Clusters or Serverless](/documentation/managed-cloud/#dedicated-clusters-or-serverless).
