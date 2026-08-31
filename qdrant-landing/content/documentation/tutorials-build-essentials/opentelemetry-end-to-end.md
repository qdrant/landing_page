---
title: "OpenTelemetry End-to-End with Qdrant Cloud"
short_description: "Send Qdrant Cloud metrics into your OpenTelemetry backend and match them against app traces."
description: "Send Qdrant Cloud's Prometheus metrics into an OTLP backend, send traces from your app, and match one slow trace to one cluster signal."
weight: 38
partition: ecosystem
---

# OpenTelemetry End-to-End with Qdrant Cloud

Qdrant Cloud exposes Prometheus metrics, not OpenTelemetry. You scrape these metrics with the OpenTelemetry Collector. You also send traces from your app. Then you match one slow trace against one signal from the cluster.

Two existing pages cover the app side. [OpenLLMetry](/documentation/observability/openllmetry/) instruments the `qdrant_client` library and exports spans. [OpenLIT](/documentation/observability/openlit/) sends app traces and metrics. This page covers the third piece. It gets the metrics of Qdrant Cloud into the same backend, and then ties them to a slow trace.

### Which layer reports what

Qdrant reports on the database: request durations, collection state, optimizer activity, and node resources. It does not know your model, your prompt, or your token counts.

Token counts, model latency, and retrieval relevance come from a tracing library in your application, such as OpenLLMetry, OpenLIT, or Arize. Instrument those in your own code. Qdrant needs no per-vendor integration for either layer, because the Collector speaks both OTLP and Prometheus.

## What you need

- A Qdrant Cloud instance.
- Docker Engine with `docker compose`.
- Python.
- An OTLP endpoint. The tutorial uses `grafana/otel-lgtm`, so you do not need a vendor account.

The `/sys_metrics` endpoint is Cloud-only. Self-hosted Qdrant does not expose it. Self-hosted clusters still expose `/metrics` on every node, so drop the `qdrant-cloud-sys` scrape job in Step 2 and list one target per node under `qdrant-node`. You lose the node resource and edge latency series. You keep the request histograms and the optimizer signal.

The data for this example will come from a public snapshot of the Qdrant documentation site.

## Step 1: Create the `.env` file

Create a `.env` file in an empty directory.

```bash
QDRANT_URL=https://<example>.cloud.qdrant.io:6333
QDRANT_HOST=<example>.cloud.qdrant.io
QDRANT_API_KEY=<qdrant-api-key>

COLLECTION=qdrant-docs
SNAPSHOT_URL=https://snapshots.qdrant.io/qdrant-web-site-docs-2024-04-05-v1.16.0.snapshot
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Docker Compose reads this file automatically. For the Python scripts, load it manually:

```bash
set -a; source .env; set +a
```

## Step 2: Start the collector and the backend

This `docker-compose.yml` starts two services: the all-in-one `grafana/otel-lgtm` (Grafana, Tempo, Prometheus) and the OpenTelemetry Collector.

```yaml
services:
  lgtm:
    image: grafana/otel-lgtm:latest
    ports:
      - "3000:3000" # Grafana
      - "9090:9090" # Prometheus
    environment:
      - ENABLE_LOGS_ALL=true

  collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otelcol-config.yaml:/etc/otelcol/config.yaml:ro
    environment:
      - QDRANT_HOST=${QDRANT_HOST}
      - QDRANT_API_KEY=${QDRANT_API_KEY}
    ports:
      - "4317:4317"
      - "4318:4318"
    depends_on:
      - lgtm
```

The collector scrapes two endpoints. `/sys_metrics` covers the whole cluster in one request. `/metrics` is per-node. It is the only place where `collection_running_optimizations` appears.

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  prometheus:
    config:
      scrape_configs:
        - job_name: qdrant-cloud-sys
          scrape_interval: 15s
          metrics_path: /sys_metrics
          scheme: https
          authorization:
            type: Bearer
            credentials: ${env:QDRANT_API_KEY}
          static_configs:
            - targets: ["${env:QDRANT_HOST}:443"]

        - job_name: qdrant-node
          scrape_interval: 15s
          metrics_path: /metrics
          params:
            per_collection: ["true"]
          scheme: https
          authorization:
            type: Bearer
            credentials: ${env:QDRANT_API_KEY}
          static_configs:
            - targets: ["${env:QDRANT_HOST}:443"]

processors:
  batch: {}

exporters:
  otlp_grpc:
    endpoint: lgtm:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp_grpc]
    metrics:
      receivers: [otlp, prometheus]
      processors: [batch]
      exporters: [otlp_grpc]
```

