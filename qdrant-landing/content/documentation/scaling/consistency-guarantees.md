---
title: Consistency Guarantees
short_description: "Configure Qdrant's write consistency factor, read consistency, and write ordering to trade throughput for stronger consistency guarantees."
description: "Configure Qdrant's consistency guarantees: the write consistency factor, read consistency levels, and write ordering options, with API examples in every client library."
weight: 22
---

# Consistency Guarantees

By default, Qdrant focuses on availability and maximum throughput of search operations, which is a preferable trade-off for most use cases. During normal operation, you can search and modify data from any peer in the cluster: reads use a partial fan-out strategy to optimize latency and availability, and writes execute in parallel on all active sharded replicas.

This means concurrent updates on one point can result in an inconsistent state. For example, if two clients simultaneously update the same point in a collection with three replicas per shard. On some replicas, the point may reflect the update from one client, while on other replicas, the point may reflect the update from the other client.

![Two clients updating the same point at the same time.](/docs/concurrent-operations-replicas.png)

In some cases, it is necessary to ensure additional guarantees during possible hardware instabilities, mass concurrent updates of same documents, etc.

Qdrant provides a few options to control consistency guarantees:

- `write_consistency_factor` - defines the number of replicas that must acknowledge a write operation before responding to the client. Increasing this value will make write operations tolerant to network partitions in the cluster, but will require a higher number of replicas to be active to perform write operations.
- Read `consistency` param, can be used with search and retrieve operations to ensure that the results obtained from all replicas are the same. If this option is used, Qdrant will perform the read operation on multiple replicas and resolve the result according to the selected strategy. This option is useful to avoid data inconsistency in case of concurrent updates of the same documents. This options is preferred if the update operations are frequent and the number of replicas is low.
- Write `ordering` param, can be used with update and delete operations to ensure that the operations are executed in the same order on all replicas. If this option is used, Qdrant will route the operation to the leader replica of the shard and wait for the response before responding to the client. This option is useful to avoid data inconsistency in case of concurrent updates of the same documents. This options is preferred if read operations are more frequent than update and if search performance is critical.


## Write Consistency Factor

The `write_consistency_factor` represents the number of replicas that must acknowledge a write operation before responding to the client. It is set to 1 by default.
It can be configured at the collection's creation or when updating the
collection parameters.

This value can range from 1 to the number of replicas you have for each shard.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-write-consistency-factor/" >}}

Write operations will fail if the number of active replicas is less than the
`write_consistency_factor`. In this case, the client is expected to send the
operation again to ensure a consistent state is reached.

Setting the `write_consistency_factor` to a lower value may allow accepting
writes even if there are unresponsive nodes. Unresponsive nodes are marked as
dead and will automatically be recovered once available to ensure data
consistency.

The configuration of the `write_consistency_factor` is important for adjusting the cluster's behavior when some nodes go offline due to restarts, upgrades, or failures.

By default, the cluster continues to accept updates as long as at least one replica of each shard is online. However, this behavior means that once an offline replica is restored, it will require additional synchronization with the rest of the cluster. In some cases, this synchronization can be resource-intensive and undesirable.

Setting the `write_consistency_factor` to match the replication factor modifies the cluster's behavior so that unreplicated updates are rejected, preventing the need for extra synchronization.

If the update is applied to enough replicas - according to the `write_consistency_factor` - the update will return a successful status. Any replicas that failed to apply the update will be temporarily disabled and are automatically recovered to keep data consistency. If the update could not be applied to enough replicas, it'll return an error and may be partially applied. The user must submit the operation again to ensure data consistency.

For asynchronous updates and injection pipelines capable of handling errors and retries, this strategy might be preferable.


## Read Consistency

Read `consistency` can be specified for most read requests and will ensure that the returned result
is consistent across cluster nodes.

- `all` will query all nodes and return points, which present on all of them
- `majority` will query all nodes and return points, which present on the majority of them
- `quorum` will query randomly selected majority of nodes and return points, which present on all of them
- `1`/`2`/`3`/etc - will query specified number of randomly selected nodes and return points which present on all of them
- default `consistency` is `1`

{{< code-snippet path="/documentation/headless/snippets/query-points/with-consistency-majority/" >}}

## Write Ordering

Write `ordering` can be specified for any write request to serialize it through a single "leader" node,
which ensures that all write operations (issued with the same `ordering`) are performed and observed
sequentially.

- `weak` _(default)_ ordering does not provide any additional guarantees, so write operations can be freely reordered.
- `medium` ordering serializes all write operations through a dynamically elected leader, which might cause minor inconsistencies in case of leader change.
- `strong` ordering serializes all write operations through the permanent leader, which provides strong consistency, but write operations may be unavailable if the leader is down.

<aside role="status">Some <a href="/documentation/scaling/distributed_deployment/#shard-transfer-method">shard transfer methods</a> may affect ordering guarantees.</aside>

{{< code-snippet path="/documentation/headless/snippets/insert-points/batch-with-strong-ordering/" >}}
