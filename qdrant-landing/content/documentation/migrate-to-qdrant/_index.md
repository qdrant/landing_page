---
title: Migration Tool
weight: 31
is_empty: false
partition: build
---

# Migrate to Qdrant

The [Qdrant Migration Tool](https://github.com/qdrant/migration) is a CLI that moves your vectors, metadata, and sparse embeddings from other vector databases into Qdrant. It runs as a Docker container, streams data in batches, and can resume interrupted migrations.

```bash
docker pull registry.cloud.qdrant.io/library/qdrant-migration
```

## Supported Sources

| Source | CLI Subcommand | Auto-Creates Collection? |
| :--- | :--- | :--- |
| [Pinecone](/documentation/migrate-to-qdrant/from-pinecone/) | `pinecone` | Yes |
| [Weaviate](/documentation/migrate-to-qdrant/from-weaviate/) | `weaviate` | No (must pre-create) |
| [Milvus](/documentation/migrate-to-qdrant/from-milvus/) | `milvus` | Yes |
| [Elasticsearch](/documentation/migrate-to-qdrant/from-elasticsearch/) | `elasticsearch` | Yes |
| [pgvector](/documentation/migrate-to-qdrant/from-pgvector/) | `pg` | Yes |

The tool also supports Chroma, Redis, MongoDB, OpenSearch, S3 Vectors, FAISS, Apache Solr, and [Qdrant-to-Qdrant](/documentation/tutorials-operations/migration/) migrations.

## General Advice

1. **Run the tool close to your databases.** Direct connectivity between source and target is not required — the tool streams through the machine it runs on. For best performance, use a machine with low latency to both.

2. **Use `--net=host` for local instances.** If either database runs on the host machine, the container needs host networking to reach `localhost`.

3. **The tool resumes by default.** Migration progress is tracked in a `_migration_offsets` collection in Qdrant. If a migration is interrupted, re-running the same command picks up where it left off. Use `--migration.restart` to force a fresh start.

4. **Batch size is tunable.** The default batch size is 50. For large migrations, increase it with `--migration.batch-size` (e.g., 256 or 512) to improve throughput.

## Universal CLI Options

These flags apply to all source types:

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--migration.batch-size` | 50 | Points per upsert batch |
| `--migration.restart` | false | Ignore saved progress, start fresh |
| `--migration.create-collection` | true | Auto-create target collection |
| `--migration.batch-delay` | 0 | Milliseconds between batches |
| `--migration.num-workers` | CPU cores | Parallel workers |
| `--debug` / `--trace` | — | Verbose logging |

## After Migration

Once your data is in Qdrant, verify that everything arrived correctly:

- **[Migration Verification Guide](/documentation/migration-verification/)** — a structured framework covering data integrity checks and search quality validation.
- **[Keeping Postgres in Sync](/documentation/data-synchronization/)** — if you're running Postgres alongside Qdrant, learn how to keep them in sync.
