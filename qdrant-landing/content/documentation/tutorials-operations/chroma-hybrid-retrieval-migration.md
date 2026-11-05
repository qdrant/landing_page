---
title: Migrate Hybrid Search from Chroma
short_description: "Move a Chroma Cloud hybrid retrieval application to Qdrant Cloud: copy dense and sparse vectors, replace Chroma's embedding functions, and translate the fused query."
description: "Migrate a hybrid retrieval workflow from Chroma Cloud to Qdrant Cloud before the shutdown: copy dense and sparse vectors with the migration tool, replace Chroma's embedding functions, and translate the fused query."
weight: 36
goal: Operations
stack:
  - Python
keywords:
  - chroma
  - chroma cloud
  - migration
  - hybrid search
  - bm25
  - full-text index
---

# Migrate Hybrid Search from Chroma Cloud to Qdrant Cloud

| Time: 45 min | Level: Intermediate |
| --- | ----------- |

Migrating hybrid retrieval from Chroma Cloud to Qdrant Cloud involves transferring the collection and adapting the application's queries. The [Qdrant Migration Tool](/documentation/migrate-to-qdrant/from-chroma/) copies dense vectors, indexed sparse vectors, document text, and metadata. You then replace Chroma's embedding functions and translate the filters and ranking fusion into Qdrant's query API.

This tutorial uses a support assistant as a worked example to show how to migrate dense retrieval, BM25 sparse retrieval, and exact and range metadata filters.

<aside role="status">
Chroma Cloud shutdown: writes stop on December 7, 2026, and reads stop on December 22, 2026. Redirect application writes before December 7, and complete your migration before December 22. See the <a href="https://www.trychroma.com/cloud-wind-down">official timeline</a>.
</aside>

## What Transfers and What You Rebuild

| Source Component | Target Treatment |
| --- | --- |
| Dense vectors | Copied without re-embedding; dimensions and distance preserved |
| Sparse vectors with a Chroma sparse vector index | Copied as named sparse vectors, keyed by the Chroma metadata key |
| Sparse vectors without a Chroma sparse vector index | Skipped, with a warning |
| Document text | Stored in the `document` payload field by default |
| Application metadata | Preserved as payload fields; create payload indexes for fields used in filters |
| Original chunk identifiers | Preserved in the `__id__` payload field by default |
| Embedding functions | Replaced with the same model via Qdrant Cloud Inference, FastEmbed, or your own hosting |
| Hybrid query | Rewritten with prefetches and a fusion step |

Nothing stored needs regenerating, as long as you keep the models that produced it. Changing a model means re-embedding the corpus.

## Prerequisites

- Your own Chroma Cloud collection.
- A Qdrant Cloud cluster on server version 1.20 or newer ([create one](/documentation/cloud/create-cluster/)), with its URL and API key.
- Docker, for the migration tool.
- Python with `qdrant-client` 1.20 or newer:

```bash
pip install "qdrant-client>=1.20.0"
```

The examples use this client and collection name. Step 2 explains `cloud_inference=True`.

```python
from qdrant_client import QdrantClient, models

COLLECTION = "support"

client = QdrantClient(
    url="https://your-cluster.cloud.qdrant.io:6333",
    api_key="your-api-key",
    cloud_inference=True,
)
```

## Establish a Retrieval Baseline

Before migrating, choose a representative set of queries and filters that covers your application's retrieval behavior: semantic matches, lexical matches, metadata filtering, and queries with no matching records. Capture Chroma's results as a baseline for comparison with Qdrant.

This tutorial uses a support assistant for a fictional product called Atlas. Its Chroma collection contains six chunks, each with text and metadata for filtering and citations. Follow the parts that apply to your workflow and adapt as needed.

| ID | Text | `product` | `version_major` | `version_minor` | `article_id` |
| --- | --- | --- | --- | --- | --- |
| `atlas-2-session` | Atlas 2.0 ends your session after 30 minutes of inactivity. | atlas | 2 | 0 | session-expiration |
| `atlas-2-auth4017` | AUTH4017 means your Atlas API key has expired. Create a new key in Settings > API Keys. | atlas | 2 | 0 | auth4017 |
| `atlas-2-auth4018` | AUTH4018 means your Atlas API key lacks permission for this operation. | atlas | 2 | 0 | auth4018 |
| `atlas-2-backup` | To restore an Atlas 2.0 backup, open Settings > Backups, select a backup, and choose Restore. | atlas | 2 | 0 | restore-backup |
| `atlas-1-backup` | To restore an Atlas 1.0 backup, open Admin > Recovery, upload the backup file, and choose Import. | atlas | 1 | 0 | restore-backup |
| `boreal-2-backup` | To restore a Boreal 2.0 backup, open Workspace > Snapshots, select a snapshot, and choose Recover. | boreal | 2 | 0 | restore-backup |

