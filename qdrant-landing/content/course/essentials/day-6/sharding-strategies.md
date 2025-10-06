---
title: Sharding and Replication Strategies
weight: 2
---

{{< date >}} Day 6 {{< /date >}}

# Sharding and Replication Strategies

[Sharding and Replication Strategies](/documentation/guides/distributed_deployment/) scale Qdrant horizontally and keep it available during failures. Shards split a collection across nodes for parallelism; replicas duplicate shards for redundancy; write consistency controls the durability/latency trade‑off. This chapter explains how to design a layout that meets your SLOs and how to operate it cleanly in production.

## Cluster anatomy

A collection is split into shards. Each shard stores and indexes a subset of points, with its own segments and [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) graphs. Replication creates copies of each shard on other nodes. A search fans out to relevant shards in parallel, merges the partial results, and returns the top‑k. A write is applied to one or more replicas depending on your write consistency.

<img src="/documentation/guides/collection-config-guide/shards.png" width="720" alt="Sharding fan-out and merge diagram">

This architecture has important implications for performance and availability. Latency is the sum of per‑shard traversal plus network fan‑out plus merge time. You reduce merge cost by keeping queries shard‑local when possible. Availability is per shard: as long as one replica of a shard is alive, reads continue; write availability depends on your `write_consistency_factor`.

## Choosing a sharding strategy

### Auto vs custom

Auto sharding spreads points evenly using consistent hashing. Use this by default, especially when you do not have a natural partition key or when tenants are small and numerous. Custom sharding groups related points by an explicit shard key (e.g., `tenant_id`, `domain`, `region`). This improves cache locality and reduces cross‑shard fan‑out for scoped queries. Use only for low‑cardinality keys. For high cardinality, prefer partition‑by‑payload instead of multiplying physical shards.

### How many shards?

Make `shard_number` a multiple of your current node count. Provision at least 2 shards per node so you can scale up without recreating the collection. If you anticipate growth, 12 shards is a practical default: it lets you scale 1→2→3→6→12 nodes without re‑sharding. Too many shards add overhead (more segments, merges); too few bottleneck large shards. Watch segment counts and p95 latency as you scale.

Note: `shard_number` is fixed at creation for self‑hosted; Qdrant Cloud supports resharding in place.

## Replication and write consistency

`replication_factor` controls how many copies of each shard exist. `write_consistency_factor` controls how many replicas must acknowledge a write before it is considered successful.

Recommended patterns:
- Production HA: 3+ nodes, `replication_factor ≥ 2`.
- Ingest‑heavy: `write_consistency_factor = 1` for low latency ingestion; switch critical updates to majority.
- Strict durability: `write_consistency_factor = majority` (balanced) or `all` (highest latency, strongest guarantee).

Availability in common layouts:
- 3+ nodes, rf=2, wc=1 or majority: read and write continue if one node is down; collection‑level changes require majority.
- 2 nodes, rf=2, wc=1: read and write continue during maintenance, but collection‑level operations (create/move shards) require >50% - not possible while one node is down.
- Single node (non‑prod): no HA.

Consistency model:
- Collection‑level operations (create/move shards, replication changes) go through Raft consensus and require a majority; they may be denied during leader election.
- Point‑level operations are eventually consistent across replicas; `write_consistency_factor` governs durability at write time.

## Query flow and performance

Distributed search has three costs: per‑shard HNSW traversal, network fan‑out, and result merge. Practical tips:
- Keep queries shard‑local when possible: for multi‑tenant systems, combine `shard_key_selector` with a `tenant_id` filter.
- Tune the same dials as a single node per shard: `ef`, `m`, quantization. Increase `ef` until recall plateaus vs latency.
- If you multivector‑rerank, oversample candidates at the shard stage, then rerank; see Day 4/5 pages in this course, which mirror Qdrant's hybrid/rerank docs.

## Operations: scale, balance, and repair

Growth planning: start with auto sharding and rf=2 on 3 nodes; move to custom sharding only with a clear low‑cardinality key and a measurable win. Hot shards: split the keyspace (e.g., per‑tenant sub‑keys), move the shard to a less loaded node, or reshard in Cloud. Quantization and `ef` tuning reduce per‑shard CPU. Rebalancing: in Qdrant Cloud, enable automatic balancing; self‑hosted uses collection cluster APIs to inspect placement and move shards. Failure/maintenance: design for node loss. With rf=2 on 3+ nodes, one node can be replaced without downtime. Use majority for control‑plane changes and schedule them when all nodes are healthy.

## Examples (Qdrant Cloud)

Create a replicated collection with auto sharding:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER-URL.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="docs",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    shard_number=12,                 # multiple of node count; >=2 per node
    replication_factor=2,            # HA
    write_consistency_factor=1,      # use majority for strict updates
    sharding_method=models.ShardingMethod.AUTO,
)
```

Use custom sharding for tenant locality:

```python
# Register a tenant shard key
client.create_shard_key("docs", "tenant_acme")

# Route writes and reads to the tenant shard; always keep the tenant filter
client.upsert(
    collection_name="docs",
    points=[models.PointStruct(id=1, vector=[...], payload={"tenant_id": "acme"})],
    shard_key_selector="tenant_acme",
)

client.query_points(
    collection_name="docs",
    query=[...],
    limit=10,
    query_filter=models.Filter(must=[models.FieldCondition(key="tenant_id", match=models.MatchValue(value="acme"))]),
    shard_key_selector="tenant_acme",
)
```

Move a hot shard to another node:

```http
POST /collections/{collection_name}/cluster
{
  "move_shard": {
    "shard_id": 0,
    "from_peer_id": 381894127,
    "to_peer_id": 467122995
  }
}
```

## Real‑world tips

Auto sharding + rf=2 on 3 nodes is the recommended production baseline; 12 shards is a practical growth path. Custom sharding only for low‑cardinality keys; for high cardinality, use partition by payload. `write_consistency_factor=1` for bulk ingestion; majority for stricter updates. Size shards to avoid single‑shard bottlenecks; monitor segment counts and latency. Cloud supports resharding and auto‑rebalancing; self‑hosted uses shard move APIs. During incidents: reads prefer healthy replicas; collection changes require a majority; point writes obey your consistency factor.

## Core parameters (recap)

| Parameter | Default | Description | When to Adjust |
|---|---|---|---|
| `shard_number` | 1 | Number of shards in the collection | Raise to parallelize across nodes/cores; pick multiples of node count |
| `replication_factor` | 1 | Copies of each shard | Use 2+ for HA |
| `write_consistency_factor` | 1 | Replicas that must ack a write | Raise for stronger durability |
| `sharding_method` | `auto` | `auto` spreads evenly; `custom` groups by key | Use `custom` for low‑cardinality locality | 