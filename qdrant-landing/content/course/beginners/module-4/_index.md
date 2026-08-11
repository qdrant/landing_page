---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: how to design a vector search system, covering layers, filtering, RAG, and deployment."
description: "Design a vector search system: the layers of the stack, five design questions, filtering, a production RAG pipeline, and deployment options."
isLesson: true
weight: 50
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
  <iframe src="https://www.youtube.com/embed/0qQ3B9uirz0?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

<br>
Modules 1 through 3 gave you the building blocks: embeddings, collections, HNSW, hybrid retrieval, and filters. This module turns them into a system, which means a payload schema, a retrieval pipeline, and a deployment mode.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

## 1. The Layers of the Stack

Every vector search system is built from the same five layers. When something is slow, wrong, or expensive, the first diagnostic question is always the same: **Which layer is the problem in?**

- **Query layer**: Embedding the query, choosing dense vs. sparse vs. hybrid, fusing results, setting limits. This is Module 3's territory.
- **Indexing layer**: The HNSW graph for vectors (Module 2) and payload indexes for filter fields. Mistakes here make things slow rather than wrong.
- **Storage layer**: Vectors, payloads, and IDs on disk and in memory.
- **Knowledge layer**: The data and how it's prepared: chunking, embedding model choice, payload schema. Garbage in, garbage retrieved.
- **Distribution layer**: Sharding, replication, and multi-node clusters. You won't need this on day one.

Every design decision belongs to one of them: "add a payload index" is indexing, "chunk articles instead of embedding them whole" is knowledge, "move to three nodes" is distribution.

![The five layers of a vector search stack, from the query layer at the top down through indexing, storage, and knowledge to the distribution layer at the base.](/courses/beginners/module-4/layers.png)

## 2. Worked Example: Designing a News Search System

Here's the brief, the kind you'd get on a real project:

> Analysts at a research firm need to search global news that arrives continuously. They ask in plain language ("port congestion in Southeast Asia") and they scope every search by country, topic, date range, and source. Some queries name one specific thing, a company ticker or a ship name, that has to match exactly.

Five questions turn that into a design.

### Question 1: What Do the Queries Look Like?

*Natural language? Exact tokens? Both?*

Both, and this is the most consequential observation in the design. "Port congestion in Southeast Asia" is semantic intent, which is dense territory. "MAERSK-B.CO" is an exact token carrying no meaning a dense model can use, so dense search blurs it into neighboring tickers, the failure you saw in Module 3 retrieving IDs like `SKU-48291`.

**Decision**: hybrid search, with named dense and sparse vectors on every point, fused at query time. *(Query layer.)*

The examples use `BAAI/bge-small-en-v1.5`, FastEmbed's default, which produces 384-dimensional vectors.

```python
# pip install "qdrant-client[fastembed]"

from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://YOUR-CLUSTER.cloud.qdrant.io", api_key="YOUR_API_KEY")

client.create_collection(
    collection_name="news",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            # Required for correct BM25 scoring, as discussed in Module 3
            modifier=models.Modifier.IDF
        ),
    },
)
```

### Question 2: What Must the System Filter On?

*Which constraints must hold on every result?*

Country, topic, date range, and source. An analyst scoping to "Vietnam, last seven days" expects those articles and no others, so these belong in the payload rather than the ranking.

**Decision**: the payload schema, designed before ingestion.

```yaml
payload:
  country: string         # indexed
  topic: string           # indexed
  source: string          # indexed
  published_at: datetime  # indexed
  headline: string        # returned, never filtered
  lead: string            # returned, never filtered
  body: string            # returned, never filtered
```

Create the indexes before a single point is uploaded. Qdrant adds filter-aware edges to the HNSW graph from indexed payload values, and only for indexes that exist when the graph is built. An index created later still filters correctly, but earning those edges means an [HNSW rebuild](/documentation/manage-data/indexing/). So the build order is: create the collection, create every payload index, then ingest. *(Knowledge and indexing layers.)*

```python
for field in ["country", "topic", "source"]:
    client.create_payload_index(
        collection_name="news",
        field_name=field,
        field_schema=models.PayloadSchemaType.KEYWORD,
    )

client.create_payload_index(
    collection_name="news",
    field_name="published_at",
    field_schema=models.PayloadSchemaType.DATETIME,
)
```

