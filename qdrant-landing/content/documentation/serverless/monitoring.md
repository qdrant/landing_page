---
title: Monitor a Space
short_description: "Watch traffic, latency, points, and storage for a Qdrant Serverless space in the console or in your own monitoring stack."
description: "Monitor a Qdrant Serverless space: view request rates, search latency, points, and storage in the console, collect metrics with a metrics-only API key, and tell space health from platform health."
weight: 60
---

# Monitor a Space

There are no nodes to watch on serverless, so monitoring is about your workload rather than your infrastructure: how much traffic the space is serving, how fast it's answering, and how much data it holds.

## View Metrics in the Console

Open the space and go to the **Metrics** tab. Choose a time range at the top of the tab, and select **Refresh** to load the latest data. The tab shows:

- **Search requests** and **write requests**, with the request rate over time in requests per second
- **Search latency**, averaged across collections and weighted by each collection's search rate
- **Points**, the total number of points stored
- **Storage used**, the bytes stored across all collections

For points and storage, the tab also shows how much they changed in the selected time range.

## Collect Metrics Externally

A space serves Prometheus-compatible metrics at the `/sys_metrics` path of its endpoint, for example `https://<your-space-endpoint>/sys_metrics`. The metrics cover only that space.

To scrape them, create a [metrics-only API key](/documentation/serverless/security/#allowed-operations) and pass it in the `api-key` header. The key can read metrics and nothing else, so it's safe to hand to a collector.

## Alerts

When a space crosses the alert threshold of a limit, or reaches the limit itself, the alert appears on the space's **Alerts** tab. To set limits and thresholds, see [Cost Control and Quotas](/documentation/serverless/spaces/#cost-control-and-quotas).

## Logs

Serverless doesn't offer operational logs or audit logs. If you need an audit trail for compliance, use a dedicated cluster.

## Space Health and Platform Health

Your space's metrics tell you about your workload, not about Qdrant Cloud itself. When latency rises or requests fail and your own metrics look normal, check the [Qdrant Cloud status page](https://status.qdrant.io/) before digging further.
