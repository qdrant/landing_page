---
title: Multitenancy
short_description: "Partition tenants in a single Qdrant collection with payload-based filtering and per-tenant indexes for clean isolation."
description: "Set up Qdrant multitenancy with payload-based partitioning and per-tenant indexes for tenant isolation, predictable performance, and lower cluster overhead."
weight: 40
aliases:
  - ../tutorials/multiple-partitions
  - /tutorials/multiple-partitions/
---
# Configure Multitenancy

Many applications serve multiple users, customers, or organizations ("tenants") from a shared deployment. Each tenant's data must stay isolated: when a tenant searches, they should only see their own data. Qdrant offers several solutions for keeping tenants' data separated within a shared deployment.

Creating a separate collection for each tenant is rarely the most efficient approach. Each collection carries its own resource overhead, so creating many collections can quickly become expensive. Only create multiple collections when you have a limited number of tenants that need strict isolation.

<aside role="status">
Qdrant Cloud <a href="/documentation/cloud/configure-cluster/">limits each cluster to a maximum of 1000 collections</a> by default.
</aside>

Instead, keep all tenants in a single collection and use one of these three approaches to isolate them:

- [**Partition by payload**](#partition-by-payload) filters points by a payload field that identifies the tenant. This is efficient for a large number of small, similarly-sized tenants.
- [**User-defined sharding**](#user-defined-sharding) gives each tenant its own dedicated shard. This trades some resource overhead for stronger isolation, and is best suited to a smaller number of larger tenants.
- [**Tiered multitenancy**](#tiered-multitenancy) combines the two: small tenants share a single shard while large tenants get promoted to their own dedicated shard.

## Partition by Payload

To partition data in a shared collection, add a payload field that identifies the tenant to each point. You can then filter by this field to ensure that each tenant only sees their own data.

This example uses `group_id` as the tenant field. Start by creating a keyword payload index for the tenant field:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/with-group-id-as-tenant/" >}}

<aside role="status">
    The <code>is_tenant</code> parameter is available as of v1.11.0. Previous versions should use default options for keyword index creation.
</aside>

The `is_tenant=true` parameter is optional, but specifying it gives Qdrant additional information about the collection's usage patterns.
When set, Qdrant organizes the storage structure to co-locate vectors of the same tenant together, which can significantly improve performance by utilizing sequential reads during queries.

{{< figure src="/docs/defragmentation.png" alt="Tenants defragmentation with is_tenant" caption="Grouping tenants together by tenant ID, if `is_tenant=true` is used, enables more efficient disk reads (curly brackets). Rather than many random seeks across the file, Qdrant can read the data for a specific tenant with a sequential read." width="90%" >}}

Next, insert points with the tenant ID in the payload:

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-tenant-group-id/" >}}

<aside role="status">
    The key doesn't need to be named <code>group_id</code>. You can choose any name.
</aside>

Query with a filter on `group_id` to return only one tenant's data:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-filter-by-group-id/" >}}

### Calibrate Performance

Indexing speed can become a bottleneck when many tenants share a collection, since their vectors are all indexed together. To avoid this bottleneck, consider disabling the global vector index for the collection and building it only for individual groups instead.

By adopting this strategy, Qdrant indexes vectors for each tenant independently, significantly accelerating the process.

To implement this approach:

1. Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
2. Set `m` in the HNSW configuration to 0. This disables the global index for the collection.\
{{< code-snippet path="/documentation/headless/snippets/create-collection/with-disabled-global-hnsw/" >}}

### Limitations

- Global requests (without the `group_id` filter) are slower, since they require scanning all groups to identify the nearest neighbors.
- When using [sparse vector search](/documentation/search/text-search/full-text-search/) with the [IDF modifier](/documentation/manage-data/indexing/#idf-modifier), payload-based partitioning alone doesn't isolate IDF statistics. By default, all tenants share the same shard-wide term frequencies. Use the [`idf` search parameter](#per-tenant-idf-statistics) to scope statistics to a single tenant.

### Per-Tenant IDF Statistics

*Available as of v1.19.0*

[BM25](/documentation/search/text-search/full-text-search/#bm25) and [miniCOIL](/documentation/search/text-search/full-text-search/#minicoil) sparse vector searches use the [inverse document frequency (IDF)](documentation/manage-data/indexing/#idf-modifier) to score matching documents, giving rarer terms more weight than common ones. Calculating the IDF requires two statistics: the total number of documents and the number of documents containing each term.

By default, these statistics are computed across the entire shard being queried. When using payload-filter-based multitenancy, this blends every tenant's vocabulary into one set of statistics, so a term's IDF no longer reflects its rarity within a specific tenant's data.

The `idf` search parameter lets you correct this by narrowing the population — the *IDF corpus* — that Qdrant computes statistics over. It accepts a payload filter that scopes the data.

This filter is independent of the retrieval filter. The filter that determines the IDF corpus is typically broader than the retrieval filter. For example, here, the IDF is calculated over all of a tenant's data even when the retrieval filter narrows further by year:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-bm25-idf-corpus/" >}}

- `idf` defaults to `global` (shard-wide statistics), the same as omitting it.
- [Create a payload index](/documentation/manage-data/indexing/#create-a-payload-index) and/or [tenant index](/documentation/manage-data/indexing/#tenant-index) for any fields you want to use in the `idf` filter. On Qdrant Cloud, [strict mode is enabled by default](/documentation/cloud/configure-cluster/) and filters on unindexed fields are rejected.
- Only applicable to queries on a sparse vector with the [IDF modifier](/documentation/manage-data/indexing/#idf-modifier) enabled; using `idf` on a vector without it returns an error.
- If the corpus filter matches no points, IDF statistics do not fall back to shard-wide statistics. Instead, every term gets the same constant weight, so ranking degenerates to plain TF with no rarity signal.
- When using [user-defined sharding](#user-defined-sharding), routing a search request to a single tenant's dedicated shard already scopes IDF to that tenant's data. This shard locality also applies to the `idf` filter: if it matches points that live in a different shard than the one being queried, Qdrant does not reach across shards to satisfy it. It silently computes statistics from whatever overlap exists locally, which can be empty or partial.

## User-Defined Sharding

*Available as of v1.7.0*

Instead of filtering tenants by a payload field, another way to separate tenants is to give each tenant its own dedicated shard. Qdrant lets you specify the shard for each point individually, so operations for a tenant only ever touch that tenant's shard. This trades some resource overhead (each shard has its own storage and index structures) for stronger isolation, and works best for a modest number of large tenants.

To use this approach, create a collection with [custom sharding](/documentation/scaling/distributed_deployment/#user-defined-sharding) enabled:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-custom-sharding/" >}}

Then create a shard for each tenant, using the tenant ID as the shard key ([API reference](https://api.qdrant.tech/api-reference/distributed/create-shard-key#request)):

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard/" >}}

To route a point to its tenant's shard, provide the `shard_key` field in the upsert request:

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-custom-shard/" >}}

Specify the same `shard_key` in query requests to search only within that tenant's shard.

Shards require significant resources, so keep the number of tenants low enough that each can have its own shard. For large numbers of tenants, use [partition by payload](#partition-by-payload) or [tiered multitenancy](#tiered-multitenancy) instead.

## Tiered Multitenancy

*Available as of v1.16.0*

In some real-world applications, tenants aren't always equally distributed. For example, a SaaS application might have a few large customers and many small ones.
Large tenants might require more resources and isolation, while small tenants shouldn't add too much overhead.

One solution is to add application-level logic to separate tenants into different collections based on their size or resource requirements.
There is, however, a downside to this approach: you might not know in advance which tenants will be large and which will stay small.
Additionally, application-level logic increases system complexity and requires an additional source of truth for managing tenant placement.

To address this problem, Qdrant provides a built-in mechanism called ***tiered multitenancy***. With tiered multitenancy, you can implement two levels of tenant isolation within a single collection:
- Keep small tenants together in a single shared shard.
- Isolate large tenants into their own dedicated shards.

There are three components in Qdrant that allow you to implement tiered multitenancy:

- [**User-defined Sharding**](/documentation/scaling/distributed_deployment/#user-defined-sharding) allows you to create named shards within a collection. It allows you to isolate large tenants into their own shards.
- **Fallback shards** - a special routing mechanism that allows you to route requests to either a dedicated shard (if it exists) or to a shared fallback shard. It allows you to keep requests unified, without the need to know whether a tenant is dedicated or shared.
- **Tenant promotion** - a mechanism that allows you to move tenants from the shared fallback shard to their own dedicated shard when they grow large enough. This process is based on Qdrant's internal shard transfer mechanism, which makes promotion completely transparent for the application. The promotion process supports both read and write requests.

{{< figure src="/docs/tenant-promotion.png" alt="Tiered multitenancy with tenant promotion" caption="Tiered multitenancy with tenant promotion" width="90%" >}}

### Configure Tiered Multitenancy

To take advantage of tiered multitenancy, you need to create a collection with user-defined (also known as `custom`) sharding and create a fallback shard in it.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-custom-sharding/" >}}

Start by creating a fallback shard, which will be used to store small tenants.
Let's name it `default`.

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard-default/" >}}

Since the collection will allow both dedicated and shared tenants, you still need to configure payload-based tenancy the same way as described in the [Partition by Payload](#partition-by-payload) section. Specifically, create a payload index for the `group_id` field with `is_tenant=true`.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/with-group-id-as-tenant/" >}}

### Query Tiered Multitenant Collection

Now you can start uploading data into the collection. Unlike basic payload-based multitenancy, you need to specify the **Shard Key Selector** in each request to reach the correct shard.

The Shard Key Selector will specify two keys:
 
 - `target` shard - name of the tenant's dedicated shard (which may or may not exist).
 - `fallback` shard - name of the shared fallback shard (in this example, `default`).


{{< code-snippet path="/documentation/headless/snippets/insert-points/with-tenant-group-id-and-fallback-shard-key/" >}}

The routing logic will work as follows:

- If the `target` shard exists and is active, the request will be routed to it.
- If the `target` shard does not exist, the request will be routed to the `fallback` shard.

Similarly, when querying points, specify the Shard Key Selector and filter by `group_id`.
The `group_id` filter value must match the `target` shard key.


### Promote Tenant to Dedicated Shard

When a tenant grows large enough, you can promote it to its own dedicated shard.
To do this, first create a new shard for the tenant:

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard-for-promotion/" >}}

The shard is created in `Partial` state, since it still needs to receive data.

Use the `replicate_points` API to initiate data transfer:

{{< code-snippet path="/documentation/headless/snippets/shard-transfer/with-filter/" >}}

Once the transfer is complete, the target shard will become `Active`, and all requests for the tenant will be routed to it automatically.
At this point it's safe to delete the tenant's data from the shared fallback shard to free up space.


### Limitations

- The fallback shard is limited to a single shard, though it can still be replicated across nodes for availability. This means all small tenants sharing the fallback shard must fit within the storage and write capacity of a single node. We plan to remove this restriction in a future release.
- Similar to collections, dedicated shards introduce some resource overhead. Don't create more than a thousand dedicated shards per cluster. The recommended threshold for promoting a tenant is the same as the indexing threshold for a single collection, which is approximately 20,000 points.

