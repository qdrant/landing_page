---
title: From Pinecone
short_description: "Migrate Pinecone serverless indexes into Qdrant collections, preserving vectors, metadata, and namespaces in transit."
description: "Migrate from Pinecone to Qdrant by streaming serverless index data, vectors, namespaces, and metadata into Qdrant collections with the Qdrant Migration Tool."
weight: 5
partition: ecosystem
---

# Migrate from Pinecone to Qdrant

## What You Need from Pinecone

- **API key** — from the [Pinecone console](https://app.pinecone.io/)
- **Index name** — the name of the index to migrate
- **Index host URL** — the host endpoint shown in your index dashboard

<aside role="status">Only Pinecone <strong>serverless</strong> indexes support listing all vectors for migration. Legacy pod-based indexes may require additional steps.</aside>

## Concept Mapping

| Pinecone | Qdrant | Notes |
| :--- | :--- | :--- |
| Index | Collection | One-to-one mapping |
| Namespace | Payload field or separate collection | No direct equivalent — the tool migrates all namespaces. Use `--pinecone.namespace` to migrate a specific one |
| Metadata | Payload | Direct mapping |
| Sparse values | Sparse vectors | Mapped to `sparse_vector` named vector by default |
| `cosine` | `Cosine` | Direct mapping |
| `dotproduct` | `Dot` | Pinecone requires unit-normalized vectors for dotproduct |
| `euclidean` | `Euclid` | Direct mapping |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration pinecone \
    --pinecone.index-host 'https://your-index-host.pinecone.io' \
    --pinecone.index-name 'your-index' \
    --pinecone.api-key 'pcsk_...' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### Migrating a Specific Namespace

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration pinecone \
    --pinecone.index-host 'https://your-index-host.pinecone.io' \
    --pinecone.index-name 'your-index' \
    --pinecone.api-key 'pcsk_...' \
    --pinecone.namespace 'my-namespace' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Pinecone-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--pinecone.index-name` | Yes | Name of the Pinecone index |
| `--pinecone.index-host` | Yes | Host URL of the Pinecone index |
| `--pinecone.api-key` | Yes | Pinecone API key |
| `--pinecone.namespace` | No | Specific namespace to migrate |
| `--pinecone.service-host` | No | Custom Pinecone service host |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Pinecone IDs |
| `--qdrant.sparse-vector` | `sparse_vector` | Named vector for Pinecone sparse values |

## Gotchas

- **Score scaling:** Pinecone cosine similarity returns values in [0, 1] (rescaled). Qdrant returns [-1, 1]. Rankings are identical, but raw scores won't match.
- **Metadata size limits:** Pinecone limits metadata to 40KB per vector. Qdrant has no per-payload size limit, so data is preserved as-is.
- **Namespace strategy:** If you have multiple namespaces, decide upfront whether to merge them into a single Qdrant collection (using a `namespace` payload field for filtering) or create separate collections.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
