---
title: Slow Request Log
short_description: "Identify the slowest queries in your Qdrant deployment with the built-in slow request log, which records the slowest unique operations on each node since startup."
description: "Use the Slow Request Log REST endpoint to find which queries are responsible for high latency, with per-request-type breakdowns, deduplication by request content, and approximate occurrence counts."
weight: 9
---

# Slow Request Log

*Available as of v1.16.0*

The slow request log records the slowest unique operations on a node since startup. Use it to identify which queries are responsible for high latency.

The log keeps up to 32 entries per request type. Entries are deduplicated by a content hash of the request body and collection name, so repeated identical requests don't fill the log with duplicates. The log keeps count of the number of times each request pattern has been seen. When the queue for a request type is full, a new entry replaces the current fastest entry only if it took longer.

The log is in-memory only and it resets when the server restarts. The only way to read the log is [through the REST endpoint](#reading-the-log). After a deploy or configuration change, restart the server to get a clean baseline.

The log is per-node. Each node tracks operations on its own local shards. Querying the log on one node returns only that node's data. To get a complete picture of slow requests across a cluster, query each node separately and aggregate the results.

The Slow Request Log is enabled by default and cannot be disabled.

## What Gets Captured

The log records shard-level operations that take longer than 50 ms. The following operation types are tracked:

- `core_search` and `query_batch`
- `count`
- `retrieve`
- `facet`
- Write operations such as upsert and delete

## Reading the Log

`GET /profiler/slow_requests` returns the current state of the log. The endpoint requires `manage` access and is available as a REST API only.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 10 | Maximum number of entries to return. |
| `request` | — | Substring filter on request type. For example, `search` returns only search operations. |

```bash
# Top 10 slowest requests across all types
curl http://YOUR_NODE_URL:6333/profiler/slow_requests \
  -H "api-key: <your-key>"

# Top 20 slowest search requests only
curl "http://YOUR_NODE_URL:6333/profiler/slow_requests?limit=20&request=search" \
  -H "api-key: <your-key>"
```

## Response Fields

Each entry in the response includes the following fields:

| Field | Description |
|-------|-------------|
| `collection_name` | The collection the request ran against. |
| `duration` | Request duration in seconds. |
| `datetime` | Timestamp of the request. |
| `request_name` | Operation type, for example `core_search`. |
| `approx_count` | Approximate number of times this request pattern was seen since startup. |
| `cpu_usage_ratio` | CPU utilization during the request (optional). |
| `request_body` | The full request as JSON. |

Results are sorted slowest-first, then truncated to `limit`.
