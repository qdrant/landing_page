---
title: Logging & Monitoring
short_description: "Collect application and audit logs, scrape Prometheus-compatible metrics, set up your own alerts, and visualize Qdrant Private Cloud clusters in Grafana."
description: "Collect application and audit logs from Qdrant Private Cloud, scrape Prometheus-compatible metrics from the cluster exporter and the Operator, build your own alerts, and use the Grafana dashboards."
weight: 25
---

# Configuring Logging & Monitoring in Qdrant Private Cloud

Private Cloud has no Qdrant Cloud Console and sends no telemetry to Qdrant. There is no built-in metrics view or alerting. You collect logs and metrics with your own tools, and you decide what to alert on.

## Logging

You can access the logs with kubectl or the Kubernetes log management tool of your choice. For example:

```bash
kubectl -n qdrant-private-cloud logs -l app=qdrant,cluster-id=a7d8d973-0cc5-42de-8d7b-c29d14d24840
```

### Log Levels

You can configure the log level of each database cluster individually through the `QdrantCluster` spec:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.20.0"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    log_level: "DEBUG"
```

The log levels of the Operator and the cluster exporter are Helm values: `operator.settings.logLevel` and `qdrant-cluster-exporter.config.logLevel`. Both accept `DEBUG`, `INFO`, `WARN`, and `ERROR`, and both default to `INFO`. See [Configuration](/documentation/private-cloud/configuration/).

### Audit Logging

*Available as of Qdrant v1.17.0*

Audit logging records API operations that require authentication or authorization as JSON entries, by default to log files on the database volume. It is disabled by default. Enable it under `spec.config.audit` on the `QdrantCluster`:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.17.0"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    service:
      api_key:
        secretKeyRef:
          name: qdrant-api-key
          key: api-key
    audit:
      enabled: true
      rotation: daily
      max_log_files: 7
      trust_forwarded_headers: false
      output: file
```

`trust_forwarded_headers` makes Qdrant take the client address from the `X-Forwarded-For` header instead of the TCP connection. Only enable it when the cluster sits behind a trusted reverse proxy or load balancer. On a publicly reachable instance it lets clients spoof their IP address in the audit log.

`output` selects where Qdrant writes audit entries: `file`, `stdout`, `stderr`, `file_and_stdout`, or `file_and_stderr`. If unset, Qdrant writes to `file`. With `file`, entries go to files on the cluster's database volume (default `./storage/audit`), not to the container output that `kubectl logs` shows. Audit logging is verbose and the files can grow quickly, so size the PersistentVolume with enough headroom. With `stdout` or `stderr`, every entry is one JSON line with `"kind": "audit"` in the container output, nothing is written to the volume, and `POST /audit/logs` returns no entries for that node. `dir`, `rotation`, and `max_log_files` only apply when the output includes `file`. For collecting audit entries alongside application logs, see [Logging & Monitoring](/documentation/private-cloud/logging-monitoring/#audit-logging).

The Operator only writes this configuration if the cluster runs Qdrant v1.17.0 or later, and only writes `output` from Qdrant v1.20.0. On an older version the setting is dropped silently: the `QdrantCluster` still shows it, but Qdrant does not apply it and no error is reported.

From Qdrant v1.18.0, clients can send tracing IDs (for example `x-request-id`), and you can query entries with `POST /audit/logs`. Details, including rotation options and the query API, are in [Audit Logging](/documentation/security/#audit-logging). Field-level reference for `AuditConfig` is in the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/#auditconfig).

### Integrating with a log management system

You can integrate the logs into any log management system that supports Kubernetes. There are no Qdrant specific configurations necessary. Just configure the agents of your system to collect the logs from all Pods in the Qdrant namespace.

To collect audit logs as well, set `spec.config.audit.output` to `stdout` or `file_and_stdout` so the agent that already collects Pod logs picks them up. With file output only, configure your agent to read the audit directory on each Qdrant Pod's database volume, or pull entries through the [`/audit/logs` API](/documentation/security/#query-audit-logs). The API reads files, so it returns no entries for a node whose output is `stdout` or `stderr` only.

## Monitoring

Configure your monitoring system to scrape these endpoints, which provide metrics in a Prometheus/OpenMetrics-compatible format:

| Component | Endpoint | Reports |
|---|---|---|
| Cluster exporter | `/metrics` on the port named `metrics` of the `qdrant-cluster-exporter` Service (port 9090 by default) | The metrics of all database Pods in one place, so you do not need to scrape each Pod |
| Qdrant Operator | `/metrics` on port 9290 | Metrics about the Operator, and the status of Qdrant clusters and snapshots |
| [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) | `/metrics` on port 8080 of the kube-state-metrics Service | The state of Kubernetes resources like Pods and PersistentVolumes. Private Cloud does not install it, so run it yourself, or use a stack that includes it, such as `kube-prometheus-stack` |

Do not scrape the database Pods in addition to the cluster exporter. The exporter already includes their metrics, so scraping both duplicates every metric.

The kubelet exposes the container and volume metrics, such as `container_memory_working_set_bytes` and `kubelet_volume_stats_used_bytes`. Scrape the kubelet as well. `kube-prometheus-stack` does this by default.

### Scraping with the Prometheus Operator

If you run the Prometheus Operator, the Helm chart can create the `ServiceMonitor` resources for the Operator and the cluster exporter. Both are disabled by default. Enable them in your Helm values:

```yaml
operator:
  serviceMonitor:
    enabled: true

qdrant-cluster-exporter:
  serviceMonitor:
    enabled: true
```

If your Prometheus selects `ServiceMonitor` resources by a label, such as the `release` label of `kube-prometheus-stack`, create the resources yourself with that label instead. See [Monitoring with Grafana and Prometheus](/documentation/ops-monitoring/hybrid-cloud-prometheus/) for a step-by-step setup.

### Alerts

Qdrant does not send alerts for Private Cloud clusters. Create the alerts in your own monitoring system. Qdrant does not prescribe thresholds, so choose them to fit your workload. These are the most important conditions to cover:

| What to watch | Metrics to start from |
|---|---|
| Disk usage | `kubelet_volume_stats_used_bytes` against `kubelet_volume_stats_capacity_bytes` |
| Memory usage | `container_memory_working_set_bytes` against the memory limit of the Pod |
| Cluster health | `qdrant_operator_cluster_phase`, which the Operator reports for every cluster it manages |
| Pod health and uptime | The Pod readiness and restart metrics of kube-state-metrics, such as `kube_pod_status_ready` and `kube_pod_container_status_restarts_total` |

Also watch the Operator and the cluster exporter themselves. If either stops reporting, you lose the data behind the other alerts.

### Grafana Dashboards

If you scrape these metrics into your own monitoring system, and you are using Grafana, you can use our [Grafana dashboards](https://github.com/qdrant/qdrant-cloud-grafana-dashboard) to visualize them. The repository has one dashboard for the Operator and one for the database clusters. Import both. To import them, and to fix panels that show no data, see [Monitoring with Grafana and Prometheus](/documentation/ops-monitoring/hybrid-cloud-prometheus/#step-5-import-the-qdrant-dashboards).

![Grafana dashboard](/documentation/cloud/cloud-grafana-dashboard.png)
