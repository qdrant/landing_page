---
title: Cluster Metrics Reference
short_description: "Reference for every metric exposed by the Qdrant Cloud /sys_metrics endpoint, including database, container, and infrastructure metrics."
description: "List of the Prometheus metrics that the Qdrant Cloud /sys_metrics endpoint exposes for each cluster, with the type and meaning of each."
weight: 33
---

# Cluster Metrics Reference

Each Qdrant Cloud cluster exposes the metrics below at its `/sys_metrics` endpoint, in a Prometheus-compatible format. The endpoint is not available when running open source Qdrant. To scrape it, see [Scrape Metrics with Prometheus and Grafana](/documentation/cloud/cluster-monitoring-prometheus/).

`/sys_metrics` combines the database metrics from `/metrics` with infrastructure data from the load balancers, ingresses, and cluster workloads. Query it once per cluster, on the cluster endpoint. It reports on all nodes. For the per-node database metrics, see [Qdrant monitoring](/documentation/ops-monitoring/monitoring/#node-metrics-metrics).

| Name | Type | Meaning |
|---|---|---|
| `app_info` | gauge | Information about the Qdrant server |
| `app_status_recovery_mode` | gauge | If Qdrant is currently started in recovery mode |
| `cluster_commit` |  |  |
| `cluster_enabled` |  | Indicates whether multi-node clustering is enabled |
| `cluster_peers_total` | counter | Total number of cluster peers |
| `cluster_pending_operations_total` | counter | Total number of pending operations in the cluster |
| `cluster_term` |  |  |
| `cluster_voter` |  |  |
| `collection_hardware_metric_cpu` |  |  |
| `collection_hardware_metric_io_read` |  |  |
| `collection_hardware_metric_io_write` |  |  |
| `collections_total` | counter | Number of collections |
| `collections_vector_total` | counter | Total number of vectors in all collections |
| `container_cpu_cfs_periods_total` |  |  |
| `container_cpu_cfs_throttled_periods_total` | counter | Indicating that your CPU demand was higher than what your instance offers |
| `container_cpu_usage_seconds_total` | counter | Total CPU usage in seconds |
| `container_file_descriptors` |  |  |
| `container_fs_reads_bytes_total` | counter | Total number of bytes read by the container file system (disk) |
| `container_fs_reads_total` | counter | Total number of read operations on the container file system (disk) |
| `container_fs_writes_bytes_total` | counter | Total number of bytes written by the container file system (disk) |
| `container_fs_writes_total` | counter | Total number of write operations on the container file system (disk) |
| `container_memory_cache` | gauge | Memory used for cache in the container |
| `container_memory_mapped_file` | gauge | Memory used for memory-mapped files in the container |
| `container_memory_rss` | gauge | Resident Set Size (RSS) - Memory used by the container excluding swap space used for caching |
| `container_memory_working_set_bytes` | gauge | Total memory used by the container, including both anonymous and file-backed memory |
| `container_network_receive_bytes_total` | counter | Total bytes received over the container's network interface |
| `container_network_receive_errors_total` |  |  |
| `container_network_receive_packets_dropped_total` |  |  |
| `container_network_receive_packets_total` |  |  |
| `container_network_transmit_bytes_total` | counter | Total bytes transmitted over the container's network interface |
| `container_network_transmit_errors_total` |  |  |
| `container_network_transmit_packets_dropped_total` |  |  |
| `container_network_transmit_packets_total` |  |  |
| `envoy_cluster_upstream_cx_active` | gauge | Number of active upstream connections |
| `envoy_cluster_upstream_cx_rx_bytes_total` | counter | Total bytes received by the proxy from the backend over upstream connections |
| `envoy_cluster_upstream_cx_tx_bytes_total` | counter | Total bytes sent by the proxy to the backend over upstream connections |
| `envoy_cluster_upstream_rq_time_bucket` | histogram | Histogram of upstream request duration, in milliseconds |
| `envoy_cluster_upstream_rq_time_count` | gauge | Count of upstream requests recorded in the request duration histogram |
| `envoy_cluster_upstream_rq_time_sum` | gauge | Sum of upstream request duration, in milliseconds |
| `envoy_cluster_upstream_rq_total` | counter | Total number of upstream requests. Use with `irate` to calculate requests per second |
| `kube_persistentvolumeclaim_info` |  |  |
| `kube_pod_container_info` |  |  |
| `kube_pod_container_resource_limits` | gauge | Response contains limits for CPU and memory of DB. |
| `kube_pod_container_resource_requests` | gauge | Response contains requests for CPU and memory of DB. |
| `kube_pod_container_status_last_terminated_exitcode` |  |  |
| `kube_pod_container_status_last_terminated_reason` |  |  |
| `kube_pod_container_status_last_terminated_timestamp` |  |  |
| `kube_pod_container_status_ready` |  |  |
| `kube_pod_container_status_restarts_total` |  |  |
| `kube_pod_container_status_running` |  |  |
| `kube_pod_container_status_terminated` |  |  |
| `kube_pod_container_status_terminated_reason` |  |  |
| `kube_pod_created` |  |  |
| `kube_pod_info` |  |  |
| `kube_pod_start_time` |  |  |
| `kube_pod_status_container_ready_time` |  |  |
| `kube_pod_status_initialized_time` |  |  |
| `kube_pod_status_phase` | gauge | Pod status in terms of different phases (Failed/Running/Succeeded/Unknown) |
| `kube_pod_status_ready` | gauge | Pod readiness state (unknown/false/true) |
| `kube_pod_status_ready_time` |  |  |
| `kube_pod_status_reason` |  |  |
| `kubelet_volume_stats_capacity_bytes` | gauge | Amount of disk available |
| `kubelet_volume_stats_inodes` | gauge | Amount of inodes available |
| `kubelet_volume_stats_inodes_used` | gauge | Amount of inodes used |
| `kubelet_volume_stats_used_bytes` | gauge | Amount of disk used |
| `memory_active_bytes` |  |  |
| `memory_allocated_bytes` |  |  |
| `memory_metadata_bytes` |  |  |
| `memory_resident_bytes` |  |  |
| `memory_retained_bytes` |  |  |
| `qdrant_cluster_state` |  |  |
| `qdrant_collection_commit` |  |  |
| `qdrant_collection_config_hnsw_full_ef_construct` |  |  |
| `qdrant_collection_config_hnsw_full_scan_threshold` |  |  |
| `qdrant_collection_config_hnsw_m` |  |  |
| `qdrant_collection_config_hnsw_max_indexing_threads` |  |  |
| `qdrant_collection_config_hnsw_on_disk` |  |  |
| `qdrant_collection_config_hnsw_payload_m` |  |  |
| `qdrant_collection_config_optimizer_default_segment_number` |  |  |
| `qdrant_collection_config_optimizer_deleted_threshold` |  |  |
| `qdrant_collection_config_optimizer_flush_interval_sec` |  |  |
| `qdrant_collection_config_optimizer_indexing_threshold` |  |  |
| `qdrant_collection_config_optimizer_max_optimization_threads` |  |  |
| `qdrant_collection_config_optimizer_max_segment_size` |  |  |
| `qdrant_collection_config_optimizer_memmap_threshold` |  |  |
| `qdrant_collection_config_optimizer_vacuum_min_vector_number` |  |  |
| `qdrant_collection_config_params_always_ram` |  |  |
| `qdrant_collection_config_params_on_disk_payload` |  |  |
| `qdrant_collection_config_params_product_compression` |  |  |
| `qdrant_collection_config_params_read_fanout_factor` |  |  |
| `qdrant_collection_config_params_replication_factor` |  |  |
| `qdrant_collection_config_params_scalar_quantile` |  |  |
| `qdrant_collection_config_params_scalar_type` |  |  |
| `qdrant_collection_config_params_shard_number` |  |  |
| `qdrant_collection_config_params_vector_size` |  |  |
| `qdrant_collection_config_params_write_consistency_factor` |  |  |
| `qdrant_collection_config_quantization_always_ram` |  |  |
| `qdrant_collection_config_quantization_product_compression` |  |  |
| `qdrant_collection_config_quantization_scalar_quantile` |  |  |
| `qdrant_collection_config_quantization_scalar_type` |  |  |
| `qdrant_collection_config_wal_capacity_mb` |  |  |
| `qdrant_collection_config_wal_segments_ahead` |  |  |
| `qdrant_collection_consensus_thread_status` |  |  |
| `qdrant_collection_is_voter` |  |  |
| `qdrant_collection_number_of_collections` | counter | Total number of collections in Qdrant |
| `qdrant_collection_number_of_grpc_requests` | counter | Total number of gRPC requests on a collection |
| `qdrant_collection_number_of_rest_requests` | counter | Total number of REST requests on a collection |
| `qdrant_collection_pending_operations` | counter | Total number of pending operations on a collection |
| `qdrant_collection_role` |  |  |
| `qdrant_collection_shard_segment_num_indexed_vectors` |  |  |
| `qdrant_collection_shard_segment_num_points` |  |  |
| `qdrant_collection_shard_segment_num_vectors` |  |  |
| `qdrant_collection_shard_segment_type` |  |  |
| `qdrant_collection_term` |  |  |
| `qdrant_collection_transfer` |  |  |
| `qdrant_operator_cluster_info_total` |  |  |
| `qdrant_operator_cluster_phase` | gauge | Information about the status of Qdrant clusters |
| `qdrant_operator_cluster_pod_up_to_date` |  |  |
| `qdrant_operator_cluster_restore_info_total` |  |  |
| `qdrant_operator_cluster_restore_phase` |  |  |
| `qdrant_operator_cluster_scheduled_snapshot_info_total` |  |  |
| `qdrant_operator_cluster_scheduled_snapshot_phase` |  |  |
| `qdrant_operator_cluster_snapshot_duration_sconds` |  |  |
| `qdrant_operator_cluster_snapshot_phase` | gauge | Information about the status of Qdrant cluster backups |
| `qdrant_operator_cluster_status_nodes` |  |  |
| `qdrant_operator_cluster_status_nodes_ready` |  |  |
| `qdrant_node_rssanon_bytes` | gauge | Allocated memory without memory-mapped files. This is the hard metric on memory which will lead to an OOM if it goes over the limit |
| `rest_responses_avg_duration_seconds` |  |  |
| `rest_responses_duration_seconds_bucket` |  |  |
| `rest_responses_duration_seconds_count` |  |  |
| `rest_responses_duration_seconds_sum` |  |  |
| `rest_responses_fail_total` |  |  |
| `rest_responses_max_duration_seconds` |  |  |
| `rest_responses_min_duration_seconds` |  |  |
| `rest_responses_total` |  |  |