### Question 3: What's the Workload Shape?

*How much data, in what modalities, arriving how fast?*

Millions of articles, text-only, arriving continuously, and analysts expect this morning's news to be searchable this morning.

**Decision**: one collection, and continuous upserts rather than periodic rebuilds. An upsert writes a point if its ID is new and replaces it if the ID exists, so one call handles new articles and corrections.

The one-off load of everything you already have is different: batch it, and consider [disabling indexing until it finishes](/documentation/manage-data/bulk-upload/). After that, Qdrant indexes as it ingests, but not instantly. Points live in segments, self-contained slices of the collection, and a segment gets an HNSW index only once it grows past a threshold; until then it is searched by scanning. That lag is what to monitor: if unindexed points keep climbing, ingestion is outpacing indexing. *(Storage and knowledge layers.)*

### Question 4: What Does the Retrieval Pipeline Look Like?

*Dense-only? Hybrid? Reranking?*

The simplest pipeline that fits the query analysis: hybrid from Question 1, plus filters from Question 2, fused with Reciprocal Rank Fusion. No reranker yet. Fusion works from ranks, so it doesn't care that cosine similarity and BM25 live on different scales.

One knowledge-layer decision hides in here: **what you embed matters as much as how you search it.** A news article runs 800 words, and the ticker from Question 1 is one token inside it. Embed the whole body and that token is averaged into a vector about shipping in general. Embed the headline and the lead, keep the full text in the payload, and the dense vector stays about one story.

Note where the filter goes. It belongs inside each `Prefetch`, so both retrievers search only the valid subset.

```python
# Replace with the model you embedded with at ingestion. It has to be the same
# model, so this import is left deliberately broken rather than defaulting to one.
from your_embedding_model import embed_dense, embed_sparse

dense_vec = embed_dense("port congestion in Southeast Asia")
sparse_vec = embed_sparse("port congestion in Southeast Asia")

news_filter = models.Filter(
    must=[
        models.FieldCondition(key="country", match=models.MatchValue(value="VN")),
        models.FieldCondition(
            key="published_at",
            range=models.DatetimeRange(gte="2026-07-01T00:00:00Z"),
        ),
    ]
)

results = client.query_points(
    collection_name="news",
    prefetch=[
        models.Prefetch(query=dense_vec,  using="dense",  filter=news_filter, limit=50),
        models.Prefetch(query=sparse_vec, using="sparse", filter=news_filter, limit=50),
    ],
    query=models.RrfQuery(rrf=models.Rrf()),
    limit=10,
)
```

### Question 5: What Are the Deployment Constraints?

*Latency budget, data residency, cost, and who operates this thing?*

A small engineering team, no residency restrictions, and a "please don't page us at night" budget point to a managed deployment. The same design runs self-hosted if the constraints say otherwise, so treat the design and the deployment mode as independent decisions. Section 5 has the full option space. *(Distribution layer.)*

### Try It: Why Hybrid, Not Dense Alone

The [notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb) runs `MAERSK-B.CO delisting` three ways against nine articles, two of which differ only in the ticker. Dense search puts the right one first, but scores it 0.8120 against the decoy's 0.6956, a gap of 0.12. BM25 scores the same pair 11.79 and 2.59. On nine articles that thin dense margin still lands the right answer; on nine million it's noise.

Run it, then change the query to `HLAG-D.DE delisting` and watch which retriever keeps up.

### The Design on One Page

| Question | Answer for this system | Layer |
|----------|------------------------|-------|
| Query type | Mixed semantic + exact, so hybrid with Reciprocal Rank Fusion | Query |
| Filter scope | country, topic, source, date, indexed before ingestion | Knowledge, indexing |
| Workload shape | Millions of text chunks: bulk backfill, then continuous ingestion | Storage, knowledge |
| Pipeline | Hybrid + per-prefetch filters; headline and lead embedded; no reranker yet | Query, knowledge |
| Deployment | Managed; design independent of the choice | Distribution |