If your cluster has more than one node, add one target per node to the `qdrant-node` job. `/metrics` only reports the peer you connect to.

```yaml
static_configs:
  - targets:
      - "node-0-<cluster-id>.<region>.<provider>.cloud.qdrant.io:443"
      - "node-1-<cluster-id>.<region>.<provider>.cloud.qdrant.io:443"
      - "node-2-<cluster-id>.<region>.<provider>.cloud.qdrant.io:443"
```

Both endpoints also listen on port `6333`. Pick the one that your egress rules already allow.

Start the stack:

```bash
docker compose up -d
```

Grafana is at <http://localhost:3000>. Prometheus is at <http://localhost:9090>. The Collector accepts OTLP on ports `4317` (gRPC) and `4318` (HTTP).

## Step 3: Install the Python packages

```text
qdrant-client
opentelemetry-sdk
opentelemetry-exporter-otlp-proto-http
opentelemetry-instrumentation-qdrant
```

Save the list above as `requirements.txt`.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Step 4: Load the docs snapshot

The snapshot lives on Qdrant's public snapshot server. Restoring it pulls the collection into your cluster by name. Create `restore.py`:

```python
import os
from qdrant_client import QdrantClient

URL = os.environ["QDRANT_URL"]
KEY = os.environ["QDRANT_API_KEY"]
COLL = os.environ["COLLECTION"]
SNAPSHOT = os.environ["SNAPSHOT_URL"]

client = QdrantClient(url=URL, api_key=KEY, timeout=600)

if not client.collection_exists(COLL):
    client.recover_snapshot(
        collection_name=COLL,
        location=SNAPSHOT,
    )
```

`recover_snapshot` blocks until the restore finishes, which takes longer than the client's default timeout. Raise the timeout as shown, or the call fails with `ResponseHandlingException: The read operation timed out` while the restore keeps running on the cluster.

If the `.env` file is loaded, run the script:

```bash
.venv/bin/python restore.py
```

On the Qdrant cluster, the snapshot is now restored to `qdrant-docs` with 18,828 points and 384-dimension vectors. The collection has keyword indexes on `tag` and `sections`, and a full-text index on `text`.

## Step 5: Run the app

The script instruments the client. It runs two shapes of query against the docs collection. It prints the trace id of the slowest span.

```python
import os
import random
import sys
import time

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.qdrant import QdrantInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from qdrant_client import QdrantClient, models

COLL = os.environ.get("COLLECTION", "qdrant-docs")
DIM = 384
ROUNDS = int(os.environ.get("ROUNDS", "20"))

trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({"service.name": "qdrant-otel-demo"}))
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint=os.environ.get(
                "OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318"
            ).rstrip("/")
            + "/v1/traces"
        )
    )
)
QdrantInstrumentor().instrument()
tracer = trace.get_tracer(__name__)


def client():
    url = os.environ.get("QDRANT_URL", "")
    key = os.environ.get("QDRANT_API_KEY", "")
    if not url or not key:
        sys.exit("set QDRANT_URL and QDRANT_API_KEY")
    return QdrantClient(url=url, api_key=key)


def section_filter(value: str):
    return models.Filter(
        must=[models.FieldCondition(key="sections", match=models.MatchAny(any=[value]))]
    )


SHAPES = {
    "docs": dict(limit=10, query_filter=section_filter("documentation")),
    "blog": dict(limit=1000, query_filter=section_filter("blog")),
}


def query(qc, shape):
    with tracer.start_as_current_span(f"search.{shape}") as span:
        span.set_attribute("db.collection.name", COLL)
        span.set_attribute("qdrant.shape", shape)
        t0 = time.perf_counter()
        qc.query_points(
            COLL,
            query=[random.random() for _ in range(DIM)],
            with_payload=False,
            **SHAPES[shape],
        )
        ms = (time.perf_counter() - t0) * 1000
        span.set_attribute("qdrant.client_observed_ms", round(ms, 1))
        return ms, f"{span.get_span_context().trace_id:032x}"


if __name__ == "__main__":
    qc = client()
    print(f"collection: {COLL} ({qc.count(COLL).count} points)\n")
    print(f"{'shape':<8} {'client ms':>10}  trace_id")
    worst = (0, None)
    for _ in range(ROUNDS):
        for shape, args in SHAPES.items():
            ms, tid = query(qc, shape)
            print(f"{shape:<8} {ms:>10.1f}  {tid}")
            if ms > worst[0]:
                worst = (ms, tid)
        time.sleep(1)
    trace.get_tracer_provider().shutdown()
    print(f"\nslowest span: {worst[0]:.1f} ms  trace_id={worst[1]}")
    print("Grafana http://localhost:3000 -> Explore -> Tempo -> paste that trace_id,")
    print(
        "then compare it against rest_responses_duration_seconds for the same minute."
    )
```

