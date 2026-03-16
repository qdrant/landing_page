---
title: "Tier 3: Change Data Capture"
weight: 40
---

# Tier 3: Change Data Capture with Debezium + Redpanda

> "Let Postgres tell Qdrant what changed"

## Architecture

CDC is architecturally different from [dual-writes](/documentation/data-synchronization/dual-writes/) and the [transactional outbox](/documentation/data-synchronization/transactional-outbox/) in a fundamental way: **the application code has no awareness of Qdrant**. The FastAPI routes are pure Postgres CRUD — they don't import the Qdrant client, they don't write to an outbox. Sync is handled entirely in the infrastructure layer.

## How It Works

Postgres's Write-Ahead Log (WAL) is a sequential log of every change to the database — it exists for crash recovery and replication. With `wal_level = logical`, external consumers can read this log in a structured format.

Debezium connects to Postgres via a logical replication slot and captures every INSERT, UPDATE, and DELETE on the `products` table as a JSON event. These events are published to a Redpanda topic. A Python consumer service reads from that topic and calls Qdrant.

## Postgres Setup

```sql
-- Enable in postgresql.conf (or docker-compose command args):
-- wal_level = logical

-- Create a publication for the products table
CREATE PUBLICATION products_publication FOR TABLE products;
```

## Debezium Connector Config

```json
{
    "name": "products-connector",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "database.hostname": "postgres",
        "database.port": "5432",
        "database.user": "debezium",
        "database.dbname": "fashiondb",
        "database.server.name": "pgserver",
        "table.include.list": "public.products",
        "plugin.name": "pgoutput",
        "publication.name": "products_publication",
        "slot.name": "qdrant_sync",
        "topic.prefix": "pgserver",
        "transforms": "unwrap",
        "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
        "transforms.unwrap.delete.handling.mode": "rewrite"
    }
}
```

The `ExtractNewRecordState` transform unwraps Debezium's envelope format into a flat payload, and adds an `__op` field (`c` = create, `u` = update, `d` = delete) so the consumer doesn't have to parse the raw Debezium schema.

## The Consumer Service

```py
from confluent_kafka import Consumer

def consume_and_sync():
    consumer = Consumer({
        "bootstrap.servers": "redpanda:9092",
        "group.id": "qdrant-sync",
        "auto.offset.reset": "earliest",
        "enable.auto.commit": "false",  # manual commit after successful processing
    })
    consumer.subscribe(["pgserver.public.products"])

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue

        event = json.loads(msg.value())
        op = event.get("__op")  # 'c', 'u', or 'd'

        if op in ("c", "u"):
            upsert_to_qdrant(event)
        elif op == "d":
            delete_from_qdrant(event["article_id"])

        consumer.commit()  # commit only after successful processing
```

Manual offset commits (committing only after successfully processing each message) give you at-least-once semantics: if the consumer crashes mid-message, it reprocesses from the last committed offset on restart.

## Redpanda vs. Kafka

The example uses Redpanda as the event bus. Redpanda is Kafka-wire-protocol-compatible but ships as a single binary with no ZooKeeper dependency — simpler to run. The consumer code is identical whether you point it at Redpanda or Apache Kafka; just change `bootstrap.servers`.

## The Killer Feature: Replaying History

CDC's most underappreciated advantage is replayability. If Qdrant needs to be rebuilt from scratch — new index configuration, migration to a new cluster, disaster recovery — you can do it by replaying the Redpanda topic from the beginning. Every change that ever happened to the products table is recorded in the event stream.

With [dual-write](/documentation/data-synchronization/dual-writes/) or the [outbox](/documentation/data-synchronization/transactional-outbox/), a full rebuild requires running a bulk export from Postgres. With CDC, the event stream *is* the rebuild mechanism.

## Failure Modes

| Failure | Consequence | Mitigation |
| :---- | :---- | :---- |
| Qdrant is down | Consumer pauses; Redpanda retains events | Consumer retries; resumes from offset on recovery |
| Redpanda is down | Debezium buffers; WAL grows | Monitor WAL size; Redpanda HA with replication in production |
| Debezium crashes | WAL retains changes since last checkpoint | Debezium resumes from replication slot on restart |
| Schema change in Postgres | Connector may need restart | Monitor connector status; test schema migrations in staging |

## The WAL Disk Bloat Problem

One operational hazard specific to CDC: Postgres holds WAL segments until the replication slot consumer acknowledges them. If your consumer is down for a long time, Postgres can accumulate significant disk usage. Monitor replication slot lag:

```sql
SELECT
    slot_name,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)
    ) AS lag
FROM pg_replication_slots;
```

Set up alerting if this exceeds a few GB. In extreme cases (consumer permanently down), you may need to drop the replication slot — which means re-seeding Qdrant from Postgres rather than from the event stream.

## When to Use This

- High write throughput systems where the outbox table would become a bottleneck
- When multiple downstream consumers need to react to changes (not just Qdrant)
- When application code must be fully decoupled from sync concerns
- Teams with existing Redpanda/Kafka infrastructure
- When replay-from-scratch capability is a requirement

Tier 3 is genuinely powerful, but it comes with real operational costs: Redpanda and Debezium to deploy, configure, monitor, and upgrade. If you're not already running streaming infrastructure, think hard before adding it for a single sync use case. [Tier 2](/documentation/data-synchronization/transactional-outbox/) handles most production scenarios with far less complexity.

## Comparison Matrix

| Dimension | Tier 1: Dual-Write | Tier 2: Outbox | Tier 3: CDC |
| :---- | :---- | :---- | :---- |
| **Sync complexity** | Low | Medium | High |
| **Extra infrastructure** | None | Outbox table + worker | Redpanda + Debezium + consumer |
| **Consistency model** | Best-effort | At-least-once, eventual | At-least-once, eventual |
| **Write latency impact** | Adds Qdrant round-trip | None (async) | None (async) |
| **Qdrant downtime impact** | Generates drift | Events queue in Postgres | Events queue in Redpanda |
| **Captures direct SQL** | No | No | Yes (all WAL changes) |
| **Replay capability** | No | Limited (outbox retention) | Yes (Redpanda retention) |
| **Operational overhead** | Minimal | Low-Medium | High |
| **Best for** | Prototypes, internal tools | Most production apps | High-throughput, multi-consumer |