Each record also stores its BM25 sparse vector in the `sparse_embedding` metadata field, with a sparse vector index enabled for that field. The two authentication errors have near-identical wording and different remedies, so only an exact identifier match separates them. The three backup records are close paraphrases distinguished by metadata alone. Versions are stored as integer major and minor numbers, so filters can select a range such as version 2 and later, not only an exact version.

The following queries illustrate the behaviors covered by this example. All use `product="atlas"`; the version filter varies as shown.

| Question | Version Filter | Expected Top Result | Behavior Tested |
| --- | --- | --- | --- |
| "Why do I have to sign in again after leaving the app idle?" | 2.0 | `atlas-2-session` | Dense retrieval across different wording |
| "How do I resolve AUTH4017?" | 2.0 | `atlas-2-auth4017` | Lexical matching on an error identifier |
| "How do I restore a backup?" | 2.0 | `atlas-2-backup` | Filters excluding other products and versions |
| "How do I restore a backup?" | 1.0 | `atlas-1-backup` | Version-specific instructions |
| "How do I restore a backup?" | Major version 2 or later | `atlas-2-backup` | A range filter excluding older versions |
| "How do I restore a backup?" | 9.0 | No results | A filter with no matching records |

## 1. Migrate the Collection

Before you copy anything, record the source collection's point count, schema, and sample records, following the [pre-migration baseline](/documentation/migration-guidance/pre-migration-baseline/) checklist. The verification step compares against it.

### Copy the Collection

This command copies the example's support collection from Chroma Cloud to Qdrant Cloud. The tool reads the distance metric from the Chroma collection; `--qdrant.distance-metric` overrides it. See the [Chroma migration guide](/documentation/migrate-to-qdrant/from-chroma/) for authentication and configuration options.

```bash
docker run --rm registry.cloud.qdrant.io/library/qdrant-migration chroma \
  --chroma.url 'https://api.trychroma.com' \
  --chroma.tenant 'your-tenant-id' \
  --chroma.database 'your-database' \
  --chroma.collection 'support' \
  --chroma.auth-type token \
  --chroma.token-header X-Chroma-Token \
  --chroma.token 'your-chroma-api-key' \
  --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
  --qdrant.api-key 'your-qdrant-api-key' \
  --qdrant.collection 'support' \
  --qdrant.document-field document \
  --qdrant.id-field __id__ \
  --migration.batch-size 300
```

The Qdrant URL here is the gRPC endpoint on port 6334.

Point IDs are derived from the Chroma document ID, so a second run into the same `--qdrant.collection`, for example to consolidate per-tenant Chroma collections, overwrites any point whose ID appears in both sources. Compare the final point count against the sum of your sources, and give each source its own target collection or make the IDs unique first. See [Multitenancy](/documentation/manage-data/multitenancy/) for separating tenants inside one collection.

The tool migrates indexed sparse vectors automatically, using each Chroma metadata key as the Qdrant vector name. For indexes configured for BM25, it also enables Qdrant's [IDF modifier](/documentation/search/text-search/sparse-vector-search/#bm25).

<aside role="alert">
A sparse vector stored in Chroma metadata <em>without</em> an enabled sparse vector index is skipped entirely, rather than migrated as a vector or retained in payload. The tool prints a single warning naming one such key and continues. If your retrieval depends on a sparse field, confirm it has an index in Chroma before you migrate, and confirm it arrived afterward.
</aside>

### Verify the Transfer

Run the [data integrity checks](/documentation/migration-guidance/data-integrity/) against your baseline: point count, vector dimensions and distance, payload, and point IDs.

Confirm that the collection has the expected named sparse vectors, then inspect a sample of migrated records. This example uses `sparse_embedding`:

```python
info = client.get_collection(COLLECTION)
print(info.config.params.sparse_vectors)

records, _ = client.scroll(
    collection_name=COLLECTION,
    limit=3,
    with_payload=True,
    with_vectors=True,
)
for record in records:
    print(record.payload["__id__"], list(record.vector))
```

If `sparse_embedding` is missing, check whether the Chroma schema has a sparse vector index on that key, and look for a skipped sparse vectors warning in the migration output.

