---
title: New Relic
short_description: "Monitor Qdrant in New Relic by forwarding Prometheus metrics via remote write or the OpenMetrics integration, or by sending OpenTelemetry data over OTLP."
description: "Send Qdrant metrics to New Relic with Prometheus remote write or the OpenMetrics integration, and ingest OpenTelemetry traces and metrics over OTLP."
---

# New Relic

[New Relic](https://newrelic.com/) is an observability platform that collects metrics, traces, and logs from servers, databases, and applications. It provides dashboards, alerting, and NRQL queries to analyze the performance of your infrastructure.

Qdrant exposes metrics in the Prometheus/OpenMetrics format at its `/metrics` endpoint, as described in the [monitoring guide](/documentation/ops-monitoring/monitoring/). New Relic can collect these metrics in two ways, and it also ingests OpenTelemetry data natively.

## Usage

### Prometheus remote write

If a Prometheus server already scrapes your Qdrant instance, forward its data to New Relic by adding a [remote write](https://docs.newrelic.com/docs/infrastructure/prometheus-integrations/install-configure-remote-write/set-your-prometheus-remote-write-integration/) block to your `prometheus.yml`:

```yaml
remote_write:
  - url: https://metric-api.newrelic.com/prometheus/v1/write?prometheus_server=qdrant
    authorization:
      credentials: <NEW_RELIC_LICENSE_KEY>
```

Use `https://metric-api.eu.newrelic.com/prometheus/v1/write` if your account is in the EU data center. The `authorization` block requires Prometheus v2.26 or later. The `prometheus_server` parameter becomes an attribute on your data, so you can filter Qdrant metrics in dashboards and queries.

### Prometheus OpenMetrics integration

Without a Prometheus server, use the standalone [Prometheus OpenMetrics integration](https://docs.newrelic.com/docs/infrastructure/prometheus-integrations/install-configure-openmetrics/install-update-or-uninstall-your-prometheus-openmetrics-integration/) to scrape the Qdrant `/metrics` endpoint directly. Create a `config.yaml` pointing at your instance:

```yaml
cluster_name: qdrant
targets:
  - description: Qdrant metrics
    urls: ["http://localhost:6333/metrics"]
```

Then run the integration as a container with your license key:

```shell
docker run -d --restart unless-stopped \
  --name nri-prometheus \
  -e LICENSE_KEY="<NEW_RELIC_LICENSE_KEY>" \
  -v "$(pwd)/config.yaml:/config.yaml" \
  newrelic/nri-prometheus:2.18.0
```

After a few minutes, the Qdrant metrics appear in New Relic and can be queried with NRQL.

### OpenTelemetry

New Relic ingests [OTLP natively](https://docs.newrelic.com/docs/opentelemetry/best-practices/opentelemetry-otlp/). If you instrument your application with an OpenTelemetry-based tool such as [OpenLIT](/documentation/observability/openlit/) or [OpenLLMetry](/documentation/observability/openllmetry/), point the exporter at the New Relic OTLP endpoint:

```shell
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp.nr-data.net"
export OTEL_EXPORTER_OTLP_HEADERS="api-key=<NEW_RELIC_LICENSE_KEY>"
```

Use `https://otlp.eu01.nr-data.net` for EU accounts.

## Further Reading

- [Getting started with New Relic](https://docs.newrelic.com/docs/new-relic-solutions/get-started/intro-new-relic/)
- [Qdrant monitoring and telemetry](/documentation/ops-monitoring/monitoring/)
