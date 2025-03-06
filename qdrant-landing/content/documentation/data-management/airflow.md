---
title: Apache Airflow
aliases: [ ../frameworks/airflow/ ]
---

# Apache Airflow

[Apache Airflow](https://airflow.apache.org/) is an open-source platform for authoring, scheduling and monitoring data and computing workflows. Airflow uses Python to create workflows that can be easily scheduled and monitored. 

Qdrant is available as a [provider](https://airflow.apache.org/docs/apache-airflow-providers-qdrant/stable/index.html) in Airflow to interface with the database.

## Prerequisites

Before configuring Airflow, you need:

1. A Qdrant instance to connect to. You can set one up in our [installation guide](/documentation/guides/installation/).

2. A running Airflow instance. You can use their [Quick Start Guide](https://airflow.apache.org/docs/apache-airflow/stable/start.html).

## Installation

You can install the Qdrant provider by running `pip install apache-airflow-providers-qdrant` in your Airflow shell.

**NOTE**: You'll have to restart your Airflow session for the provider to be available.

## Setting up a connection

Open the `Admin-> Connections` section of the Airflow UI. Click the `Create` link to create a new [Qdrant connection](https://airflow.apache.org/docs/apache-airflow-providers-qdrant/stable/connections.html).

![Qdrant connection](/documentation/frameworks/airflow/connection.png)

You can also set up a connection using [environment variables](https://airflow.apache.org/docs/apache-airflow/stable/howto/connection.html#environment-variables-connections) or an [external secret backend](https://airflow.apache.org/docs/apache-airflow/stable/security/secrets/secrets-backend/index.html).

## Qdrant hook

An Airflow hook is an abstraction of a specific API that allows Airflow to interact with an external system.

```python
from airflow.providers.qdrant.hooks.qdrant import QdrantHook

hook = QdrantHook(conn_id="qdrant_connection")

hook.verify_connection()
```

A [`qdrant_client#QdrantClient`](https://pypi.org/project/qdrant-client/) instance is available via `@property conn` of the `QdrantHook` instance for use within your Airflow workflows.

```python
from qdrant_client import models

hook.conn.count("<COLLECTION_NAME>")

hook.conn.upsert(
    "<COLLECTION_NAME>",
    points=[
        models.PointStruct(id=32, vector=[0.32, 0.12, 0.123], payload={"color": "red"})
    ],
)

```

## Qdrant Ingest Operator

The Qdrant provider also provides a convenience operator for uploading data to a Qdrant collection that internally uses the Qdrant hook.

```python
from airflow.providers.qdrant.operators.qdrant import QdrantIngestOperator

vectors = [
    [0.11, 0.22, 0.33, 0.44],
    [0.55, 0.66, 0.77, 0.88],
    [0.88, 0.11, 0.12, 0.13],
]
ids = [32, 21, "b626f6a9-b14d-4af9-b7c3-43d8deb719a6"]
payload = [{"meta": "data"}, {"meta": "data_2"}, {"meta": "data_3", "extra": "data"}]

QdrantIngestOperator(
    conn_id="qdrant_connection",
    task_id="qdrant_ingest",
    collection_name="<COLLECTION_NAME>",
    vectors=vectors,
    ids=ids,
    payload=payload,
)
```

## Reference
- 📦 [Provider package PyPI](https://pypi.org/project/apache-airflow-providers-qdrant/)
- 📚 [Provider docs](https://airflow.apache.org/docs/apache-airflow-providers-qdrant/stable/index.html)
- 📄 [Source Code](https://github.com/apache/airflow/tree/main/providers/qdrant)
