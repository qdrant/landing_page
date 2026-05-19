---
title: From Qdrant
short_description: "Copy collections between Qdrant instances or within one cluster, preserving vector config, indexes, and quantization."
description: "Replicate collections between Qdrant instances or within the same cluster, automatically recreating vector config, HNSW settings, quantization, and sharding."
weight: 110
---

# Migrate Between Qdrant Instances

Use the `qdrant` subcommand to copy a collection from one Qdrant instance to another — or between collections within the same instance. The tool automatically recreates the full collection schema (vector config, HNSW settings, quantization, sharding) on the target.

## What You Need

- **Source Qdrant URL** — gRPC endpoint of the source instance
- **Target Qdrant URL** — gRPC endpoint of the target instance
- **Source collection name**
- **Target collection name** (must be different from source if using the same instance)
- **API keys** — for each instance, if authentication is enabled

## Concept Mapping

| Source Qdrant | Target Qdrant | Notes |
| :--- | :--- | :--- |
| Collection | Collection | Recreated with exact schema |
| Named vectors | Named vectors | All vector types preserved |
| Sparse vectors | Sparse vectors | Direct mapping |
| Payload | Payload | Direct mapping |
| Payload indexes | Payload indexes | Recreated if `--target.ensure-payload-indexes` is `true` |
| Shard keys | Shard keys | Recreated automatically |

## Run the Migration

### Between Two Instances

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'http://source-instance:6334' \
    --source.api-key 'source-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-instance.cloud.qdrant.io:6334' \
    --target.api-key 'your-qdrant-api-key' \
    --target.collection 'your-collection'
```

### Within the Same Instance

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'http://localhost:6334' \
    --source.collection 'original-collection' \
    --target.url 'http://localhost:6334' \
    --target.collection 'new-collection'
```

### With Parallel Workers

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'http://source-instance:6334' \
    --source.api-key 'source-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-instance.cloud.qdrant.io:6334' \
    --target.api-key 'your-qdrant-api-key' \
    --target.collection 'your-collection' \
    --migration.num-workers 4
```

### All Source Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--source.collection` | Yes | Source collection name |
| `--source.url` | No | Source gRPC URL (default: `http://localhost:6334`) |
| `--source.api-key` | No | API key for the source instance |
| `--source.max-message-size` | No | Maximum gRPC message size in bytes (default: `33554432` = 32 MB) |

### All Target Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--target.collection` | Yes | Target collection name |
| `--target.url` | No | Target gRPC URL (default: `http://localhost:6334`) |
| `--target.api-key` | No | API key for the target instance |
| `--target.ensure-payload-indexes` | No | Recreate payload indexes from source (default: `true`) |

### Parallel Worker Option

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--migration.num-workers` | Number of CPU cores | Number of parallel workers for migration |

## Gotchas

- **Source and target must differ:** You cannot migrate a collection to itself.
- **Parallel workers and resume:** Migration progress is tracked per worker. If you change `--migration.num-workers` between runs, the saved offsets are invalidated and the migration restarts from scratch. Use `--migration.restart` explicitly if you intentionally want to change the worker count.
- **Large messages:** If you encounter gRPC message size errors, increase `--source.max-message-size`.
- **Existing target collection:** If the target collection already exists, the tool uses it as-is without modifying the schema.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
