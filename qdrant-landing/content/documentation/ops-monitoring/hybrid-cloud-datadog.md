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

The Agent uses the `ad_identifiers` values to discover the Qdrant cluster exporter and operator pods, then scrapes the OpenMetrics endpoint that each pod exposes. The `%%host%%` template variable resolves to the IP of the discovered pod at runtime.

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
              # Instance 1: Qdrant Metrics Exporter
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

- **The first instance** scrapes the Qdrant cluster exporter on port 9090 and namespaces its metrics under `qdrant.exporter`.
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
