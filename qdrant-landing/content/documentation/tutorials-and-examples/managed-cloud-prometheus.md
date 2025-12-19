---
title: Monitoring Managed Cloud with Prometheus and Grafana
weight: 36
---

# Monitoring Managed Cloud with Prometheus and Grafana

This tutorial will guide you through the process of setting up Prometheus and Grafana to monitor Qdrant databases running in Qdrant Managed Cloud.

## Prerequisites

This tutorial assumes that you already have a Kubernetes cluster running where you want to deploy your monitoring stack, and a Qdrant database created in Qdrant Managed Cloud. You should also have `kubectl` and `helm` configured to interact with your cluster.

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
  scrapeInterval: 30s
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

Qdrant Cloud offers an example Grafana Dashboard on the [Qdrant GitHub repository](https://github.com/qdrant/qdrant-cloud-grafana-dashboard). This comes with built in views and graphs to get you started with monitoring your Qdrant Clusters.

To import the dashboard:

1. In Grafana, go to "Dashboards" and click on "New" -> "Import".
2. Copy and paste the dashboard JSON from the Qdrant GitHub repository.
3. Click "Load" and then "Import".
