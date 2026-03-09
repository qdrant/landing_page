---
title: "Data syncing"
short_description: "How to keep your vector database in sync with your data."
description: "How to keep your vector database in sync with your data. A practical guide to maintaining consistency between PostgreSQL and Qdrant."
preview_dir: /articles_data/postgres-qdrant-syncing/preview
social_preview_image: /articles_data/postgres-qdrant-syncing/social_preview.png
weight: -150
author: Nathan LeRoy
date: 2026-02-27T00:00:00.000Z
---
# The elephant in the room: how to keep your vector database in sync with your data

As the vector database space has matured, consolidated, and evolved, the developer community is begining to hear echos of the past. Like the great Mark Twain once said, "History doesn't repeat itself, but it often rhymes." The rise of vector databases and their relationship with general-purpose databases like Postgres is starting to rhyme with the NoSQL wave of a decade ago. Developers are starting to ask themselves, "Do I really need a dedicated vector store, or can I just use pgvector and call it a day?" Between the VC-funded hype and constant framework churn it's genuinely hard to get a straight answer about when you actually need a dedicated vector store — and harder _still_ to find practical guidance on what to do once you've decided you do.

This article is an attempt to cut through that. It first starts with a qualitative analysis of what the developer community actually thinks by analyzing over 100 community threads from Reddit and Hackernews, then dicusses when pgvector is the right default, acknowledges where dedicated vector stores genuinely win, and finally presents three progressively sophisticated architectures for keeping Postgres and Qdrant in sync — with working code for each.

---

## Vector databases _unfiltered-edition_

Before we get into sync architectures, it's worth grounding the conversation in what developers are actually experiencing. I reviewed 110 community threads from Hacker News and Reddit discussing pgvector vs. dedicated vector stores, and the patterns were remarkably consistent. I was left with four key takehome messages:

1. The dominant decision heuristic is "start with pgvector, graduate if needed"
2. The #1 reason people migrate *toward* pgvector is data sync pain
3. The community has converged on a rough ~10M vector threshold for pgvector viability
4. The real technical weaknesses of pgvector are metadata filtering and hybrid search, not raw search speed

I detail each in turn below, with representative quotes from the community threads.

### The dominant decision heuristic: "Start with pgvector, graduate if needed"

Across developer backgrounds and experience levels, the most common advice is a simple heuristic that goes like this: start with pgvector, and only move to a dedicated vector store when you have a specific, demonstrable reason to.

> "My decision tree looks like this: Use pgvector until I have a very specific reason not to."

> "Default to pgvector, avoid premature optimization."

> "The lesson for me isn't 'don't use Pinecone', but more like 'did you already max out Postgres?'"

Authors of quotes like these are often people already running postgres for transactional data, who added pgvector as a feature and found it sufficient for their needs. Moreover, the data-scale is often in thousands, not millions. Postgres is revered for its versatility and reliability, and the fact that pgvector is a native extension means it inherits all of that. The barrier to entry is low, and the operational overhead is minimal. This makes it a natural first choice for developers who want to add vector search capabilities without introducing new infrastructure.

### The #1 reason people migrate *toward* pgvector: data sync pain

Of all the operational burdens cited in the corpus, data synchronization is the most consistently painful. Developers who have run a separate vector database alongside their relational database frequently report that keeping two systems in sync was a major headache.

> "It was a PITA keeping data synced between pgsql <> qdrant."

> "One of the biggest nightmares with Pinecone was keeping the data in sync... With pg_vector integrated directly into my main database, this synchronization problem has completely disappeared."

> "In my research, Qdrant was also the top contender... but the need to sync two DBs put me off."

This is essential the core of the problem. More systems means more complexity, more maintenance, more cost, and more surface area for failure. When your vectors live in the same database as your relational data, there's no sync gap to manage, no reconciliation to run, no failure modes to reason about across two systems.

### The ~10M vector threshold

