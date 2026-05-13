---
title: From FAISS
short_description: "Move vectors from a FAISS index file into Qdrant to gain managed storage, payload filtering, and distributed search."
description: "Migrate from FAISS to Qdrant by importing non-quantized FAISS index files into Qdrant collections for managed storage, payload filters, and distributed search."
weight: 90
---

# Migrate from FAISS to Qdrant

## What You Need from FAISS

- **Index file path** — path to your FAISS index file
- **Distance metric** — the metric used when the index was built (`l2`, `inner product`, etc.)

<aside role="alert"><strong>Important:</strong> Only non-quantized FAISS index types are supported. Quantized indexes (e.g., <code>IndexIVFPQ</code>) do not store the original vectors and cannot be migrated.</aside>

## Supported Index Types

| FAISS Index Type | Supported | Notes |
| :--- | :--- | :--- |
| `IndexFlatL2` | Yes | Maps to `euclid` distance |
| `IndexFlatIP` | Yes | Maps to `dot` distance |
| `IndexHNSWFlat` | Yes | Full vectors are stored |
| `IndexIVFFlat` | Yes | Full vectors are stored |
| `IndexIVFPQ` | No | Quantized — original vectors not stored |
| `IndexPQ` | No | Quantized — original vectors not stored |

## Concept Mapping

| FAISS | Qdrant | Notes |
| :--- | :--- | :--- |
| Index | Collection | One-to-one mapping |
| Vector (by position) | Point | Position in index becomes point ID |

## Run the Migration

```bash
docker run --net=host --rm -it \
    -v /path/to/your/index:/data \
    registry.cloud.qdrant.io/library/qdrant-migration faiss \
    --faiss.index-path '/data/your-index.index' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection' \
    --qdrant.distance-metric cosine
```

### All FAISS-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--faiss.index-path` | Yes | Path to the FAISS index file (inside the container) |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.distance-metric` | `cosine` | Distance metric: `cosine`, `dot`, `euclid`, or `manhattan` |

## Gotchas

- **No metadata:** FAISS indexes store only vectors. All points will have empty payloads. If you have a separate metadata store keyed by vector position, import that separately after migration.
- **Point IDs:** Points are assigned IDs based on their position in the FAISS index. Use this to join with any external metadata store.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
