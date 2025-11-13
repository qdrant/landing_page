---
title: Administration
weight: 10
aliases:
  - ../administration
---

# Administration

Qdrant exposes administration tools which enable to modify at runtime the behavior of a qdrant instance without changing its configuration manually.

## Locking

A locking API enables users to restrict the possible operations on a qdrant process.
It is important to mention that:

- The configuration is not persistent therefore it is necessary to lock again following a restart.
- Locking applies to a single node only. It is necessary to call lock on all the desired nodes in a distributed deployment setup.

Lock request sample:

```http
POST /locks
{
    "error_message": "write is forbidden",
    "write": true
}
```

Write flags enables/disables write lock.
If the write lock is set to true, qdrant doesn't allow creating new collections or adding new data to the existing storage.
However, deletion operations or updates are not forbidden under the write lock.
This feature enables administrators to prevent a qdrant process from using more disk space while permitting users to search and delete unnecessary data.

You can optionally provide the error message that should be used for error responses to users.

## Recovery mode

*Available as of v1.2.0*

Recovery mode can help in situations where Qdrant fails to start repeatedly.
When starting in recovery mode, Qdrant only loads collection metadata to prevent
going out of memory. This allows you to resolve out of memory situations, for
example, by deleting a collection. After resolving Qdrant can be restarted
normally to continue operation.

In recovery mode, collection operations are limited to
[deleting](/documentation/concepts/collections/#delete-collection) a
collection. That is because only collection metadata is loaded during recovery.

To enable recovery mode with the Qdrant Docker image you must set the
environment variable `QDRANT_ALLOW_RECOVERY_MODE=true`. The container will try
to start normally first, and restarts in recovery mode if initialisation fails
due to an out of memory error. This behavior is disabled by default.

If using a Qdrant binary, recovery mode can be enabled by setting a recovery
message in an environment variable, such as
`QDRANT__STORAGE__RECOVERY_MODE="My recovery message"`.


## Strict mode

*Available as of v1.13.0*

Strict mode is a feature to restrict certain type of operations on a collection in order to protect it.

The goal is to prevent inefficient usage patterns that could overload the system.

The strict mode ensures a more predictible and responsive service when you do not have control over the queries that are being executed.

Upon crossing a limit, the server will return a client side error with the information about the limit that was crossed.

The `strict_mode_config` can be enabled when [creating](#create-a-collection) a new collection, see [schema definitions](https://api.qdrant.tech/api-reference/collections/create-collection#request.body.strict_mode_config) for all the available `strict_mode_config` parameters.

As part of the config, the `enabled` field act as a toggle to enable or disable the strict mode dynamically.

To disable completely strict mode on an existing collection use:

{{< code-snippet path="/documentation/headless/snippets/strict-mode/disable/" >}}

### Disable retrieving via non indexed payload

Setting `unindexed_filtering_retrieve` to false prevents retrieving points by filtering on a non indexed payload key which can be very slow.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/unindexed-filtering-retrieve/" >}}

Or turn it off later on an existing collection through the [collection update](#update-collection-parameters) API.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/unindexed-filtering-retrieve-off/" >}}

### Disable updating via non indexed payload

Setting `unindexed_filtering_update` to false prevents updating points by filtering on a non indexed payload key which can be very slow.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/unindexed-filtering-update/" >}}

### Maximum number of payload index count

Setting `max_payload_index_count` caps the maximum number of payload index that can exist on a collection.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/max-payload-index-count/" >}}

### Maximum query `limit` parameter

Retrieving large result set is expensive.

Setting `max_query_limit` caps the maximum number of points that can be retrieved in a single query.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/max-query-limit/" >}}

### Maximum `timeout` parameter

Long running operations are often symptomatic of a deeper issue.

Setting `max_timeout` caps the maximum value in seconds for the `timeout` parameter in all API operations.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/max-timeout/" >}}

### Maximum number of filtering conditions in a query

Large number of filtering conditions are expensive to evaluate.

Setting `filter_max_conditions` caps the maximum number of conditions filters can have.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/filter-max-conditions/" >}}

### Maximum batch size when inserting vectors

Sending very large batch at insert time can create internal congestion.  

Setting `upsert_max_batchsize` caps the maximum size in bytes of a batch during vector insert.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/upsert-max-batchsize/" >}}

### Maximum collection storage size

It is possible to set the maximum size of a collection in terms of vectors and/or payload storage size.

Setting `max_collection_vector_size_bytes` and/or `max_collection_payload_size_bytes` cap the maximum size in bytes of a collection.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/max-collection-storage-size-bytes/" >}}

### Maximum points count

Setting `max_points_count` caps the maximum of points for a collection.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/max-points-count/" >}}

### Rate limiting

An extremely high rate of incoming requests can have a negative impact on the latency

Setting `read_rate_limit` and/or `write_rate_limit` to cap the maximum of operations per minute per replica.

The client will receive an HTTP 429 error code with a potential indication regarding the delay before a retry.

{{< code-snippet path="/documentation/headless/snippets/strict-mode/rate-limiting/" >}}