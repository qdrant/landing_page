---
title: OpenLIT
weight: 3100
aliases: [ ../frameworks/openlit/ ]
---

# OpenLIT

[OpenLIT](https://github.com/openlit/openlit) is an OpenTelemetry-native LLM Application Observability tool and includes OpenTelemetry auto-instrumentation to monitor Qdrant and provide insights to improve database operations and application performance.


This page assumes you're using `qdrant-client` version 1.7.3 or above.

## Usage

### Step 1: Install OpenLIT

Open your command line or terminal and run:

```bash
pip install openlit
```

### Step 2: Initialize OpenLIT in your Application
Integrating OpenLIT into LLM applications is straightforward with just **two lines of code**: 

```python
import openlit

openlit.init()
```

OpenLIT directs the trace to your console by default. To forward telemetry data to an HTTP OTLP endpoint, configure the `otlp_endpoint` parameter or the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable.

For OpenTelemetry backends requiring authentication, use the `otlp_headers` parameter or the `OTEL_EXPORTER_OTLP_HEADERS` environment variable with the required values.

## Further Reading

With the LLM Observability data now being collected by OpenLIT, the next step is to visualize and analyze this data to get insights Qdrant's performance, behavior, and identify areas of improvement.

To begin exploring your LLM Application's performance data within the OpenLIT UI, please see the [Quickstart Guide](https://docs.openlit.io/latest/quickstart).

If you want to integrate and send the generated metrics and traces to your existing observability tools like Promethues+Jaeger, Grafana or more, refer to the [Official Documentation for OpenLIT Connections](https://docs.openlit.io/latest/connections/intro) for detailed instructions.

