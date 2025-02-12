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

## Monitoring multi-node clusters

When scraping metrics from multi-node Qdrant clusters, it is important to scrape from
each node individually instead of using a load-balanced URL. Otherwise, your metrics will appear inconsistent after each scrape.

## Monitoring in Qdrant Cloud

Qdrant Cloud offers additional metrics and telemetry that are not available in the open-source version. For more information, see [Qdrant Cloud Monitoring](/documentation/cloud/cluster-monitoring/).

## Exposed metrics

There are two endpoints avaliable:

- `/metrics` is the direct endpoint of the underlying Qdrant database node.

- `/sys_metrics` is a Qdrant cloud-only endpoint that provides additional operational and infrastructure metrics about your cluster, like CPU, memory and disk utilisation, collection metrics and load balancer telemetry. For more information, see [Qdrant Cloud Monitoring](/documentation/cloud/cluster-monitoring/).


### Node metrics `/metrics`

Each Qdrant server will expose the following metrics.

| Name                                | Type    | Meaning                                                                                                                            |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| app_info                            | gauge   | Information about Qdrant server                                                                                                    |
| app_status_recovery_mode            | gauge   | If Qdrant is currently started in recovery mode                                                                                    |
| collections_total                   | gauge   | Number of collections                                                                                                              |
| collections_vector_total            | gauge   | Total number of vectors in all collections                                                                                         |
| collections_full_total              | gauge   | Number of full collections                                                                                                         |
| collections_aggregated_total        | gauge   | Number of aggregated collections                                                                                                   |
| rest_responses_total                | counter | Total number of responses through REST API                                                                                         |
| rest_responses_fail_total           | counter | Total number of failed responses through REST API                                                                                  |
| rest_responses_avg_duration_seconds | gauge   | Average response duration in REST API                                                                                              |
| rest_responses_min_duration_seconds | gauge   | Minimum response duration in REST API                                                                                              |
| rest_responses_max_duration_seconds | gauge   | Maximum response duration in REST API                                                                                              |
| grpc_responses_total                | counter | Total number of responses through gRPC API                                                                                         |
| grpc_responses_fail_total           | counter | Total number of failed responses through REST API                                                                                  |
| grpc_responses_avg_duration_seconds | gauge   | Average response duration in gRPC API                                                                                              |
| grpc_responses_min_duration_seconds | gauge   | Minimum response duration in gRPC API                                                                                              |
| grpc_responses_max_duration_seconds | gauge   | Maximum response duration in gRPC API                                                                                              |
| cluster_enabled                     | gauge   | Whether the cluster support is enabled. 1 - YES                                                                                    |
| memory_active_bytes                 | gauge   | Total number of bytes in active pages allocated by the application. [Reference](https://jemalloc.net/jemalloc.3.html#stats.active) |
| memory_allocated_bytes              | gauge   | Total number of bytes allocated by the application. [Reference](https://jemalloc.net/jemalloc.3.html#stats.allocated)              |
| memory_metadata_bytes               | gauge   | Total number of bytes dedicated to allocator metadata. [Reference](https://jemalloc.net/jemalloc.3.html#stats.metadata)            |
| memory_resident_bytes               | gauge   | Maximum number of bytes in physically resident data pages mapped. [Reference](https://jemalloc.net/jemalloc.3.html#stats.resident) |
| memory_retained_bytes               | gauge   | Total number of bytes in virtual memory mappings. [Reference](https://jemalloc.net/jemalloc.3.html#stats.retained)                 |
| collection_hardware_metric_cpu      | gauge   | CPU measurements of a collection                                                                                                   |

**Cluster-related metrics**

There are also some metrics which are exposed in distributed mode only.

| Name                             | Type    | Meaning                                                                |
| -------------------------------- | ------- | ---------------------------------------------------------------------- |
| cluster_peers_total              | gauge   | Total number of cluster peers                                          |
| cluster_term                     | counter | Current cluster term                                                   |
| cluster_commit                   | counter | Index of last committed (finalized) operation cluster peer is aware of |
| cluster_pending_operations_total | gauge   | Total number of pending operations for cluster peer                    |
| cluster_voter                    | gauge   | Whether the cluster peer is a voter or learner. 1 - VOTER              |

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
