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

To scrape metrics from a Qdrant cluster running in Qdrant Cloud, note that an [API key](/documentation/cloud/authentication/) is required to access `/metrics` and `/sys_metrics`. Qdrant Cloud also supports supplying the API key as a [Bearer token](https://www.rfc-editor.org/rfc/rfc6750.html), which may be required by some providers.

## Exposed metrics

There are two endpoints avaliable:

- `/metrics` is the direct endpoint of the underlying Qdrant database node.

- `/sys_metrics` is a Qdrant cloud-only endpoint that provides additional operational and infrastructure metrics about your cluster, like CPU, memory and disk utilisation, collection metrics and load balancer telemetry.


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


### Cluster system metrics `/sys_metrics`

In Qdrant Cloud, each Qdrant cluster will expose the following metrics. This endpoint is not available when running Qdrant open-source.

**Important Base Metrics**

| Name                                | Type    | Meaning                                                                                                                            |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| container_cpu_cfs_throttled_periods_total | counter | Indicating that your CPU demand was higher than what your instance offers                                                           |
| kube_pod_container_resource_limits | gauge   | Response contains list of metrics for CPU and Mem.                                                                                  |
| qdrant_collection_number_of_grpc_requests | counter | Total number of gRPC requests on a collection                                                                                        |
| qdrant_collection_number_of_rest_requests | counter | Total number of REST requests on a collection                                                                                        |
| qdrant_node_rssanon_bytes           | gauge   | Allocated memory without memory-mapped files. This is the hard metric on memory which will lead to an OOM if it goes over the limit  |
| kubelet_volume_stats_used_bytes    | gauge   | Amount of disk used                                                                                                                 |
| traefik_service_requests_total      | counter | Response contains list of metrics for each Traefik service.                                                                         |
| traefik_service_request_duration_seconds_sum | gauge   | Response contains list of metrics for each Traefik service.                                                                         |

**Additional Metrics**

| Name                                | Type    | Meaning                                                                                                                            |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| app_info                            | gauge   | Information about the Qdrant server                                                                                               |
| app_status_recovery_mode            | gauge   | If Qdrant is currently started in recovery mode                                                                                   |
| cluster_peers_total                 | counter | Total number of cluster peers                                                                                                     |
| cluster_pending_operations_total    | counter | Total number of pending operations in the cluster                                                                                 |
| collections_total                   | counter | Number of collections                                                                                                             |
| collections_vector_total            | counter | Total number of vectors in all collections                                                                                        |
| container_cpu_usage_seconds_total   | counter | Total CPU usage in seconds                                                                                                        |
| container_fs_reads_bytes_total      | counter | Total number of bytes read by the container file system (disk)                                                                    |
| container_fs_reads_total            | counter | Total number of read operations on the container file system (disk)                                                               |
| container_fs_writes_bytes_total     | counter | Total number of bytes written by the container file system (disk)                                                                 |
| container_fs_writes_total           | counter | Total number of write operations on the container file system (disk)                                                              |
| container_memory_cache              | gauge   | Memory used for cache in the container                                                                                             |
| container_memory_mapped_file        | gauge   | Memory used for memory-mapped files in the container                                                                              |
| container_memory_rss                | gauge   | Resident Set Size (RSS) - Memory used by the container excluding swap space                                                      |
| container_memory_working_set_bytes  | gauge   | Total memory used by the container, including both anonymous and file-backed memory                                               |
| container_network_receive_bytes_total | counter | Total bytes received over the container's network interface                                                                       |
| container_network_transmit_bytes_total | counter | Total bytes transmitted over the container's network interface                                                                    |
| kube_pod_status_phase               | gauge   | Pod status in terms of different phases (Failed/Running/Succeeded/Unknown)                                                        |
| kube_pod_status_ready               | gauge   | Pod readiness state (unknown/false/true)                                                                                           |
| qdrant_collection_number_of_collections | counter | Total number of collections in Qdrant                                                                                             |
| qdrant_collection_pending_operations | counter | Total number of pending operations on a collection                                                                                 |

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
