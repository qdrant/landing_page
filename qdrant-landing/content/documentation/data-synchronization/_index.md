---
title: Keeping Data in Sync
weight: 33
is_empty: false
partition: build
---

# Keeping Postgres and Qdrant in Sync

If you've migrated your vectors to Qdrant but still use Postgres as your source of truth, the next challenge is keeping both systems in sync as data changes.

This section covers three progressively robust sync architectures — from simple application-level dual-writes to production-grade Change Data Capture — with working code, failure mode analysis, and clear guidance on when to use each.

Not sure if you need a dedicated vector store alongside Postgres? Read our [pgvector tradeoffs blog post](/blog/pgvector-tradeoffs/) to understand the six conditions under which pgvector is sufficient — and when you'll outgrow it.

## Three Tiers of Sync

| Tier | Pattern | Best For | Sync Lag |
| :--- | :--- | :--- | :--- |
| [Tier 1: Dual-Write](/documentation/data-synchronization/dual-writes/) | Write to both in request handler | Prototypes, < 10K records | None (synchronous) |
| [Tier 2: Transactional Outbox](/documentation/data-synchronization/transactional-outbox/) | Outbox table + background worker | Most production apps | Seconds |
| [Tier 3: Change Data Capture](/documentation/data-synchronization/change-data-capture/) | Debezium + Redpanda/Kafka | High-throughput, multi-consumer | Seconds |

## Choosing Your Tier

```
Do you have < 10K records and low write volume?
└── Yes → Tier 1 (dual-write) is fine to start

Does Qdrant downtime need to be invisible to your write path?
└── Yes → Go to Tier 2

Do you already run Kafka/Redpanda infrastructure?
└── Yes → Tier 3 is a natural fit

Do multiple services (not just Qdrant) need to react to data changes?
└── Yes → Tier 3

Otherwise → Tier 2
```

These tiers aren't permanent decisions. Start with Tier 1. When you hit its limits — Qdrant outages generating too much drift, write latency becoming noticeable — move to Tier 2. Only when Tier 2 becomes a bottleneck or you need replay capability should you invest in Tier 3.
