---
title: Multitenancy
weight: 12
aliases:
  - ../tutorials/multiple-partitions
  - /tutorials/multiple-partitions/
---
# Configure Multitenancy

**How many collections should you create?** In most cases, you should only use a single collection with payload-based partitioning. This approach is called multitenancy. It is efficient for most of users, but it requires additional configuration. This document will show you how to set it up.

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
When specified, storage structure will be organized in a way to co-locate vectors of the same tenant together, which can significantly improve performance in some cases. 


## Limitations

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.
