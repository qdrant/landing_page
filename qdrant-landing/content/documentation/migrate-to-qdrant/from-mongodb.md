---
title: From MongoDB
weight: 80
---

# Migrate from MongoDB to Qdrant

## What You Need from MongoDB

- **Connection string** — MongoDB URI (e.g., `mongodb://user:pass@host:27017`)
- **Database name** — the database containing your collection
- **Collection name** — the collection to migrate
- **Vector field names** — the names of fields that store vector embeddings

<aside role="alert"><strong>Important:</strong> MongoDB does not expose vector dimensions or distance metrics in a way the tool can read automatically. You must create the Qdrant collection manually before running the migration.</aside>

## Concept Mapping

| MongoDB | Qdrant | Notes |
| :--- | :--- | :--- |
| Collection | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| Vector field | Vector | Named vectors are preserved |
| Non-vector fields | Payload | Direct mapping |
| `_id` (ObjectID or string) | Point ID + Payload | Converted to UUID; original stored in payload |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration mongodb \
    --mongodb.url 'mongodb://localhost:27017' \
    --mongodb.database 'your-database' \
    --mongodb.collection 'your-collection' \
    --mongodb.vector-fields 'embedding' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### With Multiple Vector Fields

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration mongodb \
    --mongodb.url 'mongodb+srv://user:pass@cluster.mongodb.net' \
    --mongodb.database 'your-database' \
    --mongodb.collection 'your-collection' \
    --mongodb.vector-fields 'title_embedding,body_embedding' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection' \
    --migration.create-collection false
```

### All MongoDB-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--mongodb.url` | Yes | MongoDB connection string |
| `--mongodb.database` | Yes | Database name |
| `--mongodb.collection` | Yes | Collection name |
| `--mongodb.vector-fields` | Yes | Comma-separated list of vector field names |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original MongoDB `_id` values |

## Gotchas

- **Vector field names are required:** MongoDB has no schema-level marker for vector fields. You must explicitly list them via `--mongodb.vector-fields`.
- **ID mapping:** MongoDB `_id` values (ObjectID or string) are converted to Qdrant UUIDs. The original value is stored in payload under `--qdrant.id-field`.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
