---
title: "Choose a Multitenancy Design"
short_description: "Choose payload partitioning, dedicated shards, tiered multitenancy, or separate collections for your tenants."
description: "Choose a Qdrant multitenancy design from tenant sizes, collection settings, resource requirements, and access controls."
social_preview_image: /articles_data/multitenancy/preview/social_preview.jpg
preview_dir: /articles_data/multitenancy/preview
small_preview_image: /articles_data/multitenancy/icon.svg
weight: 60
author: David Myriel
date: 2024-02-06T13:21:00.000Z
draft: false
keywords:
  - multitenancy
  - custom sharding
  - multiple partitions
  - vector database
aliases:
  - /articles/multitenancy/
---

# Choose a Multitenancy Design

Choose a design from the number of tenants, their relative sizes, and their isolation requirements. Start with payload-based partitioning when many tenants share the same collection configuration. Use dedicated shards or collections when a tenant needs different capacity or configuration.

| Workload or constraint | Starting design | Main trade-off |
| --- | --- | --- |
| Many small tenants with similar data and vector configuration. | One collection with a tenant payload field and index. | Tenants share collection resources and configuration. |
| A few large tenants and many small tenants. | Tiered multitenancy with shared and dedicated shards. | You must plan shard capacity and tenant promotion. |
| A small number of tenants need separate collection configuration or collection-level permissions. | Separate collections. | Each collection adds resource and operational overhead. |
| A tenant's data must reside on specific nodes. | Custom shard keys and explicit shard placement. | You must manage shard placement and capacity. |

These choices can be combined. For example, a custom shard can contain several tenants separated by payload filters.

## Keep Small Tenants in a Shared Collection

Add a tenant identifier, such as `group_id`, to every point's payload. Create a keyword index with `is_tenant: true` on that field. Qdrant can then organize points from the same tenant together. The flag is available from Qdrant 1.11.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/with-group-id-as-tenant/" >}}

Include the [tenant filter](/documentation/manage-data/multitenancy/#partition-by-payload) in each query, update, and delete operation that selects points by payload. Derive the tenant identity from the authenticated user, rather than accepting an unrestricted tenant ID from the request.

{{< island path="content/documentation/headless/multitenancy/shared-collection" ratio="720 / 278" title="Both tenants share one collection. The `group_id` payload field identifies which tenant owns each point." >}}
![In the tenant_data collection, points 1 and 2 have group_id=tenant_1, and point 3 has group_id=tenant_2. Each point also has its own vector.](/articles_data/multitenancy/multitenancy-single.svg)
{{< /island >}}

The tenant index helps storage and search. It does not authorize requests. A client with unrestricted credentials can omit the filter and access other tenants' points.

### Check Whether Shared Resources Fit

A shared collection reduces collection overhead, but its tenants still share resources. Measure latency and indexing behavior for both small and large tenants under the expected concurrent workload.

If indexing is the bottleneck and every search uses a tenant filter, consider the [per-tenant HNSW configuration](/documentation/manage-data/multitenancy/#calibrate-performance). Setting `m: 0` disables the global graph. A positive `payload_m` retains payload-aware links. Queries without the tenant filter then become slower, so use this configuration only when that trade-off fits the workload.

Sparse retrieval can also share scoring statistics across tenants. Follow [per-tenant scoring statistics](/documentation/manage-data/multitenancy/#per-tenant-scoring-statistics) when each tenant needs its own relevance statistics.

## Give Large Tenants Dedicated Shards

Use [custom sharding](/documentation/manage-data/multitenancy/#user-defined-sharding) when queries should target a specific group of shards. Create the collection with user-defined sharding, create its shard keys, and send the appropriate shard key with reads and writes. Follow [moving shards](/documentation/scaling/distributed_deployment/#moving-shards) to control which nodes hold the replicas. Verify their locations with the collection cluster info API. On Qdrant Cloud, disable automatic shard rebalancing before manually controlling shard distribution.

A shard key selects where an operation runs. A payload filter selects which points match within those shards. Use both when a shard contains several tenants.

Dedicated shards consume resources, so creating one for every small tenant can add unnecessary overhead. Prefer payload partitioning for the long tail of small tenants.

### Plan for Uneven Tenant Growth

[Tiered multitenancy](/documentation/manage-data/multitenancy/#tiered-multitenancy), available from Qdrant 1.16, combines shared and dedicated shards in one collection. Small tenants share a fallback shard. A large tenant can move to a dedicated shard while keeping the same collection.

Configure payload-based tenancy as well as shard routing. The tenant filter remains necessary when a request reaches the shared fallback shard. Follow the documented promotion procedure for moving points and validating the result.

Choose custom sharding when creating the collection if this growth path is required. You cannot change an existing collection's sharding method in place. Plan capacity carefully: the shared fallback shard must fit on one node.

## Use Separate Collections for Different Requirements

Separate collections are useful when a limited number of tenants need different vector schemas, collection settings, or collection-level permissions. They also add resource overhead and increase the number of collections to operate.

Prefer a shared collection when tenants use the same data model and can share its settings. Measure the cost of separate collections before choosing one per tenant.

## Enforce Tenant Access

Keep Qdrant behind an authenticated application, or issue appropriately restricted credentials. The application must enforce tenant filters and shard routing for every operation it exposes. Qdrant also supports [granular access keys](/documentation/security/#granular-access-api-keys) for collection permissions. Keep administrative keys on trusted services.

Validate the chosen design with queries for separate tenants and with attempts to omit or change the tenant identifier. Check that small tenants keep acceptable latency while a large tenant ingests data. Use those results to decide whether shared resources, dedicated shards, or separate collections fit the workload.
