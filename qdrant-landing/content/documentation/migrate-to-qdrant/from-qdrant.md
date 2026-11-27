---
title: From Qdrant
short_description: "Copy collections between Qdrant instances or within one cluster, preserving vector config, indexes, and quantization."
description: "Replicate collections between Qdrant instances or within the same cluster, automatically recreating vector config, HNSW settings, quantization, and sharding."
weight: 110
---

# Migrate Between Qdrant Instances

Use the `qdrant` subcommand to copy a collection from one Qdrant instance to another or copy data between collections within the same instance.

If the target collection does not exist, the tool automatically creates it using the source collection's configuration (vector config, HNSW settings, quantization, sharding). To change the target collection's configuration, create the target collection manually before running the migration.

The source and the target can each be a dedicated cluster or a Qdrant Serverless space. To move a collection from a dedicated cluster to Serverless, see [Migrate to Serverless](/documentation/serverless/migrate/).

## What You Need

- **Source Qdrant URL** — gRPC endpoint of the source instance
- **Target Qdrant URL** — gRPC endpoint of the target instance
- **Source collection name**
- **Target collection name** (must be different from source if using the same instance)
- **API keys** — for each instance, if authentication is enabled

<aside role="alert">
  The target cluster needs <strong>twice the RAM and disk</strong> of the source collection during migration. Qdrant keeps original segments alongside newly built ones during optimization. You can scale back down once the migration completes.
</aside>

## Concept Mapping

| Source Qdrant | Target Qdrant | Notes |
| :--- | :--- | :--- |
| Collection | Collection | Recreated with exact schema |
| Named vectors | Named vectors | All vector types preserved |
| Sparse vectors | Sparse vectors | Direct mapping |
| Payload | Payload | Direct mapping |
| Payload indexes | Payload indexes | Recreated if `--target.ensure-payload-indexes` is `true` |
| Shard keys | Shard keys | Recreated automatically unless a target shard-key option overrides them |

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

### Migrate Part of a Collection

Use `--source.filter` to migrate only the source points that match a [filter](/documentation/search/filtering/). The filter uses the JSON format of the REST API. For example, to copy the points of one tenant into its own collection:

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'http://source-instance:6334' \
    --source.api-key 'source-api-key' \
    --source.collection 'your-collection' \
    --source.filter '{"must": [{"key": "group_id", "match": {"value": "acme"}}]}' \
    --target.url 'https://your-instance.cloud.qdrant.io:6334' \
    --target.api-key 'your-qdrant-api-key' \
    --target.collection 'tenant-acme'
```

To read the filter from a JSON file, use `--source.filter-file` instead. With Docker, mount the file into the container.

### Split a Collection by a Payload Field

Put a `{field}` placeholder in `--target.collection` to write each point to the collection for its value of that payload field:

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'http://source-instance:6334' \
    --source.api-key 'source-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-instance.cloud.qdrant.io:6334' \
    --target.api-key 'your-qdrant-api-key' \
    --target.collection 'tenant-{group_id}'
```

A point with `"group_id": "acme"` goes to the `tenant-acme` collection. The tool creates each collection with the configuration of the source collection when the first point for it arrives. The field must be a top-level payload field with a non-empty string or an integer value. `--target.collection` can contain only one placeholder.

After a split, the tool doesn't compare the point counts of the source and target collections, because there is no single target collection to compare.

### All Source Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--source.collection` | Yes | Source collection name |
| `--source.url` | No | Source gRPC URL (default: `http://localhost:6334`) |
| `--source.api-key` | No | API key for the source instance |
| `--source.max-message-size` | No | Maximum gRPC message size in bytes (default: `33554432` = 32 MB) |
| `--source.filter` | No | Migrate only the points that match this filter, in the JSON format of the REST API |
| `--source.filter-file` | No | Path to a JSON file with the filter, instead of `--source.filter` |
| `--source.serverless` | No | Read from a Qdrant Serverless space (default: `false`). The batch size can be at most 1000. |

### All Target Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--target.collection` | Yes | Target collection name. Use a `{field}` placeholder to [split the collection](#split-a-collection-by-a-payload-field) by a payload field. |
| `--target.url` | No | Target gRPC URL (default: `http://localhost:6334`) |
| `--target.api-key` | No | API key for the target instance |
| `--target.serverless` | No | Write to a Qdrant Serverless space (default: `false`) |
| `--target.ensure-payload-indexes` | No | Recreate payload indexes from source (default: `true`) |
| `--target.shard-key` | No | Fixed keyword shard key for every target upsert |
| `--target.shard-key-field` | No | Payload field that supplies the target shard key for each point |

### Parallel Worker Option

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--migration.num-workers` | Number of CPU cores | Number of parallel workers for migration |

## Gotchas

- **Parallel workers and resume:** Changing `--migration.num-workers` between runs starts the migration over instead of resuming it.
- **Large messages:** If you encounter gRPC message size errors, increase `--source.max-message-size`.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