The instrumentor wraps every `qdrant_client` call in a span that carries the collection name.

Run it:

```bash
.venv/bin/python app.py
```

Copy the trace id of the slowest span. You need it in Step 7.

## Step 6: Read the metrics

The script reads six groups of signals from Prometheus and prints whether each group arrived. Then it shows whether the histogram has the `collection` label.

```python
import json
import sys
import urllib.parse
import urllib.request

PROM = "http://localhost:9090"

WANT = [
    (
        "rest_responses_duration_seconds",
        "time inside Qdrant (histogram) — linked to the slow trace",
    ),
    (
        "collection_running_optimizations",
        "active optimizations. The documented #1 cause of slow search. Only on /metrics, not /sys_metrics",
    ),
    (
        "traefik_service_request_duration_seconds",
        "time at the Cloud edge — network vs server",
    ),
    (
        "container_cpu_cfs_throttled_periods_total",
        "CPU throttling, when saturation is the cause",
    ),
    ("qdrant_node_rssanon_bytes", "the memory metric that precedes an OOM"),
    ("qdrant_collection_number_of_rest_requests", "cluster-side request counters"),
]


def names():
    with urllib.request.urlopen(
        f"{PROM}/api/v1/label/__name__/values", timeout=30
    ) as r:
        return json.load(r)["data"]


def query(q):
    url = f"{PROM}/api/v1/query?query={urllib.parse.quote(q)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)["data"]["result"]


if __name__ == "__main__":
    try:
        have = names()
    except Exception as e:
        sys.exit(
            f"cannot reach Prometheus at {PROM}: {e}\nis the stack up? docker compose ps"
        )

    print(f"{len(have)} metric names in the backend\n")
    missing = []
    for needle, why in WANT:
        hits = sorted(n for n in have if needle in n)
        print(("OK  " if hits else "MISS") + f" {needle}\n       {why}")
        for h in hits[:3]:
            print(f"         - {h}")
        if not hits:
            missing.append(needle)

    with_collection = query(
        'rest_responses_duration_seconds_bucket{collection="qdrant-docs"}'
    )
    print(
        f"\nper-collection histogram: {'OK' if with_collection else 'MISS'}"
        "  (collection= label present on the bucket)"
    )

    assert not missing, f"not bridged: {missing} — check the scrape targets and API key"
    print(
        "\nall signals present: the Collector bridges Qdrant Cloud into an OTel backend"
    )
```

Wait at least a minute after `app.py` starts, because the scrape interval is 15 seconds.

```bash
.venv/bin/python verify.py
```

If a signal is missing, make sure that `QDRANT_HOST` and the API key are correct. Also make sure that the stack is up.

## Step 7: Look at the slow trace

Open Grafana at <http://localhost:3000>. Go to **Explore**. Pick **Tempo**. Paste the trace id.

The span shows you what the app saw. It shows the call to `query_points`, the SDK span that wraps it, and `qdrant.client_observed_ms` on the span.

The cluster side of the same window is in Prometheus. The signals you want:

| Signal                                      | What it tells you                          |
| ------------------------------------------- | ------------------------------------------ |
| `span duration`                             | what the app saw                           |
| `rest_responses_duration_seconds`           | time inside Qdrant                         |
| `traefik_service_request_duration_seconds`  | time at the Cloud edge. Network vs server. |
| `collection_running_optimizations`          | active optimizations. Read this first      |
| `container_cpu_cfs_throttled_periods_total` | the cause when CPU is the bottleneck       |
| `qdrant_node_rssanon_bytes`                 | the cause when memory is the bottleneck    |

To read the histogram for one collection with data, use the PromQL query. This query asks for the 50th percentile over a one-minute window:

```promql
histogram_quantile(0.5,
  sum by (le, collection) (
    rate(rest_responses_duration_seconds_bucket{collection="qdrant-docs"}[1m])
  )
)
```

`per_collection=true` is the `params` block on the `qdrant-node` scrape, from Step 2. Without it, `rest_responses_duration_seconds_bucket` has no `collection` label. The query returns nothing.

<aside role="status">
The docs list <code>per_collection=true</code> as available from v1.18. It works on 1.17.1, duration histograms included. Check your own cluster version rather than assuming either way.
</aside>

