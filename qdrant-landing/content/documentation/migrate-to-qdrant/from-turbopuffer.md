---
title: From Turbopuffer
short_description: "Migrate Turbopuffer namespaces into Qdrant collections, preserving vectors, attributes, and document IDs."
description: "Migrate from Turbopuffer to Qdrant by streaming vectors and attributes from a Turbopuffer namespace into Qdrant collections with the Qdrant Migration Tool."
weight: 38
partition: ecosystem
---

# Migrate from Turbopuffer to Qdrant

## What You Need from Turbopuffer

- **API key**: from the [Turbopuffer dashboard](https://turbopuffer.com/dashboard)
- **Namespace**: the name of the namespace to migrate
- **Region**: the region the namespace lives in, such as `gcp-us-central1` or `aws-us-east-1`

## Concept Mapping

| Turbopuffer         | Qdrant           | Notes                                                                                    |
| :------------------ | :--------------- | :--------------------------------------------------------------------------------------- |
| Namespace           | Collection       | One-to-one mapping                                                                       |
| Document            | Point            | One-to-one mapping                                                                       |
| Vector attribute    | Named vector     | Same name and dimensions                                                                 |
| Other attributes    | Payload          | Direct mapping                                                                           |
| Unsigned integer ID | Numeric point ID | Direct mapping                                                                           |
| UUID string ID      | UUID point ID    | Direct mapping                                                                           |
| Other string ID     | UUID point ID    | Converted to a deterministic UUID. The original ID is kept in the `__id__` payload field |
| `cosine_distance`   | `Cosine`         | Direct mapping                                                                           |
| `euclidean_squared` | `Euclid`         | Direct mapping                                                                           |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration turbopuffer \
    --turbopuffer.namespace 'your-namespace' \
    --turbopuffer.api-key 'your-turbopuffer-api-key' \
    --turbopuffer.region 'gcp-us-central1' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Turbopuffer-Specific Flags

| Flag                      | Required | Description                                   |
| :------------------------ | :------- | :-------------------------------------------- |
| `--turbopuffer.namespace` | Yes      | Turbopuffer namespace to migrate              |
| `--turbopuffer.api-key`   | Yes      | Turbopuffer API key                           |
| `--turbopuffer.region`    | Yes      | Turbopuffer region, such as `gcp-us-central1` |

### Qdrant-Side Options

| Flag                | Default  | Description                                              |
| :------------------ | :------- | :------------------------------------------------------- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Turbopuffer document IDs |

## Gotchas

- **Indexes:** The tool does not carry over Turbopuffer's full-text search or filterable settings. Set up equivalent [payload indexes](/documentation/manage-data/indexing/#payload-index) in Qdrant after the migration.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
