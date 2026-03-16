---
title: "Tier 1: Dual-Writes"
weight: 20
---

# Tier 1: Application-Level Dual-Write

> "Just do it in your app code"

## Architecture

Every CRUD endpoint writes to Postgres first, then to Qdrant, in the same request handler. If the Qdrant write fails, the error is logged but the request succeeds — Postgres is the source of truth, and a reconciliation job can fix drift later.

## The Code

The route handler is exactly what you'd expect: one write after the other, with error handling around the Qdrant call:

```py
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

## Failure Modes

| Failure | Consequence | Mitigation |
| :---- | :---- | :---- |
| Qdrant is down | Postgres write succeeds; Qdrant write silently skipped | Logged; `reconcile` fixes drift |
| Qdrant is slow | Request latency spikes (blocks on Qdrant call) | Client has configurable timeout |
| Postgres fails after Qdrant write | Orphaned point in Qdrant | Write Postgres first; `reconcile --fix` cleans up |
| Network partition | Partial writes | Reconciliation script |

## What This Approach Gets Right

The strongest argument for dual-write isn't correctness — it's cognitive simplicity. A new engineer can read this code and immediately understand the entire sync story. There are no background workers, no queues, no separate processes. The request handler is the sync mechanism.

This simplicity has real value for prototypes, internal tools, and early-stage products where iteration speed matters more than operational rigor.

## Where It Falls Apart

The write path is coupled to Qdrant availability. If Qdrant has a hiccup — even a brief one — you're generating drift that has to be cleaned up later. There's no guarantee that every write will reach Qdrant; you're relying on reconciliation to eventually make things right.

More subtly: the request latency includes the Qdrant round-trip. For write-heavy workloads, this becomes a bottleneck.

## When to Use This

- Prototypes and MVPs
- Internal tools where occasional inconsistency is tolerable
- Low write throughput (< 10K products, < a few hundred writes/day)
- Teams that want to ship fast and revisit operational concerns later

## The Universal Safety Net: Reconciliation

Every sync architecture drifts eventually. The reconciliation script is what catches the residue:

```py
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

Postgres is the source of truth; Qdrant is a derived read store. When they diverge, Postgres wins. Run this on a schedule — nightly is usually sufficient — and on-demand when you suspect drift.

---

**Next:** [Tier 2: Transactional Outbox](/documentation/data-synchronization/transactional-outbox/) — decouple Qdrant from your write path.
