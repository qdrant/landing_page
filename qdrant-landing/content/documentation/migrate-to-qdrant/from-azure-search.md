---
title: From Azure AI Search
short_description: "Migrate Azure AI Search vector indexes into Qdrant collections to consolidate vector workloads on a dedicated engine."
description: "Migrate from Azure AI Search to Qdrant by streaming vectors and retrievable document fields into Qdrant collections, recreating vector dimensions and distance metrics with the Qdrant Migration Tool's connector."
weight: 27
partition: ecosystem
---

# Migrate from Azure AI Search to Qdrant

## What You Need from Azure AI Search

- **Service endpoint** — e.g. `https://your-service.search.windows.net`
- **Index name** — the index containing your vectors
- **Admin API key** — used to authenticate with the Azure AI Search REST API

## Concept Mapping

| Azure AI Search | Qdrant | Notes |
| :--- | :--- | :--- |
| Index | Collection | One-to-one mapping |
| Document | Point | Each document becomes a point |
| Vector field (`Collection(Edm.Single)` with `dimensions`) | Named vector | Each vector field in the index becomes a named vector on the same point |
| Retrievable document fields | Payload | Non-vector, retrievable fields (excluding `@search.*` metadata) become payload |
| `cosine` | `Cosine` | Direct mapping; also the fallback for any unrecognized metric |
| `dotProduct` | `Dot` | Direct mapping |
| `euclidean` | `Euclid` | Direct mapping |

## Run the Migration

```bash
docker run --net=host --rm -it registry.cloud.qdrant.io/library/qdrant-migration azure \
    --azure.endpoint 'https://your-service.search.windows.net' \
    --azure.index 'your-index' \
    --azure.api-key 'your-azure-admin-api-key' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All Azure AI Search-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--azure.endpoint` | Yes | Azure AI Search service endpoint |
| `--azure.index` | Yes | Index to migrate |
| `--azure.api-key` | Yes | Admin API key for authentication |
| `--azure.api-version` | No | REST API version (default `2026-04-01`) |

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original Azure AI Search document keys |

## Gotchas

- **Fields must be marked `retrievable`:** the connector fetches documents with `select: "*"`, which Azure AI Search limits to fields marked `"retrievable": true` in the index schema. This applies to vector fields too — make sure every vector field you want migrated is retrievable, or its values won't be returned at all.
- **Missing or empty vectors are migrated silently:** if a document has no value (or an empty array) for a vector field — whether because it wasn't set or because the field isn't retrievable — the tool skips that named vector for the point without raising an error. Points can end up with fewer vectors than expected; verify vector counts after migration.
- **Key field must be sortable and filterable:** the tool paginates through documents using keyset pagination (`orderby` plus a `gt` filter on the key field). If your index's key field isn't marked `"sortable": true` and `"filterable": true` in the schema, the migration fails immediately with an error instead of transferring partial data.
- **API key authentication only:** the connector authenticates with an `api-key` header. Azure AD / managed identity authentication is not currently supported.
- **Multiple vector fields become multiple named vectors:** if your index defines more than one vector field, each is migrated into the same Qdrant collection as a separate named vector, and the target collection is created with all of them configured up front.
- **Unrecognized similarity metrics default to Cosine:** any HNSW or exhaustive-KNN metric other than `dotProduct` or `euclidean` (including `cosine`) is mapped to Qdrant's `Cosine` distance.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
