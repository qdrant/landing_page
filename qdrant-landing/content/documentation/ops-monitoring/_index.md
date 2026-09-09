---
title: Monitoring & Telemetry
short_description: "Monitor Qdrant deployments with built-in metrics endpoints, Prometheus and Grafana integrations, and built-in tools for diagnosing memory usage and slow requests."
description: "Monitor Qdrant with Prometheus and Grafana using built-in OpenMetrics endpoints, with setup guides for Managed Cloud, Hybrid Cloud, and self-hosted clusters. Also covers monitoring collection memory usage and identifying slow requests with the built-in slow request log."
weight: 148
partition: deploy
---

# Monitoring & Telemetry

These pages cover how to observe and measure a running Qdrant deployment using its built-in metrics endpoints and external monitoring tools.

## Monitoring & Telemetry

[Monitoring & Telemetry](/documentation/ops-monitoring/monitoring/) describes the Prometheus/OpenMetrics-compatible `/metrics` endpoint, the available metrics, and how to connect Qdrant to a Prometheus and Grafana monitoring stack.

## Memory Usage

[Memory Usage](/documentation/ops-monitoring/memory-usage/) explains how to inspect a collection's disk space, RAM, and OS page cache usage across the cluster, broken down by component. Use it to plan capacity and diagnose memory pressure.

## Slow Request Log

[Slow Request Log](/documentation/ops-monitoring/slow-request-log/) describes Qdrant's built-in in-memory log of the slowest unique requests since startup. Use it to identify which queries are responsible for high latency.

## Managed Cloud Prometheus Monitoring

[Managed Cloud Prometheus Monitoring](/documentation/ops-monitoring/managed-cloud-prometheus/) is a step-by-step tutorial for deploying Prometheus and Grafana in a Kubernetes cluster and configuring them to scrape metrics from a Qdrant Managed Cloud database.

## Self-Hosted Prometheus Monitoring

[Self-Hosted Prometheus Monitoring](/documentation/ops-monitoring/hybrid-cloud-prometheus/) is a step-by-step tutorial for setting up Prometheus and Grafana monitoring for Qdrant running in a Hybrid Cloud or Private Cloud environment.

## Monitoring Hybrid/Private Cloud with Datadog

[Monitoring Hybrid/Private Cloud with Datadog](/documentation/ops-monitoring/hybrid-cloud-datadog/) is a step-by-step tutorial for setting up Datadog to monitor Qdrant running in a Hybrid Cloud or Private Cloud environment.
