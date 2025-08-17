---
title: Sharding and Replication
weight: 2
---

{{< date >}} Day 6 {{< /date >}}

# Sharding and Replication

Sharding and Replication allow Qdrant to scale collections across multiple nodes while maintaining availability and fault tolerance. These features are essential for production environments that require horizontal scalability, high availability, or write resilience.

## Cluster anatomy, in practice

A collection is split into shards. Each shard stores and indexes a subset of points, with its own segments and HNSW graphs. Replication creates copies of each shard on other nodes. A read fans out to relevant shards in parallel, merges the results, and returns the top‑k. A write goes to one or more replicas depending on your write consistency.

<img src="/documentation/guides/collection-config-guide/shards.png" width="720" alt="Sharding fan-out and merge diagram">

## Sharding methods: auto vs custom

Auto sharding distributes points across shards evenly. It is the best default when you don’t have a natural partition key or when tenants are small and numerous. Custom sharding groups related points together by a shard key (for example, `tenant_id`), improving cache locality and reducing cross‑shard fan‑out for tenant‑scoped queries.

Create a collection and choose the sharding strategy:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="docs",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    shard_number=8,
    replication_factor=2,
    write_consistency_factor=1,           # raise for stronger durability
    sharding_method=models.ShardingMethod.AUTO
)
```

Route writes and reads by shard key when using custom sharding:

```bash
# Upsert points into a specific tenant shard
POST /collections/docs/points/upsert
{
  "points": [ { "id": 1, "vector": [...], "payload": {"tenant_id": "acme"} } ],
  "shard_key_selector": "acme"
}

# Search only within that tenant’s shard
POST /collections/docs/points/search
{
  "vector": [...], "limit": 10,
  "shard_key_selector": "acme",
  "filter": { "must": [ {"key": "tenant_id", "match": {"value": "acme"}} ] }
}
```

Auto sharding requires no `shard_key_selector`. For custom sharding, use the same key consistently on writes and reads.

## Consistency, availability, and failure

- Replication factor controls how many copies of each shard exist.
- Write consistency factor controls how many replicas must acknowledge a write before it is considered successful.

With replication factor 2 and write consistency 1, the cluster remains writable if one replica is down, but a small window of writes may not be present on the failed replica until it rejoins. Increasing the consistency factor reduces that window at the cost of higher write latency.

Reads automatically prefer healthy replicas. During a node failure, search fans out to the remaining replicas; availability is maintained if at least one replica per shard is alive.

## Query flow and performance

A distributed search has three costs: per‑shard HNSW traversal, network fan‑out, and merge. You reduce the merge cost by keeping queries shard‑local where possible—custom sharding by tenant is a straightforward way to achieve that. You reduce traversal cost with the same dials as on a single node (`ef`, `m`, quantization), but applied per shard.

Use filters and shard keys together. Filters like `tenant_id=acme` keep results correct, and `shard_key_selector` keeps the query local, especially in multi‑tenant systems.

## Resharding and growth

- Qdrant Cloud supports dynamic resharding; use it when a shard becomes hot or grows beyond your target size.
- In self‑hosted deployments, plan shard counts ahead, or migrate by standing up a new collection with the desired layout and bulk‑copying data, then switching traffic.

Keep shards large enough to amortize index and optimizer work, but not so large that a single shard becomes a bottleneck. Watch segment counts, `indexed_vectors_count` vs `points_count`, and p95 latency when deciding to split.

## Example: large catalog with tenant isolation

- 300M points, 1024‑dim vectors, binary quantization for memory and speed.
- 8 shards, replication factor 2. Custom sharding by `tenant_id`.
- Tenant‑scoped reads include both `shard_key_selector` and a `tenant_id` filter; cross‑tenant analytics use full fan‑out.

## Core parameters (recap)

| Parameter | Default | Description | When to Adjust |
|---|---|---|---|
| `shard_number` | 1 | Number of shards to divide the collection into | Raise to parallelize across nodes/cores |
| `replication_factor` | 1 | Copies of each shard | Use 2+ for HA |
| `write_consistency_factor` | 1 | Replicas that must ack a write | Raise for stronger durability |
| `sharding_method` | "auto" | `auto` spreads evenly; `custom` groups by key | Use `custom` for tenant/domain locality |

## Further reading

- Distributed deployment: `https://qdrant.tech/documentation/guides/distributed_deployment/`
- Vector Search Manuals (production guides): `https://qdrant.tech/articles/vector-search-manuals/`
- Multitenancy and custom sharding article: `https://qdrant.tech/articles/how-to-implement-multitenancy-and-custom-sharding-in-qdrant/` 