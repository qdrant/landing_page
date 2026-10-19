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

This example assumes that your Qdrant database and the cloud platform exporter are deployed in the `qdrant` namespace. Adjust the `namespaceSelector` and `namespace` fields according to your deployment.

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

## Step 5: Import the Qdrant Dashboards

Qdrant publishes two example Grafana dashboards in the [qdrant-cloud-grafana-dashboard repository](https://github.com/qdrant/qdrant-cloud-grafana-dashboard). For Hybrid Cloud, import both:

| Dashboard file | Shows | Needs |
|---|---|---|
| `qdrant_cloud_dashboard.json` (Qdrant Cloud Public Dashboard) | One database cluster: the database metrics, the cluster status reported by the Operator, Pod and volume state, container resource use, and request traffic | The database metrics, the Operator metrics, kube-state-metrics, cAdvisor and kubelet volume metrics, and Traefik or Envoy request metrics |
| `qdrant_cloud_operator_dashboard.json` (Qdrant Operator V2 Dashboard) | The Operator and the cluster manager | The Operator metrics, kube-state-metrics, and the cluster manager process metrics |

For Private Cloud, use the Operator dashboard.

The dashboards are not versioned per Operator release. One Operator file covers Operator v2, and its queries expect Pods named `qdrant-operator-v2-*`, so they do not match Operator v1. The `version` field inside a dashboard JSON is Grafana's own revision counter. Always import the current files from the repository.

To import a dashboard:

1. In Grafana, go to "Dashboards", then click "New" and "Import".
2. Upload the dashboard JSON file from the repository, or paste its contents.
3. Select the Prometheus data source that scrapes your Qdrant namespace, then click "Import".

The dashboards need the cloud-specific metrics scraped in Step 2. They do not work with metrics from the open-source Qdrant container image.

## Troubleshooting: Panels Show No Data

A blank panel usually means that the series of its query are not in the Prometheus data source you selected. Work through these checks:

1. **Check the data source.** Select the Prometheus that scrapes the Hybrid Cloud namespace when you import. Copies of the dashboards from before October 2026 have internal data source IDs hardcoded, which leaves every panel empty in another Grafana. Import the current files.
2. **Check the cluster dropdown.** The database dashboard lists clusters from `qdrant_operator_cluster_info_total`. If the Operator target on port 9290 is down, every panel on that dashboard is blank. Only Operator v2 exposes this metric.
3. **Check the targets.** Every Qdrant target must be `UP`, as in Step 3. A ServiceMonitor whose `release` label does not match your Prometheus Helm release never becomes a target.
4. **Check the names and the network.** The queries expect Operator Pods named `qdrant-operator-v2-*` and database Pods named `qdrant-<cluster-id>-*`. A different Helm release name, or a network policy that blocks Prometheus from the Operator metrics port, gives the same empty result.
5. **Find the missing metric.** Open the empty panel, choose "Edit", copy the metric name from the query, and run it in Prometheus. For example:

```promql
qdrant_operator_cluster_info_total
container_memory_working_set_bytes{namespace="qdrant"}
kubelet_volume_stats_used_bytes{namespace="qdrant"}
kube_pod_container_info
```

Missing one source blanks only the panels that use it:

| Metric prefix | Source | Fix |
|---|---|---|
| `qdrant_operator_`, `controller_runtime_`, `workqueue_`, `rest_client_` | The Qdrant Operator | Apply the `qdrant-operator` ServiceMonitor from Step 2 |
| Database metrics such as `qdrant_collection_` and `qdrant_node_` | The Qdrant cluster exporter, or the database Pods on port 6333 | Apply the `qdrant-cluster-exporter` ServiceMonitor from Step 2 |
| `kube_pod_`, `kube_deployment_` | kube-state-metrics | Scrape kube-state-metrics. The Qdrant namespace runs one on port 8080, see [Networking, Logging & Monitoring](/documentation/hybrid-cloud/networking-logging-monitoring/#monitoring) |
| `container_`, `kubelet_volume_stats_` | The kubelet | Scrape the kubelet. `kube-prometheus-stack` does this by default |
| Request traffic panels | Traefik or Envoy | Scrape the proxy that serves your ingress |
| Operator dashboard process panels | The cluster manager | Scrape the cluster manager metrics |

If you use Chronosphere, panels that use Grafana's classic transformations, such as `JoinByField`, stay empty even when the metrics exist. See the [open issue](https://github.com/qdrant/qdrant-cloud-grafana-dashboard/issues/8) in the dashboard repository.