The remaining examples assume text in `document`, the original ID in `__id__`, top-level `product`, `version_major`, `version_minor`, and `article_id` fields, one unnamed dense vector, and one named sparse vector called `sparse_embedding`. Substitute your own names.

### Index the Filter Fields

The migration tool does not create payload indexes. Create one for each field your filters use: keyword indexes for the product and article fields, and integer indexes, which support range filters, for the version numbers. Qdrant builds them from the payload already in the collection:

```python
for field_name, field_schema in (
    ("product", models.PayloadSchemaType.KEYWORD),
    ("article_id", models.PayloadSchemaType.KEYWORD),
    ("version_major", models.PayloadSchemaType.INTEGER),
    ("version_minor", models.PayloadSchemaType.INTEGER),
):
    client.create_payload_index(
        collection_name=COLLECTION,
        field_name=field_name,
        field_schema=field_schema,
        wait=True,
    )
```

## 2. Replace Chroma's Embedding Functions

The migration copies vectors, but not the embedding functions configured on your Chroma collection. Keep generating embeddings for queries and new or updated documents with the original models, settings, and preprocessing, and compare retrieval results against your baseline whenever the implementation changes.

Find your Chroma embedding function, then the Qdrant option that runs the same model:

| Chroma Embedding Function | Model | Qdrant Option |
| --- | --- | --- |
| Default (`DefaultEmbeddingFunction`) | `all-MiniLM-L6-v2` | Qdrant Cloud Inference, or FastEmbed |
| `ChromaCloudQwenEmbeddingFunction` | `Qwen/Qwen3-Embedding-0.6B` | Your own inference |
| `OpenAIEmbeddingFunction`, `CohereEmbeddingFunction`, `JinaEmbeddingFunction` | The provider's model | Qdrant Cloud Inference through the provider |
| `ChromaCloudSpladeEmbeddingFunction` | `prithivida/Splade_PP_en_v1` | Qdrant Cloud Inference, or FastEmbed |
| `ChromaBm25EmbeddingFunction`, `Bm25EmbeddingFunction` | BM25 | Qdrant Cloud Inference, or FastEmbed |
| `FastembedSparseEmbeddingFunction` | A FastEmbed model | FastEmbed |
| Any other | | Your own inference, unless the model is in the hosted catalog or on an external provider |

The `ChromaCloud*` functions call Chroma's hosted embedding API at `embed.trychroma.com`, which the Chroma Cloud wind-down notice does not cover. Plan to replace them as part of the migration rather than depend on that service.

### Qdrant Cloud Inference

With [Qdrant Cloud Inference](/documentation/embeddings/qdrant-cloud-inference/), pass a `Document` containing text and a model name when inserting records or searching. In Python, configure the client with `cloud_inference=True`.

