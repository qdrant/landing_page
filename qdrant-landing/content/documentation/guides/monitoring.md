---
title: Monitoring & Telemetry
weight: 155
aliases:
  - ../monitoring
---

# Monitoring & Telemetry

Qdrant exposes its metrics in [Prometheus](https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format)/[OpenMetrics](https://github.com/OpenObservability/OpenMetrics) format, so you can integrate them easily
with the compatible tools and monitor Qdrant with your own monitoring system. You can
use the `/metrics` endpoint and configure it as a scrape target.

Metrics endpoint: <http://localhost:6333/metrics>

The integration with Qdrant is easy to
[configure](https://prometheus.io/docs/prometheus/latest/getting_started/#configure-prometheus-to-monitor-the-sample-targets)
with Prometheus and Grafana.

## Metrics

Qdrant exposes various metrics in Prometheus/OpenMetrics format, commonly used together with Grafana for monitoring.

Two endpoints are available:

- `/metrics` for metrics of a Qdrant node/peer, see [all metrics](#node-metrics-metrics).

- `/sys_metrics` (Qdrant Cloud only) for metrics about your cluster, like CPU, memory, disk utilisation, collection metrics and load balancer telemetry. For more information, see [Qdrant Cloud Monitoring](/documentation/cloud/cluster-monitoring/).

Note that `/metrics` only reports metrics for the peer connected to. It is therefore important to scrape from each peer individually, even if a load balancer is involved.

### Node metrics `/metrics`

Each Qdrant node will expose the following metrics.

Counters - such as the number of created snapshots - are reset when the node is restarted.

**Application metrics**

| Name                                | Type    | Meaning                        |
| ----------------------------------- | ------- | ------------------------------ |
| app_info                            | gauge   | Qdrant server name and version |
| app_status_recovery_mode            | gauge   | If started in recovery mode    |

**Collection metrics**

| Name                                              | Type    | Meaning                                                                                   |
| ------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| collections_total                                 | gauge   | Number of collections                                                                     |
| collection_points                                 | gauge   | Number of points, per collection (v1.16+)                                                 |
| collection_vectors                                | gauge   | Number of vectors, per collection and vector name (v1.16+)                                |
| collections_vector_total                          | gauge   | Number of vectors in all collections                                                      |
| collection_indexed_only_excluded_points           | gauge   | Number of points excluded in [`indexed_only`](/documentation/concepts/search/#search-api) search, per collection and vector name (v1.16+) |
| collection_active_replicas_min                    | gauge   | Minimum number of active replicas across all collections and shards (v1.16+)              |
| collection_active_replicas_max                    | gauge   | Maximum number of active replicas across all collections and shards (v1.16+)              |
| collection_dead_replicas                          | gauge   | Number of non-active replicas across all collections and shards (v1.16+)                  |
| collection_running_optimizations                  | gauge   | Number of running optimization tasks, per collection (v1.16+)                             |
| collection_hardware_metric_cpu                    | counter | CPU measurements of a collection, per collection (v1.13+)                                 |
| collection_hardware_metric_payload_io_read        | counter | Payload IO read operations measurement, per collection (v1.13+)                           |
| collection_hardware_metric_payload_io_write       | counter | Payload IO write operations measurement, per collection (v1.13+)                          |
| collection_hardware_metric_payload_index_io_read  | counter | Payload index read operations measurement, per collection (v1.13+)                        |
| collection_hardware_metric_payload_index_io_write | counter | Payload index write operations measurement, per collection (v1.13+)                       |
| collection_hardware_metric_vector_io_read         | counter | Vector IO read operations measurement, per collection (v1.13+)                            |
| collection_hardware_metric_vector_io_write        | counter | Vector IO write operations measurement, per collection (v1.13+)                           |

**Snapshot metrics**

| Name                                    | Type    | Meaning                                                                |
| --------------------------------------- | ------- | ---------------------------------------------------------------------- |
| snapshot_creation_running               | gauge   | Number of snapshots being created, per collection (v1.16+)             |
| snapshot_recovery_running               | gauge   | Number of snapshots being recovered, per collection (v1.16+)           |
| snapshot_created_total                  | counter | Number of created snapshots since start, per collection (v1.16+)       |

**API response metrics**

| Name                                | Type      | Meaning                                                 |
| ----------------------------------- | --------- | ------------------------------------------------------- |
| rest_responses_total                | counter   | Number of responses through REST API                    |
| rest_responses_fail_total           | counter   | Number of failed responses through REST API             |
| rest_responses_avg_duration_seconds | gauge     | Average response duration in REST API                   |
| rest_responses_min_duration_seconds | gauge     | Minimum response duration in REST API                   |
| rest_responses_max_duration_seconds | gauge     | Maximum response duration in REST API                   |
| rest_responses_duration_seconds     | histogram | Histogram of response durations in the REST API (v1.8+) |
| grpc_responses_total                | counter   | Number of responses through gRPC API                    |
| grpc_responses_fail_total           | counter   | Number of failed responses through REST API             |
| grpc_responses_avg_duration_seconds | gauge     | Average response duration in gRPC API                   |
| grpc_responses_min_duration_seconds | gauge     | Minimum response duration in gRPC API                   |
| grpc_responses_max_duration_seconds | gauge     | Maximum response duration in gRPC API                   |
| grpc_responses_duration_seconds     | histogram | Histogram of response durations in the gRPC API (v1.8+) |

**Process metrics**

| Name                                | Type    | Meaning                                                                                                                            |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| memory_active_bytes                 | gauge   | Total number of bytes in active pages allocated by the application. [Reference](https://jemalloc.net/jemalloc.3.html#stats.active) |
| memory_allocated_bytes              | gauge   | Total number of bytes allocated by the application. [Reference](https://jemalloc.net/jemalloc.3.html#stats.allocated)              |
| memory_metadata_bytes               | gauge   | Total number of bytes dedicated to allocator metadata. [Reference](https://jemalloc.net/jemalloc.3.html#stats.metadata)            |
| memory_resident_bytes               | gauge   | Maximum number of bytes in physically resident data pages mapped. [Reference](https://jemalloc.net/jemalloc.3.html#stats.resident) |
| memory_retained_bytes               | gauge   | Total number of bytes in virtual memory mappings. [Reference](https://jemalloc.net/jemalloc.3.html#stats.retained)                 |
| process_threads                     | gauge   | Number of used system threads (v1.16+)                                                                                             |
| process_open_mmaps                  | gauge   | Number of open memory maps (v1.16+)                                                                                                |
| system_max_mmaps                    | gauge   | System wide maximum number of open memory maps (v1.16+)                                                                            |
| process_open_fds                    | gauge   | Number of open file descriptors (v1.16+)                                                                                           |
| process_max_fds                     | gauge   | Maximum number of open file descriptors (v1.16+)                                                                                   |
| process_minor_page_faults_total     | counter | Number of minor page faults encountered by the process (v1.16+)                                                                    |
| process_major_page_faults_total     | counter | Number of major page faults encountered by the process (v1.16+)                                                                    |

**Cluster metrics (consensus)**

Metrics reporting the current cluster consensus state of the node. Exposed only
when distributed mode is enabled.

| Name                             | Type    | Meaning                                          |
| -------------------------------- | ------- | ------------------------------------------------ |
| cluster_enabled                  | gauge   | If distributed mode is enabled                   |
| cluster_peers_total              | gauge   | Number of cluster peers                          |
| cluster_term                     | counter | Raft consensus term                              |
| cluster_commit                   | counter | Raft consensus commit - last committed operation |
| cluster_pending_operations_total | gauge   | Number of pending consensus operations           |
| cluster_voter                    | gauge   | If a consensus voter (1) or learner (0)          |

### Metrics configuration

*Available as of v1.16.0*

In self-hosted environments you have further configuration options for metrics.

By default, all Qdrant metrics have no application namespace prefix. You may set
a prefix with `service.metrics_prefix` in the
[configuration](/documentation/guides/configuration/).

To achieve this you may use the following environment variable for example:

```bash
QDRANT__SERVICE__METRICS_PREFIX="qdrant_"
```

## Telemetry endpoint

Qdrant also provides a `/telemetry` endpoint, which provides information about the current state of the database, including the number of vectors, shards, and other useful information. You can find a full documentation of this endpoint in the [API reference](https://api.qdrant.tech/api-reference/service/telemetry).

## Kubernetes health endpoints

*Available as of v1.5.0*

Qdrant exposes three endpoints, namely
[`/healthz`](http://localhost:6333/healthz),
[`/livez`](http://localhost:6333/livez) and
[`/readyz`](http://localhost:6333/readyz), to indicate the current status of the
Qdrant server.

These currently provide the most basic status response, returning HTTP 200 if
Qdrant is started and ready to be used.

Regardless of whether an [API key](/documentation/guides/security/#authentication) is configured,
the endpoints are always accessible.

You can read more about Kubernetes health endpoints
[here](https://kubernetes.io/docs/reference/using-api/health-checks/).
