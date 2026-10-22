---
title: Migration Tool
short_description: "Move vectors, payloads, and sparse embeddings into Qdrant from other vector databases with the Qdrant Migration Tool."
description: "Use the Qdrant Migration Tool to stream vectors, payloads, and sparse embeddings from external vector databases into Qdrant with batched, resumable transfers."
weight: 200
aliases:
  - /documentation/tutorials-operations/migration/
  - /documentation/database-tutorials/migration/
is_empty: false
partition: ecosystem
---

# Migrate to Qdrant

The [Qdrant Migration Tool](https://github.com/qdrant/migration) is a CLI that moves your vectors, metadata, and sparse embeddings from other vector databases into Qdrant. It streams data in batches and can resume interrupted migrations.

## Installation

The tool is distributed as a container image and as a standalone binary.

### Container Image

The container image runs with Docker, Podman, or any similar container runtime. It supports every source, and the examples in this documentation use it.

```bash
docker pull registry.cloud.qdrant.io/library/qdrant-migration
```

### Binary

On macOS and Linux, install the binary with [Homebrew](https://brew.sh):

```bash
brew install qdrant/tap/qdrant-migration
```

Alternatively, download the archive for your operating system and CPU architecture from [GitHub Releases](https://github.com/qdrant/migration/releases), extract it, and place the `qdrant-migration` binary in a directory on your `PATH`.

To run an example from this documentation with the binary, replace `docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration`, along with any `-e` or `-v` options, with `qdrant-migration`.

## Migration Tool or Snapshots

Qdrant [snapshots](/documentation/snapshots/) are low-level disk operations built for same-cluster recovery and local backups. They require snapshot consistency across nodes and can be hard to port across machines or cloud zones. The Migration Tool:

- Streams data in live batches.
- Resumes interrupted migrations.
- Works while data is still being inserted.
- Supports collection reconfiguration, such as changing replication settings or quantization.
- Reads from other vector databases, not only from Qdrant.

To choose between the two, see [Migration and Recovery Options](/documentation/migration-recovery-options/).

## Supported Sources

| Source | CLI Subcommand | Auto-Creates Collection? |
| :--- | :--- | :--- |
| [Pinecone](/documentation/migrate-to-qdrant/from-pinecone/) | `pinecone` | Yes |
| [Weaviate](/documentation/migrate-to-qdrant/from-weaviate/) | `weaviate` | No (must pre-create) |
| [Milvus](/documentation/migrate-to-qdrant/from-milvus/) | `milvus` | Yes |
| [Elasticsearch](/documentation/migrate-to-qdrant/from-elasticsearch/) | `elasticsearch` | Yes |
| [OpenSearch](/documentation/migrate-to-qdrant/from-opensearch/) | `opensearch` | Yes |
| [Azure AI Search](/documentation/migrate-to-qdrant/from-azure-search/) | `azure` | Yes |
| [pgvector](/documentation/migrate-to-qdrant/from-pgvector/) | `pg` | Yes |
| [S3 Vectors](/documentation/migrate-to-qdrant/from-s3-vectors/) | `s3` | Yes |
| [Amazon DynamoDB](/documentation/migrate-to-qdrant/from-dynamodb/) | `dynamodb` | Yes |
| [Turbopuffer](/documentation/migrate-to-qdrant/from-turbopuffer/) | `turbopuffer` | Yes |
| [Chroma](/documentation/migrate-to-qdrant/from-chroma/) | `chroma` | Yes |
| [Redis](/documentation/migrate-to-qdrant/from-redis/) | `redis` | No (must pre-create) |
| [MongoDB](/documentation/migrate-to-qdrant/from-mongodb/) | `mongodb` | No (must pre-create) |
| [FAISS](/documentation/migrate-to-qdrant/from-faiss/) | `faiss` | Yes |
| [Apache Solr](/documentation/migrate-to-qdrant/from-solr/) | `solr` | No (must pre-create) |
| [Qdrant](/documentation/migrate-to-qdrant/from-qdrant/) | `qdrant` | Yes |

Not seeing your current vector store? [Open an issue on GitHub](https://github.com/qdrant/migration/issues) and let us know!

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
| `--migration.offsets-collection` | `_migration_offsets` | Collection used to track migration progress |
| `--debug` / `--trace` | — | Verbose logging |
| `--skip-tls-verification` | false | Skip TLS certificate verification |

<aside role="status"><code>--migration.num-workers</code> is only available for the <code>pg</code> and <code>qdrant</code> subcommands.</aside>

## After Migration

Once your data is in Qdrant, verify that everything arrived correctly:

- **[Migration Verification Guide](/documentation/migration-guidance/)** — a structured framework covering data integrity checks and search quality validation.
- **[Keeping Postgres in Sync](/documentation/data-synchronization/)** — if you're running Postgres alongside Qdrant, learn how to keep them in sync.
