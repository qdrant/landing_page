---
title: Networking, Logging & Monitoring
short_description: "Configure network policies, logs, and Prometheus-compatible metrics for Qdrant Hybrid Cloud, with a ready-made Grafana dashboard."
description: "Configure network policies, log collection, and Prometheus-compatible metrics for Qdrant Hybrid Cloud, and visualize cluster health in Grafana."
weight: 25
---
# Configuring Networking, Logging & Monitoring in Qdrant Hybrid Cloud

## Configure network policies

For security reasons, each database cluster is secured with network policies. By default, database pods only allow egress traffic between each other and ingress traffic to ports 6333 (REST) and 6334 (gRPC) from within the Kubernetes cluster.

You can modify the default network policies in the Hybrid Cloud environment configuration:

```yaml
qdrant:
  networkPolicies:
    ingress:
    - from:
      - ipBlock:
          cidr: 192.168.0.0/22
      - podSelector:
          matchLabels:
            app: client-app
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: client-namespace
      - podSelector:
          matchLabels:
            app: traefik
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: kube-system
      ports:
      - port: 6333
        protocol: TCP
      - port: 6334
        protocol: TCP      
```

## Logging

You can access the logs with kubectl or the Kubernetes log management tool of your choice. For example:

```bash
kubectl -n qdrant-namespace logs -l app=qdrant,cluster-id=9a9f48c7-bb90-4fb2-816f-418a46a74b24
```

**Configuring log levels:** You can configure log levels for the databases individually in the configuration section of the Qdrant Cluster detail page. The log level for the **Qdrant Cloud Agent** and **Operator** can be set in the [Hybrid Cloud Environment configuration](/documentation/hybrid-cloud/operator-configuration/).

### Integrating with a log management system

You can integrate the logs into any log management system that supports Kubernetes. There are no Qdrant specific configurations necessary. Just configure the agents of your system to collect the logs from all Pods in the Qdrant namespace.

## Monitoring

The Qdrant Cloud console gives you access to basic metrics about CPU, memory and disk usage of your Qdrant clusters.

If you want to integrate Qdrant metrics into your own monitoring system, configure it to scrape these endpoints, which provide metrics in a Prometheus/OpenMetrics-compatible format:

| Component | Endpoint | Reports |
|---|---|---|
| Cluster exporter | `/metrics` on the port named `metrics` of the `qdrant-cluster-exporter` Service | The metrics of all database Pods in one place, so you do not need to scrape each Pod |
| Qdrant Operator | `/metrics` on port 9290 | Metrics about the Operator, and the status of Qdrant clusters and snapshots |
| Qdrant Cloud Agent | `/metrics` on port 9090 | Metrics about the Agent and its connection to the Qdrant Cloud control plane |
| [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) | `/metrics` on port 8080 | The state of Kubernetes resources like Pods and PersistentVolumes within the Qdrant Hybrid Cloud namespace. Useful if you are not running kube-state-metrics cluster-wide |
| Database Pod (optional) | `/metrics` on port 6333 | The internals of one database. The cluster exporter already includes these metrics |

For a step-by-step setup with Prometheus and Grafana, see [Monitoring with Grafana and Prometheus](/documentation/ops-monitoring/hybrid-cloud-prometheus/).

### Alerts

Hybrid Cloud clusters use the same email alerts as Managed Cloud. The thresholds and channels are fixed. You cannot change a threshold or add a channel such as Slack, PagerDuty, or a webhook. The account owner receives the emails, and the **Alerts** tab in the Qdrant Cloud Console lists the alerts that have fired and resolved. See [Alerts](/documentation/cloud/cluster-monitoring/#alerts) for the full list.

These alerts email you for Hybrid Cloud clusters:

- Cluster is unhealthy: the Operator reports the cluster as not ready, in recovery mode, or failed for 5 minutes
- A node ran out of memory
- A node is CPU throttled
- Cluster has too many collections
- Disk space overutilized and a node ran out of disk space: only when Prometheus scrapes the kubelet volume metrics
- Database API key is about to expire
- Cluster version is not covered by the SLA

Qdrant does not email you when the Cloud Agent stops reporting, when a Hybrid Cloud component is not healthy, or when the Hybrid Cloud components fall behind on versions. To catch these, build your own alerts on the Operator and Agent metrics in the table.

### Grafana dashboard

If you scrape these metrics into your own monitoring system, and you are using Grafana, you can use our [Grafana dashboards](https://github.com/qdrant/qdrant-cloud-grafana-dashboard) to visualize them. The repository has one dashboard for the Operator and one for the database clusters. To import them, and to fix panels that show no data, see [Monitoring with Grafana and Prometheus](/documentation/ops-monitoring/hybrid-cloud-prometheus/#step-5-import-the-qdrant-dashboards).

![Grafana dashboard](/documentation/cloud/cloud-grafana-dashboard.png)