Run these five questions on anything you're asked to design, starting with the capstone in Module 5.

## 3. Filtering

Filtering decides whether your results are correct, so it's worth knowing what Qdrant does with a filter.

The naive approach is post-filtering: retrieve the top K by similarity, then discard whatever fails the filter. With a selective filter, one country out of 200, even a large K can come back empty. Qdrant works differently. A [query planner](/documentation/search/search/#query-planning) estimates how many points the filter will match and picks a strategy per segment: walk the HNSW graph and skip non-matching points, retrieve through the payload index when very few match, or scan a small segment. Filtering on every query is safe and fast, as long as every filtered field is indexed.

### Common Mistake: Filters in the Wrong Place

The client accepts a filter in two places on a hybrid query: inside each `Prefetch`, the way Question 4 does it, or as `query_filter` on the outer query.

Use the first. A per-prefetch filter narrows what each retriever searches, so both return 50 candidates that already satisfy the constraint, and it behaves the same way on every deployment mode. Local mode ignores an outer filter and raises no error. The notebook runs both: on the outer query it returns five results, four of which break the filter; inside the prefetches, the one valid point.

### The Filter Toolbox

| Condition | Logic | Example from the news system |
|-----------|-------|------------------------------|
| must | AND: all conditions true | country = VN AND topic = shipping |
| should | OR: at least one true | topic = shipping OR topic = logistics |
| must_not | Exclude matches | Exclude source = press-release-wire |
| Range | Numeric or datetime bounds | published_at within the last seven days |
| Geo | Radius, bounding box, or polygon | Events within 100 km of a port |
| MatchAny | Value in a set | source in ["reuters", "nikkei", "caixin"] |

Conditions compose. A realistic analyst query combines `must`, `Range`, `MatchAny`, and `must_not` in one filter, evaluated together while the search runs.

### Index What You Filter

**Every field you filter on gets a payload index**, with a [schema type](/documentation/manage-data/indexing/) matching the data. The index is also what lets Qdrant estimate how many points a filter will match, and without that estimate the planner is guessing. The query still returns results, just slowly, so a missing index can sit in production unnoticed for months. Qdrant Cloud rejects filters on unindexed fields rather than letting them degrade quietly.

### Scoping by User or Tenant

One pattern deserves a call-out, because you'll meet it in almost any multi-user product: **scoping every query to one customer's data.** The instinct is a collection per customer, which becomes millions of collections. Instead, add a `tenant_id` payload field to every point, index it with `is_tenant=True` so Qdrant keeps each tenant's data together on disk, and filter on it at every query.

```python
client.create_payload_index(
    collection_name="news",
    field_name="tenant_id",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        is_tenant=True,
    ),
)
```

That gives one collection with complete per-tenant isolation at query time. The field and the filter alone are already correct; `is_tenant` keeps them fast as the tenant count grows. The [multitenancy guide](/documentation/manage-data/multitenancy/) has the full pattern.

### Key Insight

Design the payload schema before you ingest, driven by one question: what will I need to filter on? Time, geography, identity, permissions, and status flags are the usual suspects. A payload index added later costs an HNSW rebuild before it's fully effective, and a field you never stored at all means re-ingesting everything.

## 4. The Production RAG Pipeline

Retrieval-Augmented Generation (RAG) retrieves passages from a vector search engine and hands them to a large language model as context, so the model answers from your data rather than from what it memorized in training. Give the news system an "ask a question, get an answer with sources" feature and you have one:

1. **Query understanding**: pull hard constraints (dates, country, topic) into a filter, and embed the query as a dense vector and a sparse vector.
2. **Hybrid retrieval**: one `query_points` call, filter on each prefetch, fused with `RrfQuery`, returning the top 20.
3. **Optional reranking**: a cross-encoder, a model that scores a query and a passage together rather than embedding each separately, reorders those 20 and keeps five. It reads every candidate at query time, so it only ever runs on a short list. Add it when evaluation shows the right passage landing at position 8 instead of position 2.
4. **Generation**: the top passages go in as context and the model writes the answer.

### Rule of Thumb

When RAG quality disappoints, improve step 2 before reaching for a bigger model in step 4. Retrieval quality caps answer quality: the model can't cite a passage it never received.

## 5. Deployment Options

The design runs unchanged on any of these. Which one is right depends on your constraints.

| Deployment Mode | Use When | Avoid When |
|-----------------|----------|------------|
| Local Mode | Prototyping, notebooks, CI tests, teaching | Production or benchmarking |
| Docker (Self-Hosted) | Full infra control, air-gapped, regulated environments | You don't yet have monitoring and backups |
| Managed Cloud | Small ops team, with upgrades, backups, and high availability handled for you | Data can't leave your infrastructure |
| Hybrid Cloud (Bring Your Own Kubernetes) | Data residency or security policy requires your infrastructure | Managed cloud would meet your needs, since Hybrid Cloud adds Kubernetes complexity |
| Private Cloud / On-Prem | Strictest requirements: defense, healthcare, finance | A lighter mode meets your needs |
| Edge | On-device search, offline, ultra-low latency | You need distributed search (Edge is single-node) |

![Qdrant deployment modes, from Local Mode and Docker through Managed Cloud, Hybrid Cloud, and Private Cloud to Edge, each mapped to when to use it and when to avoid it.](/courses/beginners/module-4/deployment.png)

One caveat about Local Mode, since it's where you'll run the course notebooks. It's a Python reimplementation, not the engine: search is exact rather than approximate, payload indexes have no effect, and a filter on the outer query is ignored. Verify against a real server before trusting numbers from a notebook.

## 6. Knowledge Check

{{< details summary="Name the five layers, and place 'chunk articles instead of embedding them whole' in the right one." >}}
Query, indexing, storage, knowledge, distribution. Chunking is a knowledge-layer decision, and no other layer can compensate for it.
{{< /details >}}

{{< details summary="Why is hybrid retrieval chosen from the start rather than dense-only?" >}}
The queries mix semantic intent with exact tokens. A ticker carries no semantics for a dense model, so in the notebook the dense gap between the right article and a near-identical one is 0.12, where BM25 separates the same pair by more than 4x.
{{< /details >}}

{{< details summary="What's wrong with post-filtering, and how does Qdrant avoid it?" >}}
Post-filtering retrieves the top K first and discards invalid results, so a selective filter can leave zero valid points. Qdrant's planner estimates how many points the filter will match and picks a strategy per segment.
{{< /details >}}

{{< details summary="In a hybrid query, where does the filter belong?" >}}
Inside each `Prefetch`, which narrows what each retriever searches and behaves the same on every deployment mode. Local mode ignores an outer `query_filter` without raising an error.
{{< /details >}}

{{< details summary="Why does per-tenant scoping use a payload filter instead of one collection per tenant?" >}}
Collections don't scale to millions of tenants operationally. An indexed `tenant_id` field, filtered on at every query, gives isolation in one collection, and `is_tenant=True` keeps it fast as the tenant count grows.
{{< /details >}}

## 7. References & Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, weighted Reciprocal Rank Fusion, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/): payload index types, filter-aware edges, and rebuilding an HNSW index.
- [Query Planning](/documentation/search/search/#query-planning): how Qdrant picks a strategy per segment.
- [Filtering](/documentation/search/filtering/): full filter syntax, including nested conditions.
- [Multitenancy](/documentation/manage-data/multitenancy/): tenant scoping, tenant indexes, and tenant-aware vector indexes.
- [Bulk Upload](/documentation/manage-data/bulk-upload/): batch sizes and disabling indexing during a large load.
- [Hybrid Search with FastEmbed](/documentation/tutorials-develop/hybrid-search-fastembed/): dense and sparse retrieval end to end, as runnable code.
- [Deploy Qdrant](/documentation/deploy-intro/): every deployment mode with its configuration reference.
- [Qdrant Cloud](https://cloud.qdrant.io/): create a free cluster before Module 5, so the capstone runs against a real server.

## What's Next: Module 5

The capstone extends the system you just designed. Same five questions, bigger answers:

- Ingest daily news, audio, and satellite imagery about suppliers, so three modalities instead of one
- Embed each modality into named vectors on shared points
- Cluster signals into risk themes across suppliers
