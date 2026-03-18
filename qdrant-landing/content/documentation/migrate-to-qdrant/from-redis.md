---
title: From Redis
weight: 70
---

# Migrate from Redis to Qdrant

## What You Need from Redis

- **Redis address** — host and port of your Redis instance
- **FT index name** — the RediSearch full-text index that contains your vectors
- **Authentication** — username and password, if configured

<aside role="alert"><strong>Important:</strong> Redis does not expose vector configurations (dimensions, distance metric) after an index is created. You must create the Qdrant collection manually before running the migration.</aside>

## Concept Mapping

| Redis | Qdrant | Notes |
| :--- | :--- | :--- |
| FT Index | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| Vector field | Vector | Named vectors are preserved |
| Hash/JSON fields | Payload | Direct mapping |
| Document key | Payload field | Stored via `--qdrant.id-field` |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration redis \
    --redis.index 'your-ft-index' \
    --redis.addr 'localhost:6379' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### With Authentication

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration redis \
    --redis.index 'your-ft-index' \
    --redis.addr 'your-redis-host:6379' \
    --redis.username 'your-username' \
    --redis.password 'your-password' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection' \
    --migration.create-collection false
```

### All Redis-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--redis.index` | Yes | RediSearch FT index name |
| `--redis.addr` | No | Redis address (default: `localhost:6379`) |
| `--redis.protocol` | No | Redis protocol version (default: `2`) |
| `--redis.username` | No | Username for authentication |
| `--redis.password` | No | Password for authentication |
| `--redis.client-name` | No | Client name |
| `--redis.db` | No | Database number |
| `--redis.network` | No | Network type: `tcp` or `unix` (default: `tcp`) |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Redis document keys |

## Gotchas

- **Named vectors:** If your Redis index has multiple vector fields, all are migrated as named vectors. Ensure your pre-created Qdrant collection has a matching named vector configuration.
- **ID mapping:** Redis document keys are converted to Qdrant point IDs. The original key is stored in the payload under `--qdrant.id-field`.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-verification/).