Hosted models require no additional provider API key. Relevant options from the [model catalog](/documentation/embeddings/qdrant-cloud-inference/#models) include:

- `sentence-transformers/all-minilm-l6-v2`: the model used by Chroma's default embedding function; free.
- `prithivida/splade_pp_en_v1`: the model used by Chroma Cloud SPLADE.
- `qdrant/bm25`: server-side BM25 sparse-vector generation; free. It replaces Chroma's BM25 functions on English text, but can tokenize accented and other non-ASCII characters differently. For other text, use FastEmbed or compare the vectors for a sample of documents first.

<aside role="status">
<strong>Optional: BM25 on a full-text index.</strong> Qdrant 1.20 can compute BM25 from a <a href="/documentation/search/text-search/full-text-search/">full-text index</a> on the migrated text, with no sparse vectors to generate. To switch after cutover, follow the <a href="/documentation/search/text-search/full-text-search/#migrate-from-sparse-vector-bm25">migration path</a>.
</aside>

**External providers:** Qdrant Cloud forwards requests to [OpenAI, Cohere, Jina AI, and OpenRouter](/documentation/inference/external-inference-providers/). Specify the provider-prefixed model name, such as `openai/text-embedding-3-small`, and supply your provider API key.

### FastEmbed

[FastEmbed](/documentation/fastembed/) generates vectors in your application. Supported models include `sentence-transformers/all-MiniLM-L6-v2`, `prithivida/Splade_PP_en_v1`, and `Qdrant/bm25`.

For BM25, FastEmbed is the exact match. `Bm25EmbeddingFunction` wraps FastEmbed's `Qdrant/bm25`, and `ChromaBm25EmbeddingFunction` produces the same vectors at its default settings. If you changed `k`, `b`, `avg_doc_length`, or `token_max_length` in Chroma, pass the same values in the `Document` options. FastEmbed calls the average length `avg_len`.

### Your Own Inference

Use this option for models that neither Cloud Inference nor FastEmbed supports, such as the `Qwen/Qwen3-Embedding-0.6B` model behind Chroma Cloud Qwen. Run the same model yourself, for example with Sentence Transformers or a model server, and pass the vectors to Qdrant. If the embedding function already ran inside your application, keep calling it and pass the vectors it returns.

### In This Example

The example collection used Chroma's default embedding function for dense vectors and `ChromaBm25EmbeddingFunction` for sparse vectors. Both have free hosted models:

```python
DENSE_MODEL = "sentence-transformers/all-minilm-l6-v2"
SPARSE_MODEL = "qdrant/bm25"
```

## 3. Translate the Hybrid Query

### The Chroma Query You Have Today

The source query fuses a dense and a sparse ranking inside a metadata filter:

```python
from chromadb import K, Knn, Rrf, Search

question = "How do I resolve AUTH4017?"

search = (
    Search()
    .where(
        (K("product") == "atlas") & (K("version_major") == 2) & (K("version_minor") == 0)
    )
    .rank(
        Rrf(
            ranks=[
                Knn(query=question, return_rank=True, limit=20, default=1000),
                Knn(
                    query=question,
                    key="sparse_embedding",
                    return_rank=True,
                    limit=20,
                    default=1000,
                ),
            ],
            k=60,
        )
    )
    .limit(5)
    .select(K.DOCUMENT, K.SCORE, "article_id", "product")
)

rows = collection.search(search).rows()[0]
```

The range query in the baseline replaces the version conditions with `K("version_major") >= 2`.

Each branch requests up to 20 candidates. [Reciprocal rank fusion](/documentation/search/hybrid-queries/) combines the rankings with `k=60`, and the query returns up to five results. The Qdrant query will use the same candidate limits, fusion constant, and result limit.

`default=1000` keeps documents that only one branch finds. If your `Knn` calls have no `default`, Chroma returns only documents found by both branches, while Qdrant returns documents found by either, so additional results may appear after migrating. If your query sets `weights`, re-tune them in Qdrant rather than copying them: Chroma multiplies each rank's contribution by its weight, while Qdrant uses the weight to adjust rank positions.

### Rewrite It for Qdrant

Embed the same question with the models from step 2. A filter on the query applies to every prefetch, so both branches search only the requested product and versions, as with Chroma's `where`. `MatchValue` translates Chroma's equality conditions, and `Range` translates `>=` and the other comparisons:

```python
def hybrid_search(question: str, scope: models.Filter) -> list[models.ScoredPoint]:
    query_vector = models.Document(text=question, model=DENSE_MODEL)
    sparse_query = models.Document(text=question, model=SPARSE_MODEL)
    result = client.query_points(
        collection_name=COLLECTION,
        prefetch=[
            models.Prefetch(query=query_vector, limit=20),
            models.Prefetch(query=sparse_query, using="sparse_embedding", limit=20),
        ],
        query=models.RrfQuery(rrf=models.Rrf(k=60)),
        query_filter=scope,
        limit=5,
        with_payload=True,
    )
    return result.points


def match(key: str, value: str | int) -> models.FieldCondition:
    return models.FieldCondition(key=key, match=models.MatchValue(value=value))


def atlas_version(major: int, minor: int) -> models.Filter:
    return models.Filter(
        must=[
            match("product", "atlas"),
            match("version_major", major),
            match("version_minor", minor),
        ]
    )


atlas_2_and_later = models.Filter(
    must=[
        match("product", "atlas"),
        models.FieldCondition(key="version_major", range=models.Range(gte=2)),
    ]
)

points = hybrid_search("How do I resolve AUTH4017?", atlas_version(2, 0))
```

The first prefetch searches the dense vector. The second searches `sparse_embedding`, the vector name the tool took from the Chroma metadata key. Set `k=60` explicitly, since Qdrant's default is `2`. See [hybrid queries](/documentation/search/hybrid-queries/) for the full API.

Matching these settings preserves the query structure, but differences in candidate selection and scoring can still change the ranking. Compare against your baseline in step 4 before [tuning fusion](/documentation/search-tuning/how-to-tune-hybrid-search/).

Iterate over `points` and pass each point's `payload["document"]` to your answering step. Use `payload["__id__"]` and `payload["article_id"]` wherever your application needs the original record and article identifiers.

<aside role="status">
<strong>Using LangChain?</strong> Its Qdrant vector store reads metadata from a nested <code>metadata</code> key, so migrated top-level fields such as <code>article_id</code> come back empty. Wrap <code>query_points</code> results yourself, or see the <a href="/documentation/frameworks/langchain/">LangChain</a> and <a href="/documentation/frameworks/llama-index/">LlamaIndex</a> integrations to configure field and vector names.
</aside>

## 4. Verify Retrieval Behavior

Run the baseline queries with the same filters against Qdrant. For this example, confirm that:

- Each question returns its expected chunk first.
- No result comes from a product or version the filter excludes.
- The absent-version query returns no results.

This loop runs those checks against the example queries:

```python
SIGN_IN = "Why do I have to sign in again after leaving the app idle?"
AUTH = "How do I resolve AUTH4017?"
BACKUP = "How do I restore a backup?"
OTHER_BACKUPS = ("boreal-2-backup",)

CHECKS = [
    # (question, filter, expected top result, chunks the filter must exclude)
    (SIGN_IN, atlas_version(2, 0), "atlas-2-session", ()),
    (AUTH, atlas_version(2, 0), "atlas-2-auth4017", ()),
    (BACKUP, atlas_version(2, 0), "atlas-2-backup", ("atlas-1-backup", *OTHER_BACKUPS)),
    (BACKUP, atlas_version(1, 0), "atlas-1-backup", ("atlas-2-backup", *OTHER_BACKUPS)),
    (BACKUP, atlas_2_and_later, "atlas-2-backup", ("atlas-1-backup", *OTHER_BACKUPS)),
    (BACKUP, atlas_version(9, 0), None, ()),
]

for question, scope, expected, excluded in CHECKS:
    ids = [point.payload["__id__"] for point in hybrid_search(question, scope)]
    top_ok = ids[:1] == [expected] if expected else not ids
    passed = top_ok and not set(excluded) & set(ids)
    print("PASS" if passed else "FAIL", question, ids)
```

Compare the rankings with Chroma's results, using the labeled examples to judge whether changes affect relevance.

If an expected result is missing, test dense and sparse retrieval separately. Check embedding configuration, filters, and migrated vectors before adjusting candidate limits or fusion settings.

## 5. Move the Write Path

Before December 7, update your application to send inserts, updates, and deletions to Qdrant, using the embedding configuration from step 2.

For every write, reproduce the migration tool's point-ID conversion: preserve valid UUIDs and convert other Chroma IDs to UUIDv5 using the URL namespace.

```python
import uuid


def point_id_for(chroma_id: str) -> str:
    try:
        return str(uuid.UUID(chroma_id))
    except ValueError:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, chroma_id))
```

Using the same conversion targets the migrated record instead of creating another point, and new records stay addressable for later updates. Keep the vector names and payload fields consistent with the migrated collection, and regenerate both vectors when document text changes. [`upload_points`](/documentation/manage-data/points/#upload-points) batches the writes and retries failed batches:

```python
# (Chroma ID, text, product, major version, minor version, article ID)
records = [
    ("atlas-2-ratelimit", "RATE429 means you exceeded your quota.", "atlas", 2, 0, "rate429"),
    ("atlas-2-auth4019", "AUTH4019 means your API key was revoked.", "atlas", 2, 0, "auth4019"),
]

client.upload_points(
    collection_name=COLLECTION,
    points=[
        models.PointStruct(
            id=point_id_for(chroma_id),
            vector={
                "": models.Document(text=text, model=DENSE_MODEL),
                "sparse_embedding": models.Document(text=text, model=SPARSE_MODEL),
            },
            payload={
                "document": text,
                "__id__": chroma_id,
                "product": product,
                "version_major": major,
                "version_minor": minor,
                "article_id": article_id,
            },
        )
        for chroma_id, text, product, major, minor, article_id in records
    ],
    max_retries=3,
    wait=True,
)
```

When you re-chunk an article, delete its old chunks with a filter on `article_id` first, since the new chunk count may differ. See [point operations](/documentation/manage-data/points/) for inserts, updates, and deletions. Before you depend on the write path, add, revise, and delete a record, then re-run the baseline queries.

**Using Chroma Sync?** The migration copies its output, not its managed ingestion pipeline. Replace source ingestion and change propagation separately using the [data management integrations](/documentation/data-management/).

## 6. Cut Over

Once retrieval matches your baseline and the write path is tested, switch reads to Qdrant. Chroma Cloud serves reads until December 22, 2026, so keep your Chroma collection and recorded baseline until then, and re-run the migration before that date if you need to.
