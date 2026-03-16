---
title: "Tier 2: Transactional Outbox"
weight: 30
---

# Tier 2: Transactional Outbox Pattern

> "Never lose a sync event"

## Architecture

Instead of writing to Qdrant directly from the request handler, we write an *event* into a `sync_outbox` table in the **same Postgres transaction** as the product write. A background worker picks up these events and syncs them to Qdrant asynchronously.

The outbox event exists if and only if the product write succeeded. There's no window between the two — they commit atomically.

## The Outbox Table

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

## The Write Path

Every CRUD endpoint opens a single Postgres transaction that writes both the product and the outbox event:

```py
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

## The Worker

A background async task processes outbox events in batches. The critical concurrency primitive is `FOR UPDATE SKIP LOCKED` — it lets multiple workers claim events safely without stepping on each other:

```py
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

## Two Worker Modes

The implementation supports two delivery strategies:

**Polling** (default): the worker wakes up every N seconds, checks for pending events, and processes them. Simple, robust, and doesn't require a persistent database connection.

**LISTEN/NOTIFY**: a Postgres trigger fires `NOTIFY sync_outbox_insert` when a new row is inserted. The worker wakes up immediately, giving near-real-time sync without busy-polling:

```py
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

## Failure Modes

| Failure | Consequence | Mitigation |
| :---- | :---- | :---- |
| Qdrant is down | Events queue in `sync_outbox` | Worker retries with backoff on recovery |
| Worker crashes | Events remain `pending` | Worker picks up on restart; `SKIP LOCKED` prevents double-processing |
| Duplicate processing | Same event processed twice | Qdrant upserts are idempotent by point ID |
| Outbox table grows large | Storage/performance impact | Prune `completed` events older than N days |

## What This Approach Gets Right

The write path is completely decoupled from Qdrant. If Qdrant is down for an hour, writes succeed normally and events queue up. When Qdrant comes back, the worker drains the queue. The application never blocks on Qdrant.

The delivery semantics are clear and enforceable: at-least-once, durable in Postgres, retried until success or `max_attempts`. Failed events are visible in the database and inspectable with SQL.

You also get a natural sync status endpoint:

```py
@router.get("/sync/status")
async def sync_status():
    return await get_sync_status()
# → {"pending": 0, "failed": 0, "avg_lag_seconds": 1.2}
```

## The Trade-off

You have eventual consistency. There's a window — typically milliseconds to seconds — between when a product is written to Postgres and when it appears in Qdrant search results. For most applications this is perfectly acceptable. For applications where writes must be immediately searchable, this requires a different approach.

You also have a new table to manage: the outbox table grows over time and needs periodic cleanup of completed events.

## When to Use This

- **Most production applications** with moderate write throughput
- When Qdrant availability shouldn't impact your write path
- When you can tolerate seconds of sync lag
- **The recommended default for the majority of production Postgres + Qdrant deployments**

---

**Next:** [Tier 3: Change Data Capture](/documentation/data-synchronization/change-data-capture/) — infrastructure-level sync for high-throughput systems.