The `collection` label on the histogram matches the `db.collection.name` attribute on the span. You can compare the two values directly.

### Read the ratio, not the total

Compare the span duration against `rest_responses_duration_seconds` for the same window. On Qdrant Cloud the two rarely match, and the gap is the point.

Measured on a single-node 1.17.1 cluster against the `qdrant-docs` collection above, 20 requests per shape, `rest_responses_duration_seconds` read straight from `/metrics`:

| Query shape          | Client median | Mean time inside Qdrant |
| -------------------- | ------------- | ----------------------- |
| `docs`, `limit=10`   | 312.6 ms      | 2.71 ms                 |
| `blog`, `limit=1000` | 316.2 ms      | 3.42 ms                 |

Under 1% of what the client waits for is spent inside the database. Asking for 100 times more results makes Qdrant do 26% more work and moves the client total by 1%. The rest is transit between your machine and the cluster, so treat a slow span as a placement or transport problem until the histogram says otherwise.

Your own numbers will differ with vector dimension, collection size, and region. The ratio is what to watch, not the absolute figures.

This also means the slowest span your app records is often a network outlier on the cheaper query rather than the expensive one. Rank traces by `rest_responses_duration_seconds` when you want to find work the database actually did.

## Import the Grafana dashboard

Qdrant publishes dashboards at [qdrant-cloud-grafana-dashboard](https://github.com/qdrant/qdrant-cloud-grafana-dashboard). Import `qdrant_cloud_dashboard.json` through **Dashboards > New > Import** in the Grafana at <http://localhost:3000>. The other dashboard in that repository targets self-managed Hybrid and Private Cloud, and needs `kube_*` series that this setup does not scrape.

<aside role="alert">
Several API latency and request rate panels query <code>envoy_cluster_upstream_rq_*</code>. Clusters that route through Traefik emit <code>traefik_*</code> instead, so you see those panels empty. The <code>qdrant_*</code> and <code>container_*</code> panels fill normally. Check which proxy your cluster reports before you read a blank panel as an outage.
</aside>

These dashboards are community maintained. Treat them as a starting point rather than a supported product surface.

## Use a different backend

Change the `exporters` block. Endpoint and an auth header are all that differ.

| Backend       | Endpoint                                        | Header                                          |
| ------------- | ----------------------------------------------- | ----------------------------------------------- |
| Datadog       | `https://api.<datadoghq.com>:4317`              | `DD-API-KEY: <your-key>`                        |
| Grafana Cloud | `https://otlp-gateway-<region>.grafana.net:443` | `Authorization: Basic <base64(instance:token)>` |
| New Relic     | `https://otlp.nr-data.net:4317`                 | `api-key: <your-key>`                           |
| Honeycomb     | `https://api.honeycomb.io:443`                  | `x-honeycomb-team: <your-key>`                  |

Confirm the endpoint and header against your vendor's own OTLP documentation before you rely on a row. This tutorial was verified end to end against `grafana/otel-lgtm` only.

## Scrape targets and alerting are separate

This page sets up scrape targets. It does not configure alerts. Once the signals land in your backend, write alerting rules there against `collection_running_optimizations`, `qdrant_node_rssanon_bytes`, and the request histograms. On Kubernetes, the Qdrant operator can install its own Prometheus rules, which are configured separately from anything on this page.

## Verified against

Qdrant Cloud 1.17.1, single node, `us-west-1`, the `qdrant-docs` snapshot at 18,828 points and 384 dimensions. Collector image `otel/opentelemetry-collector-contrib`, backend `grafana/otel-lgtm`. The Kubernetes and self-hosted paths above are described but not verified in this configuration.

## Next

- [OpenLLMetry](/documentation/observability/openllmetry/) instruments `qdrant_client` and exports spans.
- [OpenLIT](/documentation/observability/openlit/) auto-instruments your app.
- [Datadog integration](/documentation/observability/datadog/) is the managed scrape path when Datadog is your only backend.
- [Cluster monitoring](/documentation/ops-monitoring/monitoring/) lists every metric Qdrant exposes.
- [qdrant-opentelemetry-tutorial](https://github.com/meinsta/qdrant-opentelemetry-tutorial) is a runnable version of this page, with a notebook, a check that fails if a signal does not arrive, and three Kubernetes deployment paths.
- [OpenTelemetry Collector reference](https://opentelemetry.io/docs/collector/) covers receivers, processors, and exporters.
- [OpenTelemetry Operator](https://opentelemetry.io/docs/kubernetes/operator/) wraps the same `otelcol-config.yaml` for Kubernetes.
