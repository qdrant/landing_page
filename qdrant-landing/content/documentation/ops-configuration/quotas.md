---
title: Resource Quotas
short_description: "Cap node memory and disk usage cluster-wide so a full node stops taking writes before it destabilizes the cluster."
description: "Configure cluster-wide memory and disk quotas in Qdrant, understand HTTP 507 rejections and replica deactivation, and find which node in a cluster is full."
weight: 7
---

# Resource Quotas

*Available as of v1.19.0*

Resource quotas stop a node from taking on more data once it's low on memory or disk space. When usage reaches a configured limit, the node rejects updates that would consume more of that resource until usage drops back down.

## Configuring Quotas

Quotas are disabled by default. You can configure quotas per node, or apply them to every node in a cluster via the API.

To apply quotas to a node, configure `storage.quotas` in the node's configuration file:

```yaml
storage:
  quotas:
    enabled: true
    max_disk_usage_percent: 90
```

Or use the environment variables:

```bash
QDRANT__STORAGE__QUOTAS__ENABLED=true
QDRANT__STORAGE__QUOTAS__MAX_DISK_USAGE_PERCENT=90
```

To change quotas cluster-wide, use the `PUT /quotas` API:

```http
PUT /quotas?wait=true
{
    "enabled": true,
    "max_disk_usage_percent": 90
}
```

Qdrant propagates the new configuration to every peer and persists it, so it survives restarts.

<aside role="status">Once the quota has been set through <code>PUT /quotas</code>, Qdrant stops reading <code>storage.quotas</code>. See <a href="#configuration-precedence">Configuration Precedence</a>.</aside>

The following parameters are available:

| Parameter | Description |
| --- | --- |
| `enabled` | Whether the limits are enforced. Defaults to `false`. |
| `max_resident_memory_percent` | Rejects memory-consuming updates once process resident memory reaches this percentage of the memory available to the node. Accepts values in the range 1–100. If unset, no memory quota is applied. |
| `max_disk_usage_percent` | Rejects disk-consuming updates once the file system holding the storage directory is filled to this percentage of its capacity. Accepts values in the range 1–100. If unset, no disk quota is applied. |
| `release_margin_percent` | How far a resource has to fall under its limit before the node accepts updates again. Accepts values in the range 0–100. Defaults to 5. |

Qdrant measures resident memory against the cgroup limit where one applies, and against total system memory otherwise.

### Configuration Precedence

Quotas set through the API take precedence over the configuration file or environment variables.

Until the quota is set through the API anywhere in the cluster, Qdrant reads the configuration file on every start, so stopping a node, changing the setting, and starting it again applies the new quota. A node joining a cluster whose quota was already set through the API receives that configuration through consensus instead, and its own configuration file stops being read.

### When Nodes Have Different Quotas

Each node resolves its own quota, and Qdrant neither compares them across peers nor warns you when they differ. Enforcement is per node: a node that reached the limit rejects updates to the replicas it holds. When a shard is replicated elsewhere, Qdrant deactivates the local replica and the update is applied on the other node.

To ensure a uniform quota across all nodes, use the `PUT /quotas` API.

## When a Quota Is Exceeded

A quota stops a node from storing data, not from serving requests. Read operations are never affected. For writes, a node over its limit still accepts and coordinates updates, so sending a write to a full node is not a problem in itself. If the node you send a request to doesn't hold a replica of the shard being written to, its own quota doesn't apply at all.

When an update reaches a shard on a full node, Qdrant excludes that replica, and records that exclusion as a failure of that node. The update as a whole still succeeds if at least [`write_consistency_factor`](/documentation/scaling/consistency-guarantees/#write-consistency-factor) replicas accept it. By default, `write_consistency_factor` equals `1`, so a single healthy replica is enough and the client gets a normal success response.

Qdrant then marks the excluded replica dead. It stays inactive and doesn't request shard recovery until the node has room again. Raising `write_consistency_factor` above the number of replicas that still have room turns the same write into an error instead.

Clients see HTTP 507 Insufficient Storage, or gRPC `ResourceExhausted` errors, when no replica is available to accept a write. That happens when the shard has a single replica and it's on the full node, or when every replica of the shard is on a node over its limit. The error names the resource, its current utilization, and the configured limit:

```text
Disk usage is at 95% of total capacity, exceeding the configured limit of 90%.
Help: Reduce disk usage (e.g. delete points or drop collections), or raise
`max_disk_usage_percent` in the global quota config.
```

While a node hasn't recovered from exceeding its quotas:

- **Deleting points is always allowed.** On a full node it's the way back under the limit.
- **Deleting a vector or a payload key isn't allowed.** Internally, Qdrant rewrites the point to drop the field, so storage grows before anything is reclaimed.
- **Shard transfers are always allowed.** Qdrant checks free space once before a transfer starts, so rejecting its batches partway would abandon work that is nearly done.

### Finding the Node That Is Full

Use the `GET /quotas` API to check quotas on the whole cluster:

```json
{
  "config": {"enabled": true, "max_disk_usage_percent": 90},
  "usage":  {"resident_memory_percent": 12, "disk_usage_percent": 46},
  "peers": {
    "3421...": {"resident_memory_percent": 12, "disk_usage_percent": 46, "exceeded": false},
    "7719...": {"resident_memory_percent": 9,  "disk_usage_percent": 91, "exceeded": true}
  }
}
```

In the response:
- `config` is the quota configuration of the node that served the request.
- `usage` reports the current memory and disk usage for that same node.
- `peers` is what each peer reports about itself, keyed by peer ID. A peer that doesn't answer is left out rather than failing the call, so treat a missing peer as a signal: the nodes that are out of room are the ones most likely to time out. If not running in distributed mode, `peers` is absent.

<aside role="status">A peer can report <code>exceeded</code> as <code>true</code> while the utilization it reports is already back under the configured limit. That's the <a href="#release-margin">release margin</a> holding the limit until usage has fallen far enough, not an inconsistency.</aside>

To find out which collections account for the usage, see [Monitor Collection Memory Usage](/documentation/ops-monitoring/memory-usage/).

## Release Margin

A limit trips as soon as usage reaches it, but only clears once usage has fallen `release_margin_percent` percentage points below it. With the default margin of 5, a node with `max_disk_usage_percent` set to 90 stops taking writes at 90% and starts again below 85%.

Changing the quota configuration clears any tripped limit, so new limits take effect right away instead of waiting out the margin of a limit that no longer exists.

While usage sits inside the margin, the rejection says so rather than claiming a limit that is no longer exceeded:

```text
Disk usage is at 87% of total capacity. It reached the configured limit of 90%
and has to fall below 85% before this node takes writes again.
```

## Monitoring Quotas

Each node reports whether it's currently at or over a limit through the `quota_exceeded` metric on [`/metrics`](/documentation/ops-monitoring/monitoring/#node-metrics-metrics). Memory and disk get their own series, because you free them with different actions:

```text
quota_exceeded{resource="memory"} 0
quota_exceeded{resource="disk"} 1
```

A node reports `1` from the moment usage reaches the limit until it has fallen back under the [release margin](#release-margin). Expect the series to stay at `1` for a while after usage has dropped under the configured limit.

Qdrant emits no series at all for a resource that has no limit or while quotas are disabled.

The `/telemetry` endpoint reports the same verdict alongside the quota configuration the peer is enforcing, in a top-level `quota` field. It reflects what that peer is applying rather than what the cluster agreed on, so a peer that missed a consensus update shows up here.
