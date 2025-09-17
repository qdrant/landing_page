---
title: Security and Strict Mode
weight: 4
---

{{< date >}} Day 7 {{< /date >}}

# Security and Strict Mode

Harden your Qdrant deployment with authentication, authorization, network controls, rate‑limits, and runtime safeguards. This guide covers API keys, RBAC, [JWT](https://jwt.io/) patterns, backups/snapshots, and Strict Mode with practical defaults.

## API Security

- Prefer HTTPS everywhere; never expose plain HTTP publicly
- Enable and rotate API keys; store them in secret managers
- Use scoped keys where possible and separate keys per environment
- Log and audit key usage (failed attempts, geolocation anomalies)

### Example: Loading Secrets Safely
```python
import os
from qdrant_client import QdrantClient

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
)
```

## Role‑Based Access Control (RBAC)

- Grant the least privilege necessary (read‑only keys for analytics, write for ingestion)
- Separate duties: ingestion, query, operations/DevOps
- Prefer collection‑scoped permissions in multi‑team environments

## Multi‑Tenancy (Overview)

- Use JWT to carry `tenant_id` and roles; validate token on every request
- Filter queries by `tenant_id` and isolate write paths
- For very large tenants, consider shard or collection isolation

See Day 6: Multi‑Tenancy with JWT for full patterns.

## Network and Deployment Controls

- Restrict access via IP allow‑lists, private networking/VPC peering
- Place Qdrant behind an authenticated API gateway or service mesh
- Enforce timeouts and connection limits at the ingress layer

## Backups and Snapshots

- Automate scheduled snapshots; verify restores regularly
- Store backups cross‑region or in a different failure domain
- Version schemas and configuration alongside application code

### Snapshot Scripting (Concept)
```bash
# Pseudocode: trigger snapshot and copy to durable storage
curl -X POST "$QDRANT_URL/snapshots" -H "api-key: $QDRANT_API_KEY"
# download snapshot and upload to object storage
```

## Strict Mode (Deep‑Dive)

Strict Mode protects clusters from unbounded operations and misconfiguration.

| Parameter                      | Purpose                                           | Recommended in Prod |
|--------------------------------|---------------------------------------------------|---------------------|
| `enabled`                      | Activate enforcement                              | true                |
| `max_query_limit`              | Cap the number of returned points                 | 5k–20k              |
| `max_timeout`                  | Cap per‑request duration                          | 15–60s              |
| `unindexed_filtering_retrieve` | Allow filters on unindexed fields                 | false               |
| `search_max_hnsw_ef`           | Cap HNSW ef during search                         | 500–2000            |
| `search_allow_exact`           | Permit brute‑force scan without index             | false               |
| `read_rate_limit`              | Max reads/min per replica                         | per SLO             |
| `write_rate_limit`             | Max writes/min per replica                        | per SLO             |

### Example Configuration
```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://cluster.example:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
    strict_mode_config=models.StrictModeConfigDiff(
        enabled=True,
        max_query_limit=10000,
        max_timeout=30,
        unindexed_filtering_retrieve=False,
        search_max_hnsw_ef=1000,
        search_allow_exact=False,
        read_rate_limit=1000,
        write_rate_limit=500,
    ),
)
```

## Security Checklist

- [ ] HTTPS enforced; no public plain HTTP
- [ ] API keys rotated; stored in secret manager
- [ ] Least‑privilege RBAC; environment‑scoped credentials
- [ ] JWT validated per request; tenant filters enforced
- [ ] IP allow‑lists / private networking in place
- [ ] Strict Mode enabled with sensible caps
- [ ] Snapshots scheduled and restore tested
- [ ] Logs/metrics/alerts for auth failures and rate‑limit hits

Read More:
- Docs: Authentication, RBAC, and Security Best Practices
- Strict Mode: Runtime safeguards
- Backups/Snapshots: Disaster recovery 