Pgvector, however, is not without limitations. The community has converged on a rough empirical limit for the number of vectors you can store with it. Specifically, `pgvector` is comfortably viable up to ~10 million vectors. Beyond that, the advice shifts toward dedicated stores or advanced Postgres extensions like pgvectorscale or VectorChord (also monetized, so at that point you're really just choosing your flavor of vector database).

> "PGVector is a good choice when your dataset is smaller than 10M."

> "I think anything under 10M records [can] use PGVector."

This isn't a hard wall. There is a VectorChord case study pushing PostgreSQL to 3 billion vectors — but it's a useful first approximation.

### More shortcomings with pgvector: metadata filtering and hybrid search

When dedicated vector stores are defended on technical grounds, the arguments almost always center on two specific capabilities: efficient metadata pre-filtering and native hybrid search (dense + sparse/BM25). Raw search speed is rarely the bottleneck at typical production scales. Indeed, it's the filter-then-search problem that most often pushes developers toward dedicated stores.

> "I think the most relevant weakness for pgvector is the lack of 'proper' prefiltering on metadata while leveraging the vector index."

> "Pinecone allows hybrid search, merging dense and sparse vector embeddings that Postgres can't do AFAIK."

The hybrid search gap is worth unpacking because it's often conflated with Postgres's built-in full-text search — and they're not the same thing.

Postgres has had excellent full-text search via `tsvector`/`tsquery` for years. You can rank results with `ts_rank`, build GIN indexes on document vectors, and even combine a full-text query with a vector similarity query using `UNION` or a weighted score. But this is lexical search — it operates on exact term matches, stemming, and stop words. BM25, on the other hand, is a probabilistic model that considers term frequency, inverse document frequency, and document length to rank results. It's more sophisticated than simple full-text search and often yields better relevance for keyword-based queries. Dedicated stores like Qdrant support this natively.

---

## So, when _should_ you use pgvector?

pgvector is a reasonable choice, but only when a fairly specific set of conditions all hold simultaneously. Namely, you should consider pgvector if the following six conditions are all true:

**1. Your vector dataset is small — under 1M vectors.** Above this threshold you'll start hitting index-build times, memory pressure, and recall degradation under load. The community's empirical ceiling is around 10M, but the comfortable range is much lower.

**2. You don't need accurate metadata filtering.** If every search is against the full collection, then post-filtering wont limit you. However, when you need to scope searches to a user, a tenant, a category, or any selective predicate, then `pgvector` can generate a lot of unnecessary search overhead.

**3. Your embeddings are tightly coupled to relational data.** If the primary value of your vectors is as an attribute of a row (e.g. a product description embedding stored alongside the product), then colocation genuinely helps. If vectors are the star of the show and your relational data is just metadata, then the operational benefits of colocation are less compelling.

**4. You don't need hybrid search.** Your queries are natural language questions against prose content, where dense retrieval alone performs well. Keyword-sensitive workloads (product catalogs, code search, technical documentation) will leave relevance on the table.

**5. Postgres is already doing the heavy lifting for your business logic.** You have existing transactions, schemas, and ACID guarantees that matter for your application. Adding Qdrant means splitting that concern. If Postgres is already central, the operational argument for colocation holds.

**6. Your team is small enough that embedding search logic in SQL is manageable.** Typically regarded as an anti-pattern, storing business logic (like search) in the database can be a pragmatic choice for small teams that want to avoid maintaining separate application code for search. If your team is comfortable with SQL and the search logic is relatively simple, pgvector's colocation can reduce cognitive overhead.

If you check all six boxes, pgvector is a pragmatic starting point. If you're missing even two or three — especially the filtering or scale ones — you're going to hit friction sooner than you expect.

---

## Where Dedicated Vector Stores Genuinely Win

To rephrase the above in positive "wins" for dedicated vector stores, there are four key ways in which a dedicated vector store like Qdrant is prefferable to pgvector:

**Efficient metadata filtering.** Dedicated vector stores like Qdrant are designed to handle selective predicates efficiently. They can leverage indexes on metadata fields to narrow down the search space before performing vector similarity calculations, which is crucial for large datasets.

**Native hybrid search.** If your relevance depends on a combination of dense similarity and keyword matching, dedicated stores that support BM25 or similar algorithms natively will outperform any Postgres-based workaround.

**Scalability beyond 10M vectors.** Dedicated vector stores are optimized for large-scale vector data, with features like sharding, distributed indexing, and optimized memory management that allow them to handle tens or hundreds of millions of vectors with low latency.

**Decoupled architecture.** By separating your vector search from your relational database, you can scale, optimize, and evolve each independently. This is especially beneficial for applications where vector search is a critical path that requires specialized performance tuning.

---

## The Sync Problem (and Why We're Here)

Given the above analysis, the real "elephant in the room" still remains: keeping your vector database in sync with your relational data. There are many ways to solve this problem, each with its own trade-offs in terms of complexity, consistency guarantees, and operational overhead. The right choice depends on your specific requirements around latency, durability, and tolerance for inconsistency.

In this article, we present three tiers of sync architecture, each progressively more robust and complex. What follows is a walkthrough of all three approaches, using a consistent running example so you can compare them directly.

---

## The Running Example: Fashion Product Catalog

Imagine you're building a fashion ecommerce site. Postgres is your system of record — it holds your product catalog, handles inventory writes, and backs your order management logic. Qdrant sits alongside it as a dedicated search layer, powering the site's search bar with hybrid dense + BM25 retrieval. A FastAPI service acts as the backend: it receives product write requests from the rest of your system, keeps both databases in sync, and exposes search endpoints that the frontend calls directly. The only thing that changes across our three tiers is *how* the sync between Postgres and Qdrant happens.

All three implementations use the same fashion product catalog backed by the [H&M Personalized Fashion Recommendations dataset](https://huggingface.co/datasets/Qdrant/hm_ecommerce_products) (~106K products, with a 1K-product subsample for the demo).

The schema is deliberately simple:

```sql
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    article_id      VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    product_type    VARCHAR(100),
    product_group   VARCHAR(100),
    color           VARCHAR(50),
    department      VARCHAR(100),
    index_name      VARCHAR(100),
    image_url       VARCHAR(500),
    price           DECIMAL(10,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

The Qdrant collection mirrors this with both dense and sparse vectors — using Qdrant Cloud Inference to generate embeddings server-side, which removes the need for a separate embedding pipeline:

```python
client.create_collection(
    collection_name="products",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(modifier=models.Modifier.IDF),
    },
)
```

Each point's ID is a deterministic UUID derived from the `article_id`, so both systems share a natural key without maintaining a mapping table. The FastAPI app exposes the same CRUD endpoints across all three tiers:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/products` | Create a product |
| `PUT`  | `/products/{id}` | Full update |
| `PATCH`| `/products/{id}` | Partial update |
| `DELETE`| `/products/{id}` | Delete |
| `GET`  | `/search` | Hybrid search (dense + BM25 + RRF) |
| `GET`  | `/search/semantic` | Dense-only |
| `GET`  | `/search/keyword` | BM25-only |
| `POST` | `/sync/reconcile` | Compare Postgres vs. Qdrant, fix drift |

The only thing that changes between tiers is the sync mechanism. The search endpoints are identical — because Qdrant is always the read store, all three tiers produce identical search results once data is synced.

---

## Tier 1: Application-Level Dual-Write

**"Just do it in your app code"**

### Architecture

<!-- Figure for tier1 architecture -->

<!-- ```
┌──────────┐     1. Write product     ┌───────────┐
│  Client  │ ───────────────────────► │  FastAPI  │
└──────────┘                          └─────┬─────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         │ 2a. INSERT                           │ 2b. Upsert point
                         ▼                                      ▼
                   ┌──────────┐                          ┌──────────┐
                   │ Postgres │                          │  Qdrant  │
                   └──────────┘                          └──────────┘
``` -->

Every CRUD endpoint writes to Postgres first, then to Qdrant, in the same request handler. If the Qdrant write fails, the error is logged but the request succeeds — Postgres is the source of truth, and a reconciliation job can fix drift later.

### The Code

The route handler is exactly what you'd expect: one write after the other, with error handling around the Qdrant call:

```python
@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate):
    # 1. Write to Postgres first — it is the source of truth
    row = await insert_product(product.model_dump())

    # 2. Write to Qdrant — non-blocking on failure; reconcile catches drift
    try:
        await upsert_product(row)
    except Exception as exc:
        logger.error("Qdrant upsert failed for %s: %s", product.article_id, exc)

    return row
```

The same pattern applies to every mutating operation: Postgres first, Qdrant second, exceptions caught and logged but not re-raised.

### Failure Modes

| Failure | Consequence | Mitigation |
|---------|-------------|------------|
| Qdrant is down | Postgres write succeeds; Qdrant write silently skipped | Logged; `reconcile` fixes drift |
| Qdrant is slow | Request latency spikes (blocks on Qdrant call) | Client has configurable timeout |
| Postgres fails after Qdrant write | Orphaned point in Qdrant | Write Postgres first; `reconcile --fix` cleans up |
| Network partition | Partial writes | Reconciliation script |

### What This Approach Gets Right

The strongest argument for dual-write isn't correctness — it's cognitive simplicity. A new engineer can read this code and immediately understand the entire sync story. There are no background workers, no queues, no separate processes. The request handler is the sync mechanism.

This simplicity has real value for prototypes, internal tools, and early-stage products where iteration speed matters more than operational rigor.

### Where It Falls Apart

The write path is coupled to Qdrant availability. If Qdrant has a hiccup — even a brief one — you're generating drift that has to be cleaned up later. There's no guarantee that every write will reach Qdrant; you're relying on reconciliation to eventually make things right.

More subtly: the request latency includes the Qdrant round-trip. For write-heavy workloads, this becomes a bottleneck.

### When to Use This

- Prototypes and MVPs
- Internal tools where occasional inconsistency is tolerable
- Low write throughput (< 10K products, < a few hundred writes/day)
- Teams that want to ship fast and revisit operational concerns later

---

## Tier 2: Transactional Outbox Pattern

**"Never lose a sync event"**

### Architecture

<!-- Figure for tier2 architecture -->
<!-- ```
┌──────────┐     1. Write product     ┌───────────┐
│  Client  │ ───────────────────────► │  FastAPI  │
└──────────┘                          └─────┬─────┘
                                            │
                           2. Single Postgres transaction:
                           ┌────────────────────────────────┐
                           │  INSERT INTO products (...)    │
                           │  INSERT INTO sync_outbox (...)  │
                           └────────────────┬───────────────┘
                                            │
                                     ┌──────────┐
                                     │ Postgres │
                                     └─────┬────┘
                                           │
                            3. Worker: poll or LISTEN/NOTIFY
                                           │
                                           ▼
                                     ┌───────────┐
                                     │  Worker   │
                                     └─────┬─────┘
                                           │
                            4. Upsert/delete in Qdrant
                                           ▼
                                     ┌──────────┐
                                     │  Qdrant  │
                                     └──────────┘
``` -->

In this architecture, instead of writing to Qdrant directly from the request handler, we write an *event* into a `sync_outbox` table in the **same Postgres transaction** as the product write. Then, a background worker picks up these events and syncs them to Qdrant asynchronously.

The primary benefit of this architecture is that the outbox event exists if and only if the product write succeeded. There's no window between the two — they commit atomically.

### The Outbox Table

```sql
CREATE TABLE sync_outbox (
    id           BIGSERIAL PRIMARY KEY,
    entity_id    VARCHAR(20) NOT NULL,   -- article_id
    operation    VARCHAR(10) NOT NULL,   -- 'upsert' | 'delete'
    payload      JSONB,                  -- product snapshot at write time
    status       VARCHAR(20) DEFAULT 'pending',
    attempts     INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    last_error   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
```

Note the `payload` column: it stores the full product data at write time. The worker doesn't re-query the products table — by the time it processes an event, the product may have been updated again. The payload is the snapshot that was valid when the event was created.

### The Write Path

Every CRUD endpoint opens a single Postgres transaction that writes both the product and the outbox event:

```python
@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(INSERT_SQL, *product_values())
            await enqueue_upsert(conn, product.article_id, dict(row))
    return dict(row)
```

`enqueue_upsert` inserts a row into `sync_outbox` on the same connection, within the same transaction. If anything fails, both writes roll back together.

The request returns as soon as the Postgres transaction commits. Qdrant isn't touched during request handling.

### The Worker

A background async task processes outbox events in batches. The critical concurrency primitive here is `FOR UPDATE SKIP LOCKED` — it lets multiple workers claim events safely without stepping on each other, and without the overhead of a distributed lock:

```python
async def process_batch() -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            UPDATE sync_outbox
            SET status = 'processing', attempts = attempts + 1
            WHERE id IN (
                SELECT id FROM sync_outbox
                WHERE status IN ('pending', 'failed')
                    AND attempts < max_attempts
                ORDER BY created_at ASC
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            """,
            BATCH_SIZE,
        )

    for row in rows:
        await _process_event(dict(row))

    return len(rows)
```

Events that fail get their `attempts` counter incremented and their `status` set back to `'pending'` (or `'failed'` if they've exceeded `max_attempts`). Qdrant upserts are naturally idempotent by point ID, so duplicate processing is harmless.

### Two Worker Modes

The implementation ships with two delivery strategies, selectable via environment variable:

**Polling** (default): the worker wakes up every N seconds, checks for pending events, and processes them. Simple, robust, and doesn't require a persistent database connection.

**LISTEN/NOTIFY**: a Postgres trigger fires `NOTIFY sync_outbox_insert` when a new row is inserted. The worker wakes up immediately, processes the batch, and goes back to waiting. This gives near-real-time sync without busy-polling.

```python
async def run_listen_worker() -> None:
    conn = await asyncpg.connect(dsn)
    await conn.execute("LISTEN sync_outbox_insert")

    while True:
        try:
            await asyncio.wait_for(conn.wait_for_notify(), timeout=30.0)
        except asyncio.TimeoutError:
            pass  # fall back to sweep anyway

        await process_batch()
```

The 30-second sweep fallback is important: if a notification is missed (e.g., the worker was down briefly), the polling fallback ensures nothing stays stuck indefinitely.

### Failure Modes

| Failure | Consequence | Mitigation |
|---------|-------------|------------|
| Qdrant is down | Events queue in `sync_outbox` | Worker retries with backoff on recovery |
| Worker crashes | Events remain `pending` | Worker picks up on restart; `SKIP LOCKED` prevents double-processing |
| Duplicate processing | Same event processed twice | Qdrant upserts are idempotent by point ID |
| Outbox table grows large | Storage/performance impact | Prune `completed` events older than N days |

### What This Approach Gets Right

The write path is completely decoupled from Qdrant. If Qdrant is down for an hour, writes succeed normally and events queue up. When Qdrant comes back, the worker drains the queue. The application never blocks on Qdrant.

The delivery semantics are clear and enforceable: at-least-once, durable in Postgres, retried until success or `max_attempts`. Failed events are visible in the database and inspectable with SQL.

You also get a natural `/sync/status` endpoint:

```python
@router.get("/sync/status")
async def sync_status():
    return await get_sync_status()
# → {"pending": 0, "failed": 0, "avg_lag_seconds": 1.2}
```

### The Trade-off

You have eventual consistency. There's a window — typically milliseconds to seconds — between when a product is written to Postgres and when it appears in Qdrant search results. For most applications this is perfectly acceptable. For applications where writes must be immediately searchable (real-time bidding, live inventory with hard availability constraints), this requires a different approach.

You also have a new table to manage: the outbox table grows over time and needs periodic cleanup of completed events.

### When to Use This

- Most production applications with moderate write throughput
- When Qdrant availability shouldn't impact your write path
- When you can tolerate seconds of sync lag
- **The recommended default for the majority of production Postgres + Qdrant deployments**

---

## Tier 3: Change Data Capture with Debezium + Redpanda

**"Let Postgres tell Qdrant what changed"**

### Architecture

<!-- Figure for tier3 architecture -->
<!-- ```
┌──────────┐     1. Write product     ┌───────────┐
│  Client  │ ───────────────────────► │  FastAPI  │
└──────────┘                          └─────┬─────┘
                                            │
                             2. Normal INSERT/UPDATE/DELETE
                                            │
                                            ▼
                                      ┌──────────┐
                                      │ Postgres │
                                      │   WAL    │ ◄── logical replication slot
                                      └─────┬────┘
                                            │
                             3. Debezium reads WAL changes
                                            ▼
                                 ┌──────────────────────┐
                                 │  Debezium (Connect)  │
                                 └──────────┬───────────┘
                                            │
                             4. Publishes change events
                                            ▼
                                 ┌──────────────────────┐
                                 │      Redpanda         │
                                 │  topic: pgserver.     │
                                 │         public.       │
                                 │         products      │
                                 └──────────┬───────────┘
                                            │
                             5. Consumer reads events
                                            ▼
                                 ┌──────────────────────┐
                                 │   Python Consumer    │
                                 └──────────┬───────────┘
                                            │
                             6. Upsert/delete in Qdrant
                                            ▼
                                      ┌──────────┐
                                      │  Qdrant  │
                                      └──────────┘
``` -->

CDC is architecturally different from the previous two approaches in a fundamental way: **the application code has no awareness of Qdrant**. The FastAPI routes are pure Postgres CRUD — they don't import the Qdrant client, they don't write to an outbox. Sync is handled entirely in the infrastructure layer.

### How It Works

Postgres's Write-Ahead Log (WAL) is a sequential log of every change to the database — it exists for crash recovery and replication. With `wal_level = logical`, external consumers can read this log in a structured format.

Debezium connects to Postgres via a logical replication slot and captures every INSERT, UPDATE, and DELETE on the `products` table as a JSON event. These events are published to a Redpanda topic. A Python consumer service reads from that topic and calls Qdrant.

### Postgres Setup

```sql
-- Enable in postgresql.conf (or docker-compose command args):
-- wal_level = logical

-- Create a publication for the products table
CREATE PUBLICATION products_publication FOR TABLE products;
```

### Debezium Connector Config

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

The `ExtractNewRecordState` transform is important: it unwraps Debezium's envelope format into a flat payload, and adds an `__op` field (`c` = create, `u` = update, `d` = delete) so the consumer doesn't have to parse the raw Debezium schema.

### The Consumer Service

```python
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

### Redpanda vs. Kafka

The demo uses Redpanda as the event bus. Redpanda is Kafka-wire-protocol-compatible but ships as a single binary with no ZooKeeper dependency — dramatically simpler to run in a demo environment. The consumer code is identical whether you point it at Redpanda or a full Apache Kafka cluster; just change `KAFKA_BOOTSTRAP_SERVERS`.

### The Killer Feature: Replaying History

CDC's most underappreciated advantage is replayability. If Qdrant needs to be rebuilt from scratch — new index configuration, migration to a new cluster, disaster recovery — you can do it by replaying the Redpanda topic from the beginning. Every change that ever happened to the products table is recorded in the event stream.

With dual-write (Tier 1) or the outbox (Tier 2), a full rebuild requires running a bulk export from Postgres. With CDC, the event stream *is* the rebuild mechanism.

### Failure Modes

| Failure | Consequence | Mitigation |
|---------|-------------|------------|
| Qdrant is down | Consumer pauses; Redpanda retains events | Consumer retries; resumes from offset on recovery |
| Redpanda is down | Debezium buffers; WAL grows | Monitor WAL size; Redpanda HA with replication in production |
| Debezium crashes | WAL retains changes since last checkpoint | Debezium resumes from replication slot on restart |
| Schema change in Postgres | Connector may need restart | Monitor connector status; test schema migrations in staging |

### The WAL Disk Bloat Problem

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

### Failure Modes

| Failure | Consequence | Mitigation |
|---------|-------------|------------|
| Qdrant is down | Consumer pauses; Redpanda retains events | Consumer retries; resumes from committed offset on recovery |
| Redpanda is down | Debezium buffers; WAL grows | Monitor replication slot lag; Redpanda HA in production |
| Debezium crashes | WAL retains changes since last checkpoint | Debezium resumes from slot on restart |
| Schema change | Connector may need restart | Test migrations in staging; monitor connector status |

### When to Use This

- High write throughput systems where the outbox table would become a bottleneck
- When multiple downstream consumers need to react to changes (not just Qdrant)
- When application code must be fully decoupled from sync concerns
- Teams with existing Redpanda/Kafka infrastructure
- When replay-from-scratch capability is a requirement

Tier 3 is genuinely powerful, but it comes with real operational costs: Redpanda and Debezium to deploy, configure, monitor, and upgrade. If you're not already running streaming infrastructure, think hard before adding it for a single sync use case. Tier 2 handles most production scenarios with far less complexity.

---

## Choosing Your Tier

Here's the decision framework distilled:

```
Do you have < 10K products and low write volume?
└── Yes → Tier 1 (dual-write) is fine to start

Does Qdrant downtime need to be invisible to your write path?
└── Yes → Go to Tier 2

Do you need every sync event guaranteed even across restarts?
└── Yes → Go to Tier 2

Do you already run Kafka/Redpanda infrastructure?
└── Yes → Tier 3 is a natural fit

Do multiple services (not just Qdrant) need to react to product changes?
└── Yes → Tier 3

Do you need to be able to rebuild Qdrant from event history?
└── Yes → Tier 3

Otherwise → Tier 2
```

And the comparison matrix:

| Dimension | Tier 1: Dual-Write | Tier 2: Outbox | Tier 3: CDC |
|-----------|-------------------|----------------|-------------|
| **Sync complexity** | Low | Medium | High |
| **Extra infrastructure** | None | Outbox table + worker | Redpanda + Debezium + consumer |
| **Consistency model** | Best-effort | At-least-once, eventual | At-least-once, eventual |
| **Write latency impact** | Adds Qdrant round-trip | None (async) | None (async) |
| **Qdrant downtime impact** | Generates drift | Events queue in Postgres | Events queue in Redpanda |
| **Captures direct SQL** | No | No | Yes (all WAL changes) |
| **Replay capability** | No | Limited (outbox retention) | Yes (Redpanda retention) |
| **Operational overhead** | Minimal | Low–Medium | High |
| **Best for** | Prototypes, internal tools | Most production apps | High-throughput, multi-consumer |

The important thing: these tiers aren't permanent decisions. Start with Tier 1. When you hit its limits — Qdrant outages generating too much drift, write latency becoming noticeable — move to Tier 2. Only when Tier 2 becomes a bottleneck or you need the replay capability should you invest in Tier 3.

---

## The Universal Safety Net: Reconciliation

Every sync architecture drifts eventually. Qdrant has a brief outage. A deployment goes wrong. A bug produces a partial write. Hardware fails at the wrong moment. No sync mechanism eliminates this entirely — they just reduce the frequency and severity.

The reconciliation script is what catches the residue. It runs the obvious set comparison:

```python
async def reconcile(fix: bool = False) -> ReconcileResult:
    pg_ids = set(await get_all_article_ids_from_postgres())
    qdrant_ids = set(await get_all_point_ids_from_qdrant())

    missing_in_qdrant = pg_ids - qdrant_ids    # need to sync
    orphaned_in_qdrant = qdrant_ids - pg_ids   # need to delete

    if fix:
        for article_id in missing_in_qdrant:
            product = await get_product(article_id)
            await upsert_product(product)

        if orphaned_in_qdrant:
            await qdrant_client.delete(
                collection_name="products",
                points_selector=orphaned_in_qdrant,
            )

    return ReconcileResult(
        postgres_count=len(pg_ids),
        qdrant_count=len(qdrant_ids),
        missing_in_qdrant=len(missing_in_qdrant),
        orphaned_in_qdrant=len(orphaned_in_qdrant),
        in_sync=len(missing_in_qdrant) == 0 and len(orphaned_in_qdrant) == 0,
    )
```

This is intentionally simple. The only inputs are "what's in Postgres" and "what's in Qdrant" — there's no event log to replay, no ordering to worry about. Postgres is the source of truth; Qdrant is a derived read store. When they diverge, Postgres wins.

Run this on a schedule — nightly is usually sufficient — and on-demand via the `/sync/reconcile` endpoint. The `?fix=true` query parameter triggers auto-repair. The report-only mode (default) is useful for monitoring: if you're seeing consistent divergence, that's a signal that your sync mechanism needs attention.

A more sophisticated implementation would also compare `updated_at` timestamps for records that exist in both systems — catching cases where the record exists in Qdrant but has stale data. The set comparison catches the most important class of drift (missing or orphaned records) and is cheap to run even at large scale.

---

## Conclusion

The community consensus is right: start with pgvector. It handles the vast majority of production workloads, eliminates the sync problem entirely, and doesn't require you to operate additional infrastructure. For most applications, the first time you'll seriously consider a dedicated vector store is when you've outgrown pgvector's metadata filtering or need native hybrid search — and by then, you'll have enough data about your actual requirements to make a principled decision.

When you do end up running Postgres alongside Qdrant, the sync problem is real but manageable. The three architectures presented here represent a progression of complexity and capability:

- **Tier 1** is right for prototypes and early-stage products. It's the kind of code you can read and understand in five minutes.
- **Tier 2** is the recommended production default. The outbox pattern is battle-tested, gives you durable delivery semantics, and decouples your write path from Qdrant availability.
- **Tier 3** is for teams with high write throughput, existing streaming infrastructure, or a hard requirement for replay capability.

All three share the same reconciliation safety net. Postgres is always the source of truth. Qdrant is always a derived read store, always rebuildable from Postgres.

The full working code for all three tiers is in the companion repository, along with seed scripts, search endpoints, and reconciliation tooling. Each tier's README has quick-start instructions you can follow in under ten minutes.

Pick the tier that matches your current requirements, not your imagined future scale. You can always graduate.
