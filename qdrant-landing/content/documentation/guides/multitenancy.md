---
title: Multitenancy
weight: 12
aliases:
  - ../tutorials/multiple-partitions
  - /tutorials/multiple-partitions/
  - /documentation/guides/multiple-partitions/
---
# Configure Multitenancy

<aside role="alert">
It is not recommended to create hundreds and thousands of collections per cluster as it increases resource overhead unsustainably. Eventually this will lead to increased costs and at some point performance degradation and cluster instability. In Qdrant Cloud, we limit the amount of collections per cluster to 1000.
</aside>

**How many collections should you create?** In most cases, a single collection per embedding model with payload-based partitioning for different tenants and use cases. This approach is called multitenancy. It is efficient for most users, but requires additional configuration. This document will show you how to set it up.

**When should you create multiple collections?** When you have a limited number of users and you need isolation. This approach is flexible, but it may be more costly, since creating numerous collections may result in resource overhead. Also, you need to ensure that they do not affect each other in any way, including performance-wise. 

## Partition by payload

When an instance is shared between multiple users, you may need to partition vectors by user. This is done so that each user can only access their own vectors and can't see the vectors of other users.


<aside role="alert">
    Note: The key doesn't necessarily need to be named <code>group_id</code>. You can choose a name that best suits your data structure and naming conventions.
</aside>

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-tenant-group-id/" >}}

2. Use a filter along with `group_id` to filter vectors for each user.

{{< code-snippet path="/documentation/headless/snippets/query-points/with-filter-by-group-id/" >}}

## Calibrate performance

The speed of indexation may become a bottleneck in this case, as each user's vector will be indexed into the same collection. To avoid this bottleneck, consider _bypassing the construction of a global vector index_ for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

To implement this approach, you should:

1. Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
2. Set `m` in hnsw config to 0. This will disable building global index for the whole collection.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-disabled-global-hnsw/" >}}

3. Create keyword payload index for `group_id` field.

<aside role="alert">
    <code>is_tenant</code> parameter is available as of v1.11.0. Previous versions should use default options for keyword index creation.
</aside>


{{< code-snippet path="/documentation/headless/snippets/create-payload-index/with-group-id-as-tenant/" >}}

`is_tenant=true` parameter is optional, but specifying it provides storage with additional information about the usage patterns the collection is going to use.
When specified, storage structure will be organized in a way to co-locate vectors of the same tenant together, which can significantly improve performance by utilizing sequential reads during queries.


{{< figure src="/docs/defragmentation.png" alt="Tenants defragmentation with is_tenant" caption="Grouping tenants together by tenant ID, if `is_tenant=true` is used" width="90%" >}}



### Limitations

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.


## Tiered multitenancy

In some real-world applications, tenants might not be equally distributed. For example, a SaaS application might have a few large customers and many small ones.
Large tenants might require extended resources and isolation, while small tenants should not create too much overhead.

One solution to this problem might be to introduce application-level logic to separate tenants into different collections based on their size or resource requirements.
There is, however, a downside to this approach: we might not know in advance which tenants will be large and which stay small.
In addition, application-level logic increases complexity of the system and requires additional source of truth for tenant placement management.

To address this problem, in v1.16.0 Qdrant provides a built-in mechanism for tiered multitenancy.

With tiered multitenancy, you can implement two levels of tenant isolation within a single collection, keeping small tenants together inside a shared Shard, while isolating large tenants into their own dedicated Shards.
There are 3 components in Qdrant, that allows you to implement tiered multitenancy:

- [**User-defined Sharding**](/documentation/guides/distributed_deployment/#user-defined-sharding) allows you to create named Shards within a collection. It allows to isolate large tenants into their own Shards.
- **Fallback shards** - a special routing mechanism that allows to route request to either a dedicated Shard (if it exists) or to a shared Fallback Shard. It allows to keep requests unified, without the need to know whether a tenant is dedicated or shared.
- **Tenant promotion** - a mechanism that allows to move tenants from the shared Fallback Shard to their own dedicated Shard when they grow large enough. This process is based on Qdrant's internal shard transfer mechanism, which makes promotion completely transparent for the application. Both read and write requests are supported during the promotion process.


{{< figure src="/docs/tenant-promotion.png" alt="Tiered multitenancy with tenant promotion" caption="Tiered multitenancy with tenant promotion" width="90%" >}}

### Configure tiered multitenancy

To take advantage of tiered multitenancy, you need to create a collection with user-defined (aka `custom`) sharding and create a Fallback Shard in it.


{{< code-snippet path="/documentation/headless/snippets/create-collection/with-custom-sharding/" >}}

Start with creating a fallback Shard, which will be used to store small tenants.
Let's name it `default`.

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard-default/" >}}

Since the collection will allow both dedicated and shared tenants, we need still need to configure payload-based tenancy for this collection the same way as described in the [Partition by payload](#partition-by-payload) section above. Namely, we need to create a payload index for the `group_id` field with `is_tenant=true`.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/with-group-id-as-tenant/" >}}

### Query tiered multitenant collection

Now we can start uploading data into the collection. One important difference from the simple payload-based multitenancy is that now we need to specify the **Shard Key Selector** in each request to route requests to the correct Shard.

 Shard Key Selector will specify two keys: 
 
 - `target` shard - name of the tenant's dedicated Shard (which may or may not exist).
 - `fallback` shard - name of the shared Fallback Shard (in our case, `default`).


{{< code-snippet path="/documentation/headless/snippets/insert-points/with-tenant-group-id-and-fallback-shard-key/" >}}

The routing logic will work as follows:

- If the `target` Shard exists and active, the request will be routed to it.
- If the `target` Shard does not exist, the request will be routed to the `fallback` Shard.

Similarly, when querying points, we need to specify the Shard Key Selector and filter by `group_id`:

<!-- ToDo snippet -->

### Promote tenant to dedicated Shard

When a tenant grows large enough, you can promote it to its own dedicated Shard.
In order to do that, you first need to create a new Shard for the tenant:

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard-for-promotion/" >}}

Note, that we create a Shard in `Partial` state, since it would still need to transfer data into it.

To initiate data transfer, there is another API method called `replicate_points`:

{{< code-snippet path="/documentation/headless/snippets/shard-transfer/with-filter/" >}}

Once transfer is completed, target Shard will become `Active`, and all requests for the tenant will be routed to it automatically.
At this point it is safe to delete the tenant's data from the shared Fallback Shard to free up space.


### Limitations

- Currently, `fallback` Shard may only contain a single shard ID on its own. That means all small tenants must fit a single peer of the cluser. This restriction will be improved in future releases.
- Similar to collections, dedicated Shards introduce some resource overhead. It is not recommended to create more than a thousand dedicated Shards per cluster. Recommended threshold of promoting a tenant is the same as the indexing threshold for a single collection, which is around 20K points.

