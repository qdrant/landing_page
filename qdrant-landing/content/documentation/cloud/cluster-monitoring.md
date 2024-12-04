---
title: Monitor Clusters
weight: 55
---

# Monitoring Qdrant Cloud Clusters

## Telemetry

Qdrant Cloud provides you with a set of metrics to monitor the health of your database cluster. You can access these metrics in the Qdrant Cloud Console in the **Metrics** and **Request** sections of the cluster details page.

## Logs

Logs of the database cluster are available in the Qdrant Cloud Console in the **Logs** section of the cluster details page.

## Alerts

You will receive automatic alerts via email before your cluster reaches the currently configured memory or storage limits, including recommendations for scaling your cluster.

## Qdrant database metrics and telemetry

You can also directly access the metrics and telemetry that the Qdrant database nodes provide.

Metrics in a Prometheus compatible format are available at the `/metrics` endpoint of each Qdrant database node. When scraping, you should use the [node specific URLs](/documentation/cloud/cluster-access/#node-specific-endpoints) to ensure that you are scraping metrics from all nodes in each cluster. For more information see [Qdrant monitoring](/documentation/guides/monitoring/).

You can also access the `/telemetry` [endpoint](https://api.qdrant.tech/api-reference/service/telemetry) of your database. This endpoint is available on the cluster endpoint and provides information about the current state of the database, including the number of vectors, shards, and other useful information.