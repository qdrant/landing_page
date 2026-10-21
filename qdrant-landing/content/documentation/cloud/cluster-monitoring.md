---
title: Monitor Clusters
short_description: "Monitor Qdrant Cloud cluster health with built-in metrics and logs, email alerts, and Prometheus-compatible endpoints for your own monitoring stack."
description: "Track Qdrant Cloud cluster health through the Console metrics and logs, automated email alerts, and the /metrics, /sys_metrics, and /telemetry endpoints."
weight: 30
---

# Monitoring Qdrant Cloud Clusters

Qdrant Cloud gives you three ways to watch a cluster:

| Where | What you get | Use it for |
|---|---|---|
| Cloud Console | Metrics, requests, and logs on the Cluster Details page | A quick look at a cluster's health |
| Email alerts | Automatic alerts to the account owner | Being told about capacity, health, and version problems |
| Metrics endpoints | Prometheus-compatible `/metrics` and `/sys_metrics`, plus `/telemetry` | Your own dashboards and alerting |

## Telemetry

![Cluster Metrics](/documentation/cloud/cluster-metrics.png)

The **Metrics** and **Requests** sections of the Cluster Details page show the health of the database cluster in the Qdrant Cloud Console.

## Logs

![Cluster Logs](/documentation/cloud/cluster-logs.png)

The **Logs** section of the Cluster Details page shows the logs of the database cluster. For a record of API calls, turn on [audit logging](/documentation/cloud/configure-cluster/#audit-logging).

## Alerts

The account owner receives automatic emails when a cluster has a capacity, health, version, key, or load problem. Examples are memory or disk use above 80% for more than 5 minutes, a node that ran out of memory, and a Database API key that is about to expire. The [Cluster Alerts](/documentation/cloud/cluster-alerts/) reference lists every alert with its trigger, meaning, and fix.

## Qdrant Database Metrics and Telemetry

You can also read the metrics and telemetry that the database nodes provide. Every request needs a [Database API key](/documentation/cloud/authentication/). A read-only key is enough. Send it in the `api-key` header, or as a [Bearer token](https://www.rfc-editor.org/rfc/rfc6750.html), which some monitoring providers require.

| Endpoint | Where to call it | What it reports |
|---|---|---|
| `/metrics` | Each [node endpoint](/documentation/cloud/cluster-access/#node-specific-endpoints), so that you scrape every node | Database metrics for that node only, in Prometheus format. See [Qdrant monitoring](/documentation/ops-monitoring/monitoring/) |
| `/sys_metrics` | The cluster endpoint, once per cluster | The database metrics from all nodes, plus infrastructure data such as load balancer traffic and container CPU and memory. Managed Cloud only. See the [metrics reference](/documentation/cloud/cluster-metrics-reference/) |
| `/telemetry` | The cluster endpoint | The current state of the database, including the number of vectors and shards. See the [API reference](https://api.qdrant.tech/api-reference/service/telemetry) |

Scraping `/sys_metrics` once is enough for a cluster-wide view. Scraping it on every node returns the same data each time.

## Grafana Dashboard

If you scrape your cluster metrics into your own monitoring system and use Grafana, the [Qdrant Cloud Grafana dashboard](https://github.com/qdrant/qdrant-cloud-grafana-dashboard) visualizes them. For a full Prometheus and Grafana setup, see [Scrape Metrics with Prometheus and Grafana](/documentation/cloud/cluster-monitoring-prometheus/).

![Grafana dashboard](/documentation/cloud/cloud-grafana-dashboard.png)

<iframe width="560" height="315" src="https://www.youtube.com/embed/pKPP-tL5_6w?si=ASKiG1P61m2YYk9J" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
