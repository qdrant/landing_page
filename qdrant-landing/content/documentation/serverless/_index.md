---
title: Serverless
short_description: "Run vector search on Qdrant Serverless with no nodes to provision, no capacity to plan, and no index parameters to tune."
description: "Qdrant Serverless offers cloud-based vector search that scales with demand. Learn what the platform manages, what you decide, and how Serverless compares with a dedicated cluster."
weight: 270
partition: deploy
---

# Understanding Serverless

Vector search usually means committing to infrastructure before you understand the workload: how many nodes, how much RAM, which quantization scheme, what HNSW parameters. Underestimate and you're adding capacity under load. Get it right and you still pay for headroom during quiet hours.

Qdrant Serverless removes these decisions: it offers cloud-based vector search with no nodes to provision, no capacity to plan, and no quantization or HNSW parameters to tune. Instead, you define a single precision tier per vector. The platform takes care of quantization and HNSW tuning and automatically scales with demand.

Qdrant Serverless delivers the same retrieval capabilities as a dedicated cluster: dense and sparse vectors, multivectors, payload filtering, and hybrid queries are all supported.

Qdrant and you split the responsibilities as follows:

| Area | Owner |
|---|---|
| **Quantization and memory tiering** | Qdrant |
| **HNSW index parameters** | Qdrant |
| **Optimizer scheduling and segment layout** | Qdrant |
| **Scaling, up and down** | Qdrant |
| **Sharding and replication** | Qdrant |
| **Spaces and collections** | You |
| **Vector schema of each collection** | You |
| **Precision tier of each vector** | You |
| **Payload indexes** | You |

## What Serverless Is Good For

Serverless fits workloads where data size and traffic are hard to predict, or vary widely from one part of the workload to another. The platform scales capacity up and down with demand, so you don't size for the peak and then carry that capacity through quiet periods.

- **Large multi-tenant applications.** Many tenants, each with different data sizes and traffic patterns, are hard to size on a fixed cluster. On Serverless, small and large tenants share a space without per-tenant capacity planning. A space supports far more collections than a dedicated cluster, so use one collection per tenant.
- **Low or uneven search traffic.** Workloads with low query volume, or traffic that arrives in bursts, don't need a cluster sized for the busiest hour. Capacity follows the traffic as it rises and falls.
- **Constantly changing data volumes.** When the amount of data grows and shrinks all the time, you don't resize nodes or plan storage ahead. The platform adjusts quantization, indexing, and memory tiering as your collections change.

Dedicated clusters remain the best fit for larger single-tenant workloads, especially where low latency is critical. They're also the way to go if the cloud provider matters to you, for example for compliance: on a dedicated cluster you choose between AWS, GCP, and Azure, while on Serverless you choose only the region. And they're the better choice if you need fine control over index and quantization settings, update or delete by filter, audit logging, private links, or encryption with customer-managed keys. [Limitations and Differences](#limitations-and-differences), below, covers the differences in detail.

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

### Delayed Update Visibility

Serverless separates the write path from the read path. An update goes onto a queue, a background updater applies it to storage, and search workers reload changed data on their next check. A point isn't searchable the moment the update call returns.

- Setting `wait=true` makes the call return only after the update is applied to storage, confirming durability. Search workers still have to pick up the change, so the point isn't searchable immediately.
- The point count reflects the last applied write. On a new collection it's absent until the updater has written statistics; a missing or stale count is normal.

Write your application so it tolerates this delay. Reading a point back immediately after writing it and treating a miss as an error will produce false failures.

### Account Quotas

Each account has a maximum number of spaces, which can be raised on request. A space supports far more collections than a dedicated cluster, though each collection is soft limited at around 1 million vectors. Each space also has a collection size cap: once a collection reaches it, further writes are rejected. See [Quotas and Limits](/documentation/serverless/quotas-and-limits/).

## Limitations and Differences

Serverless exposes a smaller surface than a dedicated cluster. Some of that is temporary and will close. The rest is the trade you're making: the platform can only take capacity, tuning, and scaling off your hands by owning them outright.

### Not Yet Supported

**Changing a collection after creation.** You can't add or remove a named vector, add a payload index, or change vector parameters. Declare the full schema when you create the collection.

To change a schema today, create a new collection with the configuration you want, upload your points again, then delete the old collection. This mainly affects embedding model migration: plan to upload your points again instead of adding a new vector in place.

**Collection aliases.** Not available yet.

**Cloud Inference.** Compute embeddings yourself, for example with [FastEmbed](https://github.com/qdrant/fastembed).

**Private links.** Not available yet.

**Data encryption with customer-managed keys.** Not available yet.

**Audit logging.** Not available yet.

### Differences by Design

- **No cluster management.** There are no nodes, shards, or replicas to operate, and no version to pin or upgrade.
- **Updates by ID only.** Upserts and deletes take point IDs. Update by filter and delete by filter are rejected, which keeps writes cheap and independent of search.
- **Read consistency and shard selection are ignored.** The query API accepts both parameters and ignores them, so existing query code ports over unchanged.
- **No snapshots API.** Use managed [backups](/documentation/serverless/backups/) instead.

### Serverless Compared with a Dedicated Cluster

| Capability | Serverless | Dedicated cluster |
|---|---|---|
| Sizing and scaling | Handled by the platform | You choose CPU, RAM, and node count |
| Cloud provider | Handled by the platform. You choose only the region. | You choose AWS, GCP, or Azure |
| Qdrant version | Handled by the platform | You choose it and schedule upgrades |
| Index and quantization tuning | One precision tier per vector | Full control over HNSW, quantization, and storage |
| Collection changes after creation | Not yet supported | Supported |
| Client | `QdrantServerless` | `QdrantClient` |
| Update visibility | Delayed until search workers reload | Immediate once the write is applied |
| Update operations | Upserts and deletes by point ID | Full, including update and delete by filter |
| Backups | Managed backups, per space or per collection | Snapshots and managed backups |
| Dense, sparse, named, and multivectors | Supported | Supported |
| Hybrid search | Supported | Supported |
| Distance metrics | Cosine, Dot, Euclid, Manhattan | Cosine, Dot, Euclid, Manhattan |
