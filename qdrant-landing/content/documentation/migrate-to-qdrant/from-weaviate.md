---
title: From Weaviate
weight: 20
---

# Migrate from Weaviate to Qdrant

## What You Need from Weaviate

- **Host URL** — the Weaviate instance address
- **Class name** — the class to migrate
- **Authentication** — API key, username/password, or bearer token depending on your setup
- **Vector dimensions** — Weaviate does not expose vector dimensions through its API, so you must know this value

<aside role="alert"><strong>Important:</strong> Because Weaviate does not expose vector dimensions, the migration tool cannot auto-create the Qdrant collection. You must create the collection manually before running the migration.</aside>

## Pre-Create Your Qdrant Collection

```bash
curl -X PUT 'https://your-instance.cloud.qdrant.io:6333/collections/your-collection' \
    -H 'api-key: your-qdrant-api-key' \
    -H 'Content-Type: application/json' \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        }
    }'
```

Replace `384` with your actual vector dimensions. Set the distance metric to match your Weaviate configuration.

## Concept Mapping

| Weaviate | Qdrant | Notes |
| :--- | :--- | :--- |
| Class | Collection | One-to-one mapping |
| Properties | Payload | Direct mapping |
| `cosine` | `Cosine` | Direct mapping |
| `l2-squared` | `Euclid` | Qdrant uses L2, not L2-squared; scores differ in magnitude but ranking is identical |
| `dot` | `Dot` | Direct mapping |
| Cross-references | Payload fields | Store referenced IDs as payload fields and rebuild linking in your application |
| Tenants | Payload field or separate collections | Use `--weaviate.tenant` to migrate a specific tenant |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration weaviate \
    --weaviate.host 'your-weaviate-host.example.com' \
    --weaviate.scheme https \
    --weaviate.class-name 'YourClass' \
    --weaviate.auth-type apiKey \
    --weaviate.api-key 'your-weaviate-api-key' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Weaviate-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--weaviate.host` | Yes | Weaviate host address |
| `--weaviate.scheme` | No | `http` or `https` (default: `http`) |
| `--weaviate.class-name` | Yes | Weaviate class to migrate |
| `--weaviate.auth-type` | No | `none`, `apiKey`, `password`, `client`, or `bearer` |
| `--weaviate.api-key` | No | API key (when auth-type is `apiKey`) |
| `--weaviate.username` | No | Username (when auth-type is `password`) |
| `--weaviate.password` | No | Password (when auth-type is `password`) |
| `--weaviate.tenant` | No | Specific tenant to migrate |
| `--weaviate.scopes` | No | Scopes (when auth-type is `password` or `client`) |
| `--weaviate.client-secret` | No | Client secret (when auth-type is `client`) |
| `--weaviate.token` | No | Token (when auth-type is `bearer`) |
| `--weaviate.refresh-token` | No | Refresh token (when auth-type is `bearer`) |
| `--weaviate.expires-in` | No | Token expiry in seconds (when auth-type is `bearer`) |

## Gotchas

- **Vector dimensions not exposed:** Always pre-create the Qdrant collection. If you don't know your dimensions, check a sample vector from Weaviate or your embedding model's documentation.
- **Cross-references:** Weaviate cross-references don't have a direct equivalent in Qdrant. Store referenced IDs as payload fields and rebuild the linking in your application layer.
- **Module dependencies:** If you used Weaviate vectorizer modules (e.g., `text2vec-openai`), ensure you exported the actual vectors, not just the source text.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-verification/).
