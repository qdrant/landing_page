---
title: Multi‑Tenancy with JWT
weight: 3
---

{{< date >}} Day 6 {{< /date >}}

# Multi‑Tenancy with JWT

Multi‑tenancy is not a feature you toggle; it is a pattern you design. In Qdrant, the core idea is simple: every request carries a tenant identity, and every operation enforces that identity both at write and at read. JWT provides the identity; Qdrant provides the enforcement primitives—filters, collections, and (in clusters) shard placement and consistency controls.

---

## What “tenant isolation” means here

Isolation lives in three places at once:

- In the token: the JWT holds claims like `tenant_id`, roles, and scopes, signed by your issuer.
- In the data: each point carries the tenant in its payload so filters can enforce boundaries.
- In the topology: very large tenants can be split into dedicated collections or shards.

Start with soft boundaries (payload filtering) and evolve to hard boundaries (collections or shards) as scale and SLOs demand.

---

## Designing the token

Tokens are contracts. Define the fields you will actually use for enforcement and auditing. A minimal set looks like this:

```json
{
  "iss": "https://auth.example.com",
  "aud": "qdrant-api",
  "exp": 1735689600,
  "sub": "user_123",
  "tenant_id": "acme",
  "roles": ["tenant:reader"],
  "scopes": ["collections:read", "points:search"]
}
```

- `tenant_id` identifies the tenant. Choose a stable, opaque value.
- `roles` express coarse capabilities used by your gateway or middleware.
- `scopes` are fine‑grained and map to API surfaces.

Validate the token on every request: signature (kid → JWK), expiry, issuer, and audience. Prefer short‑lived access tokens and rotate signing keys.

---

## Writing with the tenant baked in

On writes, attach the tenant to the payload so that reads can be filtered without guessing. This is the cornerstone that keeps boundaries explicit and auditable.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

TENANT = "acme"

points = [
    models.PointStruct(
        id=1,
        vector=[...],
        payload={
            "tenant_id": TENANT,
            "title": "...",
            "tags": ["..."],
        },
    ),
]

client.upsert(
    collection_name="docs",
    points=points,
)
```

If you expose write APIs directly to clients, validate that the `tenant_id` in the token matches the `tenant_id` in the payload or set it server‑side. Never trust client‑supplied tenant identifiers without verification.

---

## Reading with guaranteed boundaries

Every read should carry a must‑match filter on `tenant_id`. This makes the boundary explicit and keeps queries fast by leveraging filterable indexes.

```python
from qdrant_client import models

query = [ ... ]  # your query vector

flt = models.Filter(
    must=[
        models.FieldCondition(
            key="tenant_id",
            match=models.MatchValue(value=TENANT),
        )
    ]
)

client.search(
    collection_name="docs",
    query_vector=query,
    limit=10,
    query_filter=flt,
)
```

Apply the same filter for recommendations, scrolls, and grouped lookups. Treat it as non‑optional plumbing, not application code.

---

## Collections, shards, and big tenants

For most deployments, one collection per domain with tenant filters is enough. As a tenant grows, consider a stronger boundary:

- Separate collection per large tenant when you want independent lifecycle and quota enforcement.
- Custom sharding by `tenant_id` when you want data locality and parallelism without multiplying collections.

Custom sharding keeps all of a tenant’s data together on fewer shards, improving cache locality and reducing cross‑shard fan‑out. Collections give you hard isolation and per‑tenant settings at the cost of more objects to manage.

See {{< relref "sharding-strategies.md" >}} for distribution details.

---

## Authorization flow that won’t surprise you

Place an API gateway or middleware in front of Qdrant. It does three things consistently:

1) Verifies JWTs (JWKs, expiry, issuer, audience) and rejects on failure.
2) Extracts `tenant_id`, roles, and scopes and attaches them to the downstream context.
3) Enforces coarse RBAC at the edge (for example, read‑only tokens cannot upsert).

Your application layer then builds Qdrant requests with the mandatory tenant filter and the minimum required parameters. This split keeps the database API simple and the security envelope consistent.

---

## Pagination, grouping, and joins (without leaks)

The same tenant filter applies to scroll and to grouped lookups. For example, when using grouped search or lookups by foreign keys in payload, include the filter in both the primary search and the follow‑up lookup. A miss on either side can leak other tenants’ metadata in edge responses even if vectors are filtered correctly.

---

## Testing your isolation

Multi‑tenancy fails in the gaps. Add tests that:

- Assert every search path includes a must‑match `tenant_id` filter.
- Generate data for two tenants, then prove that cross‑tenant queries return zero results under all APIs you use (search, recommend, batch, scroll, grouped lookups).
- Exercise expired and forged tokens; verify they are rejected by the gateway.

For performance, measure the impact of the tenant filter. If filtering dominates, enable Filterable HNSW and tune `payload_m` to retain recall under heavy predicates.

---

## Operational checklist

- Short‑lived tokens; rotate signing keys; pin issuer and audience.
- Mandatory tenant filter in all reads; server‑side enforcement for writes.
- Keep secrets out of code; never accept raw JWTs over HTTP.
- Enable snapshots and test restores; tenants care about RPO/RTO.
- Audit logs for auth failures and rate‑limit hits; add per‑tenant dashboards for usage.

---

## Example policy shapes

- Reader token: `scopes=[collections:read, points:search]`, enforced with tenant filter. Cannot upsert or delete.
- Writer token: `scopes=[points:upsert, points:delete]`, validated server‑side to set the correct `tenant_id`.
- Operator token: limited to management APIs (create collection, snapshots), never used in application paths.

---

## Takeaways

Give every request a tenant identity (JWT), give every point a tenant label (payload), and make the filter non‑negotiable. Start with one collection plus filters. Move to custom sharding or per‑tenant collections only when the data size or SLOs demand it. Keep the security envelope at the edge, and let Qdrant do what it does best: fast, filtered vector search within clear boundaries.

Read More: [Distributed Deployment](https://qdrant.tech/documentation/guides/distributed_deployment/) • See also: Day 7 Security and Strict Mode (rate limits, caps, and safeguards). 