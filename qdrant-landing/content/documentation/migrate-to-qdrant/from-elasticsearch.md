---
title: From Elasticsearch
weight: 40
---

# Migrate from Elasticsearch to Qdrant

## What You Need from Elasticsearch

- **Elasticsearch URL** — the HTTP endpoint
- **Index name** — the index containing your vectors
- **Credentials** — username/password or API key

## Concept Mapping

| Elasticsearch | Qdrant | Notes |
| :--- | :--- | :--- |
| Index | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| `dense_vector` field | Vector | Mapped automatically |
| Document fields | Payload | Non-vector fields become payload |
| `cosine` | `Cosine` | ES returns `1 - cosine_distance`; Qdrant returns cosine similarity directly |
| `l2_norm` | `Euclid` | Direct mapping |
| `dot_product` | `Dot` | Direct mapping |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration elasticsearch \
    --elasticsearch.url 'https://your-es-host:9200' \
    --elasticsearch.index 'your-index' \
    --elasticsearch.username 'elastic' \
    --elasticsearch.password 'your-password' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### Using API Key Authentication

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration elasticsearch \
    --elasticsearch.url 'https://your-es-host:9200' \
    --elasticsearch.index 'your-index' \
    --elasticsearch.api-key 'your-es-api-key' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Elasticsearch-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--elasticsearch.url` | Yes | Elasticsearch HTTP endpoint |
| `--elasticsearch.index` | Yes | Index to migrate |
| `--elasticsearch.username` | No | Username for basic auth |
| `--elasticsearch.password` | No | Password for basic auth |
| `--elasticsearch.api-key` | No | API key for authentication |
| `--elasticsearch.insecure-skip-verify` | No | Skip TLS certificate verification |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Elasticsearch document IDs |

## Hybrid Search Considerations

If your Elasticsearch setup uses hybrid BM25 + kNN scoring, you'll need to reconstruct this in Qdrant using [sparse vectors](/documentation/concepts/vectors/#sparse-vectors) (for BM25-like behavior) alongside dense vectors. The migration tool transfers the dense vectors; you'll need to generate sparse vectors separately if you want hybrid search in Qdrant.

Qdrant supports native hybrid search with [Reciprocal Rank Fusion (RRF)](/documentation/concepts/hybrid-queries/) to combine dense and sparse results.

## Gotchas

- **Nested documents:** Elasticsearch nested documents need to be flattened or restructured for Qdrant's payload model.
- **Score normalization:** Elasticsearch `_score` values are not comparable to Qdrant scores. Use rank-based metrics (recall@k, Spearman correlation) rather than raw score comparison when [verifying your migration](/documentation/migration-verification/).
- **BM25 is not migrated:** The migration tool transfers vectors and document fields. If you relied on Elasticsearch's BM25 scoring, you'll need to set up sparse vectors in Qdrant separately.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-verification/).
