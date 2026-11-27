---
title: Migrate to Serverless
short_description: "Copy collections from a dedicated Qdrant cluster into a Qdrant Serverless space with the Qdrant Migration Tool."
description: "Migrate collections from a dedicated Qdrant cluster to Qdrant Serverless with the Qdrant Migration Tool, including how the target collection is configured and how to split multitenant collections into one collection per tenant."
weight: 80
---

# Migrate to Serverless

To migrate from a dedicated cluster to Serverless, use the [Qdrant Migration Tool](/documentation/migrate-to-qdrant/). The Migration Tool reads the points of a collection from the cluster and writes them to a collection in a Serverless space.

## What You Need

- The gRPC URL of the cluster and a cluster API key
- The endpoint URL of the space and an API key that can manage collections. See [Secure a Space](/documentation/serverless/security/).
- Docker, or any similar container runtime. To run the Migration Tool without a container, install the [binary](/documentation/migrate-to-qdrant/#binary).

## Before You Migrate

Serverless enforces stricter limits than a dedicated cluster, so check that each collection fits within the [Quotas and Limits](/documentation/serverless/quotas-and-limits/) of a space before you migrate it.

Some cluster features have no Serverless equivalent. For example, you can't change a collection after you create it, and there are no shard keys. See [Limitations and Differences](/documentation/serverless/#limitations-and-differences).

## Collection Configuration

The Migration Tool can create the target collection for you, or copy the points into a collection you created yourself.

### Default Configuration

If the target collection doesn't exist, the Migration Tool creates it from the configuration of the source collection. The following table shows the settings that are applied by default:

| Cluster Collection | Serverless Collection | Notes |
| :--- | :--- | :--- |
| Dense vectors | Dense vectors | Size, distance, and multivector setting are kept |
| Sparse vectors | Sparse vectors | The IDF modifier is kept |
| Payload | Payload | Copied as is |
| Payload indexes | Payload indexes | Created with the collection if `--target.ensure-payload-indexes` is `true`. A text index without a tokenizer gets the `Word` tokenizer, the cluster default. |
| HNSW and quantization settings | Precision tier | Not carried over. Every vector gets the default `High` precision tier. |
| Shards, replicas, and shard keys | None | Not carried over |
| WAL and optimizer settings | None | Not carried over |

If Serverless rejects the payload indexes of a new collection, for example because the source collection has more indexes than Serverless allows, rerun the migration with `--target.ensure-payload-indexes=false`. The Migration Tool then creates the collection without payload indexes. To keep the indexes you need, create the collection yourself instead.

### Custom Configuration

To pick a precision tier for each vector, or to choose a different set of payload indexes, [create the collection](/documentation/serverless/collections/) in the space before you run the migration. The Migration Tool then copies only the points.

Serverless only allows creating payload indexes when creating a collection. If the target collection lacks a payload index that the source collection has, the Migration Tool prints a warning and continues without it.

## Run the Migration

Set `--target.url` to the endpoint of the space and add `--target.serverless`:

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'https://your-cluster.cloud.qdrant.io:6334' \
    --source.api-key 'your-cluster-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-space-endpoint' \
    --target.api-key 'your-space-api-key' \
    --target.collection 'your-collection' \
    --target.serverless
```

With `--target.serverless`, the Migration Tool connects to the space over TLS on port 443, whatever scheme and port the URL has.

These flags matter most for a migration to Serverless:

| Flag | Description |
| :--- | :--- |
| `--target.url` | Endpoint URL of the space |
| `--target.api-key` | API key for the space |
| `--target.collection` | Target collection name. Use a `{field}` placeholder to [split the collection](#migrate-multitenant-collections) by a payload field. |
| `--target.serverless` | Write to a Serverless space |
| `--target.ensure-payload-indexes` | Create the payload indexes of the source collection (default: `true`) |
| `--source.filter` | Migrate only the points that match a [filter](/documentation/search/filtering/), in the JSON format of the REST API |

`--target.shard-key` and `--target.shard-key-field` don't work with a Serverless target. For all other flags, see [Migrate Between Qdrant Instances](/documentation/migrate-to-qdrant/from-qdrant/).

While the migration runs, the Migration Tool stores its progress in a collection named `_migration_offsets` in the space, so it can resume an interrupted migration. It deletes this collection when the migration completes. To use a different name, set `--migration.offsets-collection`.

## Migrate Multitenant Collections

On Serverless, [each tenant gets its own collection](/documentation/serverless/collections/#multitenancy-one-collection-per-tenant). To split a multitenant collection, put a `{field}` placeholder in `--target.collection`. The Migration Tool writes each point to the collection for its value of that payload field and creates each collection when the first point for it arrives. The field must be a top-level payload field with a non-empty string or an integer value.

How you apply this depends on how the cluster collection implements [multitenancy](/documentation/manage-data/multitenancy/).

### Partition by Payload

With [partition by payload](/documentation/manage-data/multitenancy/#partition-by-payload), each point has a payload field that identifies its tenant. Split the collection by that field:

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'https://your-cluster.cloud.qdrant.io:6334' \
    --source.api-key 'your-cluster-api-key' \
    --source.collection 'your-collection' \
    --target.url 'https://your-space-endpoint' \
    --target.api-key 'your-space-api-key' \
    --target.collection 'tenant-{group_id}' \
    --target.serverless
```

A point with `"group_id": "acme"` goes to the `tenant-acme` collection.

To migrate a single tenant, filter the source collection by the tenant field and use a fixed target collection name:

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration qdrant \
    --source.url 'https://your-cluster.cloud.qdrant.io:6334' \
    --source.api-key 'your-cluster-api-key' \
    --source.collection 'your-collection' \
    --source.filter '{"must": [{"key": "group_id", "match": {"value": "acme"}}]}' \
    --target.url 'https://your-space-endpoint' \
    --target.api-key 'your-space-api-key' \
    --target.collection 'tenant-acme' \
    --target.serverless
```

### User-Defined Sharding

With [user-defined sharding](/documentation/manage-data/multitenancy/#user-defined-sharding), each tenant has its own shard. Serverless has no shards, and the Migration Tool reads tenants only from payload fields, not from shard keys.

If each point also stores its tenant ID in a payload field, split the collection by that field, as described under [Partition by Payload](#partition-by-payload).

If the tenant ID exists only as the shard key, the Migration Tool can't split the collection. Migrating it writes the points of every tenant to one Serverless collection.

### Tiered Multitenancy

With [tiered multitenancy](/documentation/manage-data/multitenancy/#tiered-multitenancy), every point has a tenant payload field, both in the fallback shard and in the dedicated shards of promoted tenants. Split the collection by that field, as described under [Partition by Payload](#partition-by-payload). Small tenants and promoted tenants each get their own collection.

## After the Migration

Serverless applies writes in the background, so migrated points can take a while to show up in searches and point counts. See [Delayed Update Visibility](/documentation/serverless/#delayed-update-visibility).

At the end of a migration to a single collection, the Migration Tool compares the point counts of the source and target collections. After a split, it skips this check. Count the points of each tenant collection yourself, and compare each count with a filtered count of that tenant in the source collection. For more checks, see the [Migration Guidance](/documentation/migration-guidance/).

To connect to the new space with your application, use the `QdrantServerless` client. See [Connect to a Space](/documentation/serverless/connect/).
