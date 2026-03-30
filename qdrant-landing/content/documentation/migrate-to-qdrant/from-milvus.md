---
title: From Milvus
weight: 15
partition: ecosystem
---

# Migrate from Milvus to Qdrant

## What You Need from Milvus

- **Milvus URL** — the gRPC endpoint of your Milvus instance
- **Collection name** — the collection to migrate
- **API key** — if using Zilliz Cloud or authenticated Milvus

## Concept Mapping

| Milvus | Qdrant | Notes |
| :--- | :--- | :--- |
| Collection | Collection | One-to-one mapping |
| Partition | Payload field or separate collection | Use `--milvus.partitions` to specify which partitions to migrate |
| Schema fields | Payload | Non-vector fields become payload |
| `COSINE` | `Cosine` | Direct mapping |
| `L2` | `Euclid` | Direct mapping |
| `IP` (inner product) | `Dot` | Direct mapping |
| Dynamic fields | Payload | JSON-typed dynamic fields are preserved |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration milvus \
    --milvus.url 'your-milvus-host:19530' \
    --milvus.collection 'your-collection' \
    --milvus.api-key 'your-milvus-api-key' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### Migrating Specific Partitions

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration milvus \
    --milvus.url 'your-milvus-host:19530' \
    --milvus.collection 'your-collection' \
    --milvus.partitions 'partition_a,partition_b' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Milvus-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--milvus.url` | Yes | Milvus gRPC endpoint |
| `--milvus.collection` | Yes | Collection name to migrate |
| `--milvus.api-key` | No | API key (for Zilliz Cloud) |
| `--milvus.username` | No | Username for authentication |
| `--milvus.password` | No | Password for authentication |
| `--milvus.db-name` | No | Database name |
| `--milvus.partitions` | No | Comma-separated partition names |
| `--milvus.server-version` | No | Override detected server version |
| `--milvus.enable-tls-auth` | No | Enable TLS authentication |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.distance-metric` | — | Distance metric per vector field (map format, e.g., `field1:cosine,field2:dot`) |

## Gotchas

- **Partition handling:** Milvus partitions can map to Qdrant collections or payload filters. If you merge partitions into a single collection, add a partition name as a payload field for filtering.
- **Schema strictness:** Milvus enforces schema on write; Qdrant is schema-flexible. Verify that the schema-less flexibility didn't cause payload fields to drift during migration.
- **Dynamic fields:** Milvus dynamic fields (introduced in 2.3) may serialize differently. Check that JSON-typed dynamic fields survived the migration with correct structure.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
