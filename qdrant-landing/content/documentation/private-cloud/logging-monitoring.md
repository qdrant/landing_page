---
title: Logging & Monitoring
short_description: "Collect application logs, audit logs, and Prometheus-compatible metrics from Qdrant Private Cloud clusters, with a ready-made Grafana dashboard."
description: "Collect application logs, enable Qdrant audit logging, and scrape Prometheus-compatible metrics from Qdrant Private Cloud clusters, with a ready-made Grafana dashboard."
weight: 25
---

# Configuring Logging & Monitoring in Qdrant Private Cloud

## Logging

You can access the logs with kubectl or the Kubernetes log management tool of your choice. For example:

```bash
kubectl -n qdrant-private-cloud logs -l app=qdrant,cluster-id=a7d8d973-0cc5-42de-8d7b-c29d14d24840
```

**Configuring log levels:** You can configure log levels for the databases individually through the QdrantCluster spec. Example:

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
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    log_level: "DEBUG"
```

### Audit Logging

*Available as of Qdrant v1.17.0*

Qdrant can write structured JSON audit log entries for API operations that require authentication or authorization. Enable it on the `QdrantCluster` with `spec.config.audit`:

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
    audit:
      enabled: true
      # Default directory on the database volume. Override only if you need a different path.
      # dir: ./storage/audit
      rotation: daily
      max_log_files: 7
      # Only enable behind a trusted reverse proxy or load balancer.
      trust_forwarded_headers: false
```

Audit logs are written as files on the cluster's storage volume (default `./storage/audit`). They are separate from the container stdout logs shown with `kubectl logs`. Audit logging is verbose and can grow quickly, so size the PersistentVolume with enough headroom.

From Qdrant v1.18.0, you can attach tracing IDs with headers such as `x-request-id`, and query recent entries with `POST /audit/logs` (manage-level access). For field reference, filters, and client examples, see [Audit Logging](/documentation/security/#audit-logging) in the Security guide. For every `AuditConfig` field, see the [Qdrant Private Cloud API Reference](/documentation/private-cloud/api-reference/#auditconfig).

### Integrating with a log management system

You can integrate the logs into any log management system that supports Kubernetes. There are no Qdrant specific configurations necessary. Just configure the agents of your system to collect the logs from all Pods in the Qdrant namespace.

To collect audit log files as well, configure your agent to read from the audit directory on each Qdrant Pod's data volume, or pull entries through the [`/audit/logs` API](/documentation/security/#query-audit-logs).

## Monitoring

The Qdrant Cloud console gives you access to basic metrics about CPU, memory and disk usage of your Qdrant clusters.

If you want to integrate Qdrant metrics into your own monitoring system, configure it to scrape the following endpoints, which provide metrics in a Prometheus/OpenMetrics-compatible format:

* `/metrics` on port 6333 of every Qdrant database Pod. This provides metrics about each database and its internals.
* `/metrics` on port 9290 of the Qdrant Operator Pod. This provides metrics about the Operator, as well as the status of Qdrant clusters and snapshots.
* For metrics about the state of Kubernetes resources like Pods and PersistentVolumes within the Qdrant Hybrid Cloud namespace, we recommend using [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)

### Grafana dashboard

If you scrape the above metrics into your own monitoring system, and you are using Grafana, you can use our [Grafana dashboard](https://github.com/qdrant/qdrant-cloud-grafana-dashboard) to visualize these metrics.

![Grafana dashboard](/documentation/cloud/cloud-grafana-dashboard.png)

