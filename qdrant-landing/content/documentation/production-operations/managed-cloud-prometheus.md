---
title: Managed Cloud Prometheus Monitoring
short_description: "Monitor Qdrant Managed Cloud clusters with Prometheus and Grafana running in your own Kubernetes environment for full visibility."
description: "Configure Prometheus and Grafana in Kubernetes to scrape metrics from Qdrant Managed Cloud clusters and import the official monitoring dashboard."
weight: 70
date: 2026-09-29T10:00:00+02:00
draft: false
aliases:
  - /documentation/ops-monitoring/managed-cloud-prometheus
  - /documentation/tutorials-and-examples/managed-cloud-prometheus
---

# Monitoring Managed Cloud with Prometheus and Grafana

This tutorial will guide you through the process of setting up Prometheus and Grafana to monitor Qdrant databases running in Qdrant Managed Cloud.

## Prerequisites

This tutorial assumes that you already have a Kubernetes cluster running where you want to deploy your monitoring stack, and a Qdrant database created in Qdrant Managed Cloud. You should also have `kubectl` and `helm` configured to interact with your cluster.

## Cluster metrics versus node metrics

Qdrant Managed Cloud exposes two Prometheus-compatible endpoints, and they answer different questions:

- `/metrics` reports on a single Qdrant node: collection counts, point and vector counts, API response times, and process-level memory such as `memory_resident_bytes`. Each node only reports on itself, so scrape every node individually if you want a full picture. For the full list of node metrics, see [Monitoring & Telemetry](/documentation/ops-monitoring/monitoring/#node-metrics-metrics).
- `/sys_metrics` is a Managed Cloud-only endpoint. It reports on the cluster as a whole, aggregating the same database metrics from every node plus infrastructure telemetry such as container CPU and memory usage, disk usage, and load balancer traffic. Query it once against the cluster's main endpoint. You don't need to scrape it per node, and doing so returns the same cluster-wide data each time. See [Cluster System Metrics](/documentation/cloud/cluster-monitoring/#cluster-system-metrics-sys_metrics) for the full list.

The `ScrapeConfig` in this tutorial targets `/sys_metrics`, so a single scrape job covers the whole cluster.

To confirm your scrape config is working, query a metric that only `/sys_metrics` exposes, such as container memory usage per pod, in the Prometheus UI or with `curl`:

```promql
container_memory_working_set_bytes{job="prometheus"}
```

If the scrape target in this tutorial is configured correctly, this returns one time series per pod in your cluster, each with a `pod` label and a byte value. Compare it against the node-level equivalent, `memory_resident_bytes` from `/metrics`, to see the difference between container-level and process-level memory reporting.

## Step 1: Install Prometheus and Grafana

If you haven't installed Prometheus and Grafana yet, you can use the [kube-prometheus-stack](https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack) Helm chart to deploy them in your Kubernetes cluster.

A minimal example of installing the stack:
  
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

This command will install Prometheus, Grafana, and all necessary components into a new `monitoring` namespace.

## Step 2: Configure Prometheus to Scrape Qdrant Metrics

To monitor Qdrant, you need to configure Prometheus to scrape metrics from the Qdrant database. You can do this by creating a `ScrapeConfig` resource in your Kubernetes cluster. The API key to authenticate at your Qdrant database should be stored in a Kubernetes Secret. A read-only API key is sufficient for monitoring purposes.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: qdrant-cluster-api-key
  namespace: monitoring
  labels:
    app: qdrant-cluster
stringData:
  apiKey: "a-read-only-api-key"
---
apiVersion: monitoring.coreos.com/v1alpha1
kind: ScrapeConfig
metadata:
  name: qdrant-cluster
  namespace: monitoring
  labels:
    app: qdrant-cluster
    release: prometheus
spec:
  metricsPath: /sys_metrics
  scrapeInterval: 60s
  scheme: HTTPS
  authorization:
    type: Bearer
    credentials:
      name: qdrant-cluster-api-key
      key: apiKey    
  staticConfigs:
    - labels:
        job: prometheus
      targets:
        - your-cluster.europe-west3-0.gcp.cloud.qdrant.io:443
```

## Step 3: Access Grafana

Once Prometheus is configured to scrape metrics from Qdrant, you can access Grafana to visualize the metrics.

Get the Grafana 'admin' user password by running:

```bash
kubectl --namespace monitoring get secrets prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo
```

Access the Grafana dashboard by port-forwarding:

```bash
export POD_NAME=$(kubectl --namespace monitoring get pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=prometheus" -oname)
kubectl --namespace monitoring port-forward $POD_NAME 3000
```

Now you can open your web browser and go to `http://localhost:3000`. Log in with the username `admin` and the password you retrieved earlier.

## Step 4: Import Qdrant Dashboard

Qdrant Cloud offers an example Grafana dashboard in the [Qdrant GitHub repository](https://github.com/qdrant/qdrant-cloud-grafana-dashboard). This comes with built-in views and graphs to help you get started monitoring your Qdrant clusters.

To import the dashboard:

1. In Grafana, go to "Dashboards" and click on "New" -> "Import".
2. Copy and paste the dashboard JSON from the Qdrant GitHub repository.
3. Click "Load" and then "Import".
