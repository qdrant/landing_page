---
title: OpenLLMetry
weight: 2300
---

# OpenLLMetry

OpenLLMetry from [Traceloop](https://www.traceloop.com/) is a set of extensions built on top of [OpenTelemetry](https://opentelemetry.io/) that gives you complete observability over your LLM application.

OpenLLMetry supports instrumenting the `qdrant_client` Python library and exporting the traces to various observability platforms, as listed [here](https://www.traceloop.com/docs/openllmetry/integrations/introduction).

## Usage

Install the SDK

```console
pip install traceloop-sdk
```

Instantiate the SDK

```python
from traceloop.sdk import Traceloop

Traceloop.init()
```

You're now tracing your `qdrant_client` usage with OpenLLMetry!

## Without the SDK

Since the instrumentations are provided as standard OpenTelemetry instrumentations, you can use them as standalone packages.

Install the package.

```console
pip install opentelemetry-instrumentation-qdrant
```

Instantiate the `QdrantInstrumentor`.

```python
from opentelemetry.instrumentation.qdrant import QdrantInstrumentor

QdrantInstrumentor().instrument()
```

## Further Reading

- 📚 OpenLLMetry [API reference](https://www.traceloop.com/docs/openllmetry/introduction)
