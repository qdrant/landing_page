---
title: Monitoring with Grafana and Prometheus
short_description: "Monitor Qdrant Hybrid Cloud and Private Cloud deployments by deploying Prometheus and Grafana into your Kubernetes cluster."
description: "Set up Prometheus and Grafana in Kubernetes to scrape metrics from Qdrant Hybrid Cloud and Private Cloud databases for end-to-end observability."
weight: 15
goal: Operations
stack:
  - Prometheus
  - Grafana
  - Kubernetes
learning_kind: examples
aliases:
  - /documentation/ops-monitoring/hybrid-cloud-prometheus
  - /documentation/tutorials-and-examples/hybrid-cloud-prometheus
---

# Monitoring Hybrid/Private Cloud with Prometheus and Grafana
| Time: 30 min | Level: Intermediate |
| --- | ----------- |

This tutorial will guide you through the process of setting up Prometheus and Grafana to monitor Qdrant databases running in a Kubernetes cluster used for Hybrid or Private Cloud.

## Prerequisites

This tutorial assumes that you already have a Kubernetes cluster running and a Qdrant database deployed in it, using either a Hybrid Cloud or Private Cloud deployment. You should also have `kubectl` and `helm` configured to interact with your cluster.

## Step 1: Install Prometheus and Grafana

If you haven't installed Prometheus and Grafana yet, you can use the [kube-prometheus-stack](https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack) Helm chart to deploy them in your Kubernetes cluster.

A minimal example of installing the stack:
  
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

This command will install Prometheus, Grafana, and all necessary components into a new `monitoring` namespace.

## Step 2: Configure Prometheus to Scrape Qdrant Metrics

To monitor Qdrant, you need to configure Prometheus to scrape metrics from the Qdrant database(s). You can do this by creating a `ServiceMonitor` resource in the host Kubernetes cluster.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: qdrant-cluster-exporter
  namespace: qdrant
  labels:
    release: prometheus
spec:
  endpoints:
  - honorLabels: true
    interval: 60s
    port: metrics
    scheme: http
    scrapeTimeout: 55s
  jobLabel: app.kubernetes.io/name
  namespaceSelector:
    matchNames:
    - qdrant
  selector:
    matchLabels:
      app.kubernetes.io/instance: qdrant-cluster-exporter
      app.kubernetes.io/name: qdrant-cluster-exporter
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: qdrant-operator
  namespace: qdrant
  labels:
    release: prometheus
spec:
  endpoints:
  - honorLabels: true
    interval: 60s
    port: metrics
    scheme: http
    scrapeTimeout: 55s
  jobLabel: app.kubernetes.io/name
  namespaceSelector:
    matchNames:
    - qdrant
  selector:
    matchLabels:
      app.kubernetes.io/name: operator
```

The example above assumes that your Qdrant database and the cloud platform exporter are deployed in the `qdrant` namespace. Adjust the `namespaceSelector` and `namespace` fields according to your deployment.

The `release: prometheus` label must match the name of your Helm release. By default, `kube-prometheus-stack` only picks up `ServiceMonitor` resources labeled with its own release name. If you installed the chart under a different name, change the label to match.

Apply both resources:

```bash
kubectl apply -f servicemonitors.yaml
```

These two monitors cover the cloud platform exporter and the Operator. To scrape the database Pods themselves (`/metrics` on port 6333) or other components, see [Networking, Logging & Monitoring](/documentation/hybrid-cloud/networking-logging-monitoring/).

## Step 3: Check That Prometheus Sees the Targets

Before you build any dashboards, confirm that Prometheus discovered the Qdrant targets and can query a metric from them.

Port-forward the Prometheus service:

```bash
kubectl --namespace monitoring port-forward svc/prometheus-kube-prometheus-prometheus 9090
```

Open `http://localhost:9090/targets` in your browser. You should see two `serviceMonitor/qdrant/...` entries, one for the cluster exporter and one for the Operator, and every endpoint under them should have the state `UP`.

If you prefer the command line, `curl -s http://localhost:9090/api/v1/targets` returns the same information as JSON. Look for `health: "up"` in each entry of `data.activeTargets`.

Then query a Qdrant metric. The Operator exposes the status of every cluster it manages:

```bash
curl -s 'http://localhost:9090/api/v1/query?query=qdrant_operator_cluster_phase' | jq '.data.result'
```

A non-empty result means metrics are flowing. If a target is missing, check that the `release` label matches your Helm release and that the `namespaceSelector` and `selector` labels match your Services. If a target is listed but `down`, check that the `metrics` port name exists on the Service and that network policies allow Prometheus to reach the Pod.

## Step 4: Access Grafana

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

## Step 5: Import Qdrant Dashboard

Qdrant provides example Grafana dashboards in the [qdrant-cloud-grafana-dashboard repository](https://github.com/qdrant/qdrant-cloud-grafana-dashboard). They come with built-in views and graphs to help you get started monitoring your Qdrant clusters. For Hybrid and Private Cloud, use `qdrant_cloud_operator_dashboard.json`, which covers the control plane metrics you scraped in Step 2.

To import the dashboard:

1. In Grafana, go to "Dashboards", then click "New" and "Import".
2. Upload the dashboard JSON file from the repository, or paste its contents.
3. Select your Prometheus data source, then click "Import".

The dashboards need the cloud-specific metrics scraped above. They do not work with metrics from the open-source Qdrant container image.
