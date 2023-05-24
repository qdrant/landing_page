---
title: Monitoring
weight: 155
---

Qdrant exposes its metrics in a Prometheus format, so you can integrate them easily
with the compatible tools and monitor Qdrant with your own monitoring system. You can 
use the `/metrics` endpoint and configure it as a scrape target.

Metrics endpoint: <http://localhost:6333/metrics>

The integration with Qdrant is easy to 
[configure](https://prometheus.io/docs/prometheus/latest/getting_started/#configure-prometheus-to-monitor-the-sample-targets) 
with Prometheus and Grafana.

## Exposed metric

Each Qdrant server will expose the following metrics.

| Name                                | Type    | Meaning                                           |
|-------------------------------------|---------|---------------------------------------------------|
| app_info                            | counter | Information about Qdrant server                   |
| collections_total                   | gauge   | Number of collections                             |
| collections_vector_total            | gauge   | Total number of vectors in all collections        |
| collections_full_total              | gauge   | Number of full collections                        |
| collections_aggregated_total        | gauge   | Number of aggregated collections                  |
| rest_responses_total                | counter | Total number of responses through REST API        |
| rest_responses_fail_total           | counter | Total number of failed responses through REST API |
| rest_responses_avg_duration_seconds | gauge   | Average response duration in REST API             |
| rest_responses_min_duration_seconds | gauge   | Minimum response duration in REST API             |
| rest_responses_max_duration_seconds | gauge   | Maximum response duration in REST API             |
| grpc_responses_total                | counter | Total number of responses through gRPC API        |
| grpc_responses_fail_total           | counter | Total number of failed responses through REST API |
| grpc_responses_avg_duration_seconds | gauge   | Average response duration in gRPC API             |
| grpc_responses_min_duration_seconds | gauge   | Minimum response duration in gRPC API             |
| grpc_responses_max_duration_seconds | gauge   | Maximum response duration in gRPC API             |
| cluster_enabled                     | gauge   | Whether the cluster support is enabled            |

### Cluster related metrics

There are also some metrics which are exposed in distributed mode only.

| Name                             | Type    | Meaning                                                                |
|----------------------------------|---------|------------------------------------------------------------------------|
| cluster_peers_total              | gauge   | Total number of cluster peers                                          |
| cluster_term                     | counter | Current cluster term                                                   |
| cluster_commit                   | counter | Index of last committed (finalized) operation cluster peer is aware of |
| cluster_pending_operations_total | gauge   | Total number of pending operations for cluster peer                    |
| cluster_voter                    | gauge   | Whether the cluster peer is a voter or learner                         |
