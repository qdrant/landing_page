---
title: Monitoring & Telemetry
short_description: "Monitor Qdrant deployments with built-in metrics endpoints and Prometheus and Grafana stacks for self-hosted, Hybrid, and Managed Cloud."
description: "Monitor Qdrant with Prometheus and Grafana using built-in OpenMetrics endpoints, with setup guides for Managed Cloud, Hybrid Cloud, and self-hosted clusters."
weight: 148
partition: deploy
---

# Monitoring & Telemetry

These pages cover how to observe and measure a running Qdrant deployment using its built-in metrics endpoints and external monitoring tools.

## Monitoring & Telemetry

[Monitoring & Telemetry](/documentation/ops-monitoring/monitoring/) describes the Prometheus/OpenMetrics-compatible `/metrics` endpoint, the available metrics, and how to connect Qdrant to a Prometheus and Grafana monitoring stack.

## Managed Cloud Prometheus Monitoring

[Managed Cloud Prometheus Monitoring](/documentation/ops-monitoring/managed-cloud-prometheus/) is a step-by-step tutorial for deploying Prometheus and Grafana in a Kubernetes cluster and configuring them to scrape metrics from a Qdrant Managed Cloud database.

## Self-Hosted Prometheus Monitoring

[Self-Hosted Prometheus Monitoring](/documentation/ops-monitoring/hybrid-cloud-prometheus/) is a step-by-step tutorial for setting up Prometheus and Grafana monitoring for Qdrant running in a Hybrid Cloud or Private Cloud environment.
