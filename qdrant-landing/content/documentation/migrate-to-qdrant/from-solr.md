---
title: From Apache Solr
short_description: "Move dense vector fields from Apache Solr collections into Qdrant for purpose-built vector search and filtering."
description: "Migrate from Apache Solr to Qdrant by streaming dense vector fields, document IDs, and metadata from Solr collections into Qdrant with the Qdrant Migration Tool."
weight: 100
---

# Migrate from Apache Solr to Qdrant

## What You Need from Solr

- **Solr URL** — the base URL of your Solr instance (e.g., `http://localhost:8983`)
- **Collection name** — the Solr collection to migrate
- **Authentication** — username and password, if configured

<aside role="alert"><strong>Important:</strong> Solr does not reliably expose vector dimensions and distance metrics via its schema API. You must create the Qdrant collection manually before running the migration.</aside>

## Concept Mapping

| Solr | Qdrant | Notes |
| :--- | :--- | :--- |
| Collection | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| Dense vector field | Vector | Named vectors are preserved |
| Non-vector fields | Payload | Direct mapping |
| Document ID (`id` field) | Payload field | Stored via `--qdrant.id-field` |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration solr \
    --solr.url 'http://localhost:8983' \
    --solr.collection 'your-collection' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### With Authentication

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration solr \
    --solr.url 'https://your-solr-host:8983' \
    --solr.collection 'your-collection' \
    --solr.username 'your-username' \
    --solr.password 'your-password' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection' \
    --migration.create-collection false
```

### All Solr-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--solr.url` | Yes | Solr base URL (e.g., `http://localhost:8983`) |
| `--solr.collection` | Yes | Solr collection name |
| `--solr.username` | No | Username for basic authentication |
| `--solr.password` | No | Password for basic authentication |
| `--solr.insecure-skip-verify` | No | Skip TLS certificate verification (default: `false`) |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Solr document IDs |

## Gotchas

- **Named vectors:** If your Solr schema has multiple dense vector fields, all are migrated as named vectors. Ensure your pre-created collection has matching named vector configurations.
- **ID mapping:** Solr document IDs (strings) are converted to Qdrant UUIDs. The original Solr ID is stored in payload under `--qdrant.id-field`.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
