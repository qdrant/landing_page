---
title: FAQs
questions:
- question: What metrics does Qdrant Cloud expose?
  answer: "Qdrant Cloud coverage includes query latency histograms, request counters (RPS and error rates), memory and CPU usage, and per-collection request, hardware, and configuration metrics. Learn more: <a href='/documentation/cloud/cluster-monitoring/'>https://qdrant.tech/documentation/cloud/cluster-monitoring/</a>"
- question: Do I have to build my own dashboards?
  answer: "No. Qdrant ships a pre-built Grafana dashboard as importable JSON with built-in views and graphs for monitoring your clusters. Import it, then customize as needed. Get the dashboard: <a href='https://github.com/qdrant/qdrant-cloud-grafana-dashboard' target='_blank'>https://github.com/qdrant/qdrant-cloud-grafana-dashboard</a>"
- question: Can I use my existing Prometheus and Grafana setup?
  answer: "Yes. Point your Prometheus instance at the metrics endpoints using a read-only API key (supported as a Bearer token), and import the pre-built dashboard into Grafana. The docs include ready-to-use ScrapeConfig examples for Managed Cloud and ServiceMonitor examples for Hybrid Cloud. Learn more: <a href='/documentation/ops-monitoring/managed-cloud-prometheus/'>https://qdrant.tech/documentation/ops-monitoring/managed-cloud-prometheus/</a>"
- question: Does Qdrant integrate with Datadog?
  answer: Yes. Configure the Datadog Agent's OpenMetrics check to scrape Qdrant's endpoints; the documentation includes a worked Autodiscovery configuration. Any other platform that ingests Prometheus/OpenMetrics data connects the same way.
- question: How does observability work on Hybrid Cloud versus Managed Cloud?
  answer: "On Managed Cloud, Hybrid Cloud, and Private Cloud expose different levels of infrastructure detail. Learn more: <a href='/documentation/ops-monitoring/hybrid-cloud-prometheus/'>https://qdrant.tech/documentation/ops-monitoring/hybrid-cloud-prometheus/</a>"
- question: Can I get per-collection or per-tenant metrics?
  answer: "Qdrant Cloud surfaces metrics at the collection level: request counts, pending operations, hardware usage, and segment statistics per collection. That lets you set alerting thresholds that reflect each workload's traffic and resource profile. Latency metrics are reported at the node level, and metrics aren't labeled by tenant ID within a shared collection, so per-tenant latency tracking happens at the application layer."
- question: What alerting options are available?
  answer: Qdrant exposes the raw metric signals; we also have alerting rules in the UI and via email that you can use, or you configure alerting rules in your own stack, whether that's Prometheus Alertmanager, Datadog monitors, or the incident tooling already wired into your Grafana. For help validating alerting thresholds against your specific workload, contact Qdrant. <a href="/documentation/cloud/cluster-monitoring/#alerts">https://qdrant.tech/documentation/cloud/cluster-monitoring/#alerts</a>
- question: Does Qdrant see my vectors or collection data when it collects telemetry?
  answer: "No. Your vectors, payloads, and queries stay inside your cluster on every deployment mode. What Qdrant's telemetry collects is infrastructure-level: on Managed Cloud and Hybrid Cloud, that means metrics like CPU, memory, and disk, plus cluster metadata such as names, labels, and collection counts. It never includes the contents of your database. Storage volumes are encrypted at rest, and API keys are stored as hashes.<br><br>On Hybrid Cloud and Private Cloud, the isolation goes further: your database, stored data, API keys, backups, and cluster logs all stay on your own infrastructure with no Qdrant access. On Private Cloud, which is air-gapped, Qdrant sees no infrastructure metrics or metadata either.<br><br>Learn more: <a href='/documentation/cloud-security/'>https://qdrant.tech/documentation/cloud-security/</a>"
sitemapExclude: true
---
