---
title: From OpenSearch
weight: 45
---

# Migrate from OpenSearch to Qdrant

## What You Need from OpenSearch

- **OpenSearch URL** — the HTTP endpoint
- **Index name** — the index containing your vectors
- **Credentials** — username/password or API key

## Concept Mapping

| OpenSearch | Qdrant | Notes |
| :--- | :--- | :--- |
| Index | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| `knn_vector` field | Vector | Mapped automatically |
| Document fields | Payload | Non-vector fields become payload |
| `cosinesimil` | `Cosine` | Direct mapping |
| `l2` | `Euclid` | Direct mapping |
| `innerproduct` | `Dot` | Direct mapping |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration opensearch \
    --opensearch.url 'https://your-opensearch-host:9200' \
    --opensearch.index 'your-index' \
    --opensearch.username 'admin' \
    --opensearch.password 'your-password' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### Using API Key Authentication

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration opensearch \
    --opensearch.url 'https://your-opensearch-host:9200' \
    --opensearch.index 'your-index' \
    --opensearch.api-key 'your-opensearch-api-key' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All OpenSearch-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--opensearch.url` | Yes | OpenSearch HTTP endpoint |
| `--opensearch.index` | Yes | Index to migrate |
| `--opensearch.username` | No | Username for basic auth |
| `--opensearch.password` | No | Password for basic auth |
| `--opensearch.api-key` | No | API key for authentication |
| `--opensearch.insecure-skip-verify` | No | Skip TLS certificate verification |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original OpenSearch document IDs |

## Gotchas

- **OpenSearch vs. Elasticsearch:** OpenSearch is a fork of Elasticsearch, so many of the same considerations apply. However, the CLI subcommand is `opensearch`, not `elasticsearch`.
- **Score normalization:** OpenSearch `_score` values are not directly comparable to Qdrant scores. Use rank-based metrics when [verifying your migration](/documentation/migration-verification/).
- **Nested documents:** OpenSearch nested documents need to be flattened or restructured for Qdrant's payload model.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-verification/).