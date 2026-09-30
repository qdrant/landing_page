---
title: Monitoring with Datadog
short_description: "Monitor Qdrant Hybrid Cloud and Private Cloud deployments by setting up the Datadog Operator and Agent in your Kubernetes cluster."
description: "Set up the Datadog Operator in Kubernetes to scrape Qdrant metrics from Hybrid Cloud and Private Cloud clusters using OpenMetrics, and visualize them in Datadog."
weight: 20
---

# Monitoring Hybrid/Private Cloud with Datadog

| Time: 20 min | Level: Intermediate |
| --- | ----------- |

This tutorial will guide you through the process of setting up Datadog to monitor Qdrant clusters running in a Kubernetes cluster used for Hybrid or Private Cloud.

## Prerequisites

- A Kubernetes cluster with a Qdrant database deployed, using either a Hybrid Cloud or Private Cloud deployment
- `kubectl` and `helm` configured to interact with your cluster
- A Datadog account and a [Datadog API key](https://docs.datadoghq.com/account_management/api-app-keys/)

## Step 1: Install the Datadog Operator

If you haven't installed Datadog in your cluster yet, you can use the [Datadog Operator](https://docs.datadoghq.com/containers/datadog_operator/) to deploy and manage the Datadog Agent. The Operator runs the Agent as a DaemonSet, with one pod on every node of your cluster.

Add the Datadog Helm repository and install the Operator:

```shell
helm repo add datadog https://helm.datadoghq.com

helm install datadog-operator datadog/datadog-operator --namespace datadog --create-namespace
```

Next, create a Kubernetes secret that holds your Datadog API key. The Agent reads this secret to authenticate with Datadog:

```shell
kubectl create secret generic datadog-secret --namespace datadog --from-literal api-key=<DATADOG_API_KEY>
```

Replace `<DATADOG_API_KEY>` with your own API key.

## Step 2: Configure the Datadog Agent to Scrape Qdrant Metrics

To monitor Qdrant, configure the Datadog Agent to scrape metrics from your Qdrant database. Create a `DatadogAgent` resource that adds an [OpenMetrics](https://docs.datadoghq.com/integrations/openmetrics/) check through the Agent's Autodiscovery mechanism.

The Agent uses the `ad_identifiers` values to discover the Qdrant Cloud Agent and Operator pods, then scrapes the OpenMetrics endpoint that each pod exposes. The `%%host%%` template variable resolves to the IP of the discovered pod at runtime. See [Networking, Logging & Monitoring](/documentation/hybrid-cloud/networking-logging-monitoring/#monitoring) for the full list of metrics endpoints available in a Hybrid Cloud or Private Cloud cluster, including the per-database endpoint on port 6333.

```yaml
apiVersion: datadoghq.com/v2alpha1
kind: DatadogAgent
metadata:
  name: datadog
  namespace: datadog
spec:
  global:
    site: datadoghq.com
    credentials:
      apiSecret:
        secretName: datadog-secret
        keyName: api-key
  override:
    nodeAgent:
      extraConfd:
        configDataMap:
          openmetrics.yaml: |-
            ad_identifiers:
              - qdrant-cluster-exporter
              - operator
            init_config:
            instances:
              # Instance 1: Qdrant Cloud Agent
              - openmetrics_endpoint: http://%%host%%:9090/metrics
                namespace: qdrant.exporter
                metrics:
                  - .*

              # Instance 2: Qdrant Operator Metrics
              - openmetrics_endpoint: http://%%host%%:9290/metrics
                namespace: qdrant.operator
                metrics:
                  - .*
```

Apply the manifest:

```shell
kubectl apply -f datadog-agent.yaml
```

A few notes on this configuration:

- **The first instance** scrapes the Qdrant Cloud Agent on port 9090 and namespaces its metrics under `qdrant.exporter`.
- **The second instance** scrapes the Qdrant operator on port 9290 and namespaces its metrics under `qdrant.operator`.
- **`metrics: - .*`** collects every metric the endpoint exposes. To reduce the volume of custom metrics, replace this with an explicit list of metric names.

This example assumes that your Qdrant cluster, the cloud platform exporter, and the operator are deployed in the `qdrant` namespace. The Datadog node Agent discovers pods running on its own node regardless of their namespace, so no namespace selector is required. Adjust the ports and identifiers only if your deployment differs from the defaults.

## Step 3: View Qdrant Metrics in Datadog

Once the Agent is running and scraping Qdrant, confirm that metrics are flowing.

First, check that the OpenMetrics check is healthy. Find a node Agent pod and run the status command:

```shell
kubectl exec -it <DATADOG_AGENT_POD> --namespace datadog -- agent status
```

Look for the `openmetrics` check in the output. It should report the Qdrant instances with no errors and a non-zero number of metric samples.

Next, open Datadog and go to **Metrics > Explorer**. Search for metrics that start with `qdrant.exporter.` or `qdrant.operator.` to confirm that Datadog is receiving them.

## Step 4: Understand the Cost of Collecting Every Metric

The `metrics: - .*` setting in Step 2 collects every metric the Qdrant exporter and operator expose, with no filtering. On most Datadog plans, metrics ingested through a custom OpenMetrics check are billed as [custom metrics](https://docs.datadoghq.com/account_management/billing/custom_metrics/), and each unique combination of metric name and tag value counts separately. A Qdrant cluster exposes metrics per collection, per shard, and per peer, so `.*` on a cluster with many collections or shards can generate a custom metrics volume much larger than the same check on a single-collection deployment, and the bill scales accordingly.

Keep `.*` only for a short evaluation window, such as this tutorial. For each instance, select metric names from that endpoint's `/metrics` output that you actually query or alert on. For example, to collect only cluster status from the Operator on port 9290, replace that instance's `metrics` list with:

```yaml
metrics:
  - qdrant_operator_cluster_phase
```

Choose the Cloud Agent's port 9090 allowlist separately from its own output. Database metrics such as collection counts and request durations come from [the database endpoint on port 6333](/documentation/hybrid-cloud/networking-logging-monitoring/#monitoring), not the Cloud Agent endpoint.

Reapply `datadog-agent.yaml` and repeat Step 3 to confirm that the selected metrics still arrive. Check **Plan & Usage > Billing > Custom Metrics** in Datadog to compare the custom metrics count before and after the change.

## Step 5: Stop Metric Collection After Testing

To stop collecting Qdrant metrics once you are done testing, remove the `openmetrics.yaml` entry from the `DatadogAgent` resource and reapply it:

```shell
kubectl apply -f datadog-agent.yaml
```

The Agent stops scraping Qdrant on its next configuration reload, and no further custom metrics are ingested. Existing data already sent to Datadog is retained for that organization's normal retention period and continues to count toward historical usage until it expires; removing the check does not delete metrics already ingested.

If you installed the Datadog Agent only to run this tutorial and do not need it for anything else, remove the Operator and its resources instead:

```shell
kubectl delete datadogagent datadog --namespace datadog

helm uninstall datadog-operator --namespace datadog

kubectl delete secret datadog-secret --namespace datadog
```

This deletes the Agent DaemonSet, the Operator, and the API key secret from your cluster.